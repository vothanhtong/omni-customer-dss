"""Thao tác MongoDB chạy đúng với cả driver đồng bộ (PyMongo) lẫn bất đồng bộ (Motor) — dùng CSDL giả trong bộ nhớ."""
import asyncio

import pytest

from backend.app.core.database import MongoDBManager


class FakeCursor:
    def __init__(self, docs, is_async):
        self.docs, self.is_async = list(docs), is_async

    def sort(self, key, direction):
        self.docs.sort(key=lambda d: d.get(key, 0), reverse=direction < 0)
        return self

    def limit(self, n):
        self.docs = self.docs[:n]
        return self

    def __iter__(self):
        return iter(self.docs)

    async def to_list(self, length=None):
        return self.docs[:length] if length else self.docs


class FakeCollection:
    def __init__(self, is_async):
        self.rows, self.is_async = [], is_async

    def _ret(self, v):
        if not self.is_async:
            return v

        async def coro():
            return v
        return coro()

    def _add(self, doc):
        doc["_id"] = len(self.rows)  # giống driver thật: gắn _id vào dict được truyền vào
        self.rows.append(doc)

    def insert_one(self, doc):
        self._add(doc)
        return self._ret(None)

    def insert_many(self, docs, ordered=True):
        for d in docs:
            self._add(d)
        return self._ret(None)

    def _match(self, q):
        def ok(r):
            for k, v in q.items():
                if isinstance(v, dict) and "$in" in v:
                    if r.get(k) not in v["$in"]:
                        return False
                elif r.get(k) != v:
                    return False
            return True
        return [{k: v for k, v in r.items() if k != "_id"} for r in self.rows if ok(r)]

    def find(self, q, proj=None):
        return FakeCursor(self._match(q), self.is_async)

    def find_one(self, q, proj=None):
        m = self._match(q)
        return self._ret(m[0] if m else None)

    def update_one(self, q, upd, upsert=False):
        for r in self.rows:
            if all(r.get(k) == v for k, v in q.items()):
                r.update(upd["$set"])
                return self._ret(None)
        if upsert:
            self.rows.append({**q, **upd["$set"]})
        return self._ret(None)


class FakeDB(dict):
    def __init__(self, is_async):
        super().__init__()
        self.is_async = is_async

    def __missing__(self, name):
        self[name] = FakeCollection(self.is_async)
        return self[name]


def make(is_async):
    m = MongoDBManager()
    m.db, m.is_connected = FakeDB(is_async), True
    m.driver_type = "Motor (Async)" if is_async else "PyMongo (Sync)"
    return m


@pytest.mark.parametrize("is_async", [False, True])
def test_crud_roundtrip_both_drivers(is_async):
    async def scenario():
        m = make(is_async)
        rec = {"ref": "r1", "action": "a", "triggered_at": "2026-01-01"}
        assert await m.save_customer_action(rec) is True
        assert "_id" not in rec  # dict của caller không bị driver sửa
        await m.save_customer_action({"ref": "r1", "action": "b", "triggered_at": "2026-01-02"})
        assert (await m.get_customer_actions(["r1", "x"]))["r1"]["action"] == "b"  # bản mới nhất

        assert await m.save_dss_logs([{"customer_id": "C1"}, {"customer_id": "C2"}]) is True
        assert await m.save_dss_logs([]) is False
        assert len(await m.get_recent_dss_logs(limit=1)) == 1

        assert await m.create_user({"email": "a@x.vn", "fullName": "A"}) is True
        assert (await m.get_user_by_email("a@x.vn"))["fullName"] == "A"
        upd = await m.update_user_profile(" A@x.vn ", {"fullName": "B", "phone": None})
        assert upd["fullName"] == "B" and "phone" not in upd
        assert [u["email"] for u in await m.get_all_users()] == ["a@x.vn"]
    asyncio.run(scenario())


def test_offline_and_errors_return_defaults():
    async def scenario():
        m = MongoDBManager()  # chưa kết nối
        assert await m.save_dss_log({"x": 1}) is False
        assert await m.get_customer_actions(["r"]) == {}
        assert await m.get_user_by_email("a") is None

        broken = make(False)
        broken.db = None
        broken.is_connected = True
        assert await broken.get_all_users() == []

        class Boom(FakeDB):
            def __missing__(self, name):
                raise RuntimeError("mất kết nối")
        err = make(False)
        err.db = Boom(False)
        assert await err.save_batch_job({"n": 1}) is False  # lỗi được bắt, trả mặc định
    asyncio.run(scenario())
