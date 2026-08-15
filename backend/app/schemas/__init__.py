"""Schemas package initialization with helper utilities."""

def dump_model(model):
    """Helper chuyển đổi Pydantic model sang dict tương thích cả Pydantic v1 và v2."""
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()
