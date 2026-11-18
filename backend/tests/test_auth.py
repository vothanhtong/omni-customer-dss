import pytest


def _login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def _h(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def biz_token(client):
    return _login(client, "business@retail.vn", "user123").json()["access_token"]


@pytest.fixture
def admin_token(client):
    return _login(client, "admin@omni-dss.vn", "admin123").json()["access_token"]


def test_db_status_does_not_leak_connection_string(client):
    assert client.get("/api/db/status").json() == {"status": "offline"}


@pytest.mark.parametrize("email,password", [
    ("admin@omni-dss.vn", "sai-mat-khau"),
    ("fakeadmin@x.vn", "x"),          # bypass cũ: email chứa 'admin'
    ("khong-ton-tai@x.vn", "123456"),
])
def test_login_rejects_bad_credentials(client, email, password):
    assert _login(client, email, password).status_code == 401


def test_login_returns_token_without_password(client):
    body = _login(client, "admin@omni-dss.vn", "admin123").json()
    assert body["access_token"] and body["token_type"] == "bearer"
    assert "password" not in body["user"]


def test_profile_requires_token(client):
    assert client.put("/api/auth/profile", json={"fullName": "X"}).status_code == 401
    assert client.put("/api/auth/profile", json={"fullName": "X"}, headers=_h("abc.def.ghi")).status_code == 401


def test_cannot_edit_other_profile(client, biz_token):
    r = client.put("/api/auth/profile", json={"email": "admin@omni-dss.vn", "fullName": "Hacked"}, headers=_h(biz_token))
    assert r.status_code == 403


def test_can_edit_own_profile(client, biz_token):
    r = client.put("/api/auth/profile", json={"phone": "0911111111"}, headers=_h(biz_token))
    assert r.status_code == 200 and r.json()["phone"] == "0911111111"
    assert client.get("/api/auth/me", headers=_h(biz_token)).json()["phone"] == "0911111111"


def test_users_list_admin_only(client, biz_token, admin_token):
    assert client.get("/api/auth/users", headers=_h(biz_token)).status_code == 403
    r = client.get("/api/auth/users", headers=_h(admin_token))
    assert r.status_code == 200 and all("password" not in u for u in r.json())


def test_self_register_admin_forbidden(client):
    r = client.post("/api/auth/register", json={"fullName": "A", "email": "a-admin@x.vn", "password": "123456", "role": "admin"})
    assert r.status_code == 403


def test_register_and_login_business_user(client):
    r = client.post("/api/auth/register", json={"fullName": "B", "email": "b-user@x.vn", "password": "123456"})
    assert r.status_code == 200 and r.json()["access_token"]
    assert _login(client, "b-user@x.vn", "123456").status_code == 200
    from backend.app.core.user_store import find_fallback_user
    assert find_fallback_user("b-user@x.vn")["password"].startswith("$2b$")


def test_cors_rejects_unknown_origin(client):
    pre = {"Access-Control-Request-Method": "POST"}
    assert "access-control-allow-origin" not in client.options("/api/auth/login", headers={**pre, "Origin": "http://evil.com"}).headers
    ok = client.options("/api/auth/login", headers={**pre, "Origin": "http://localhost:5173"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:5173"
