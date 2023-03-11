import pytest
import json

from lib.user import User
from lib import constants


def test_create_new_user(guest_user: User):
    payload = dict(
        email="test@gmail.com",
        password="password",
        username="username",
    )
    res = guest_user.post("/api/register", json=payload)
    assert (
        res.status_code == 200
    ), f"Registration failed: {res.text} - {json.loads(res.text)}"


@pytest.mark.usefixtures("create_user")
def test_create_duplicate_user(guest_user: User):
    payload = dict(
        email=constants.GUEST_EMAIL,  # duplicate
        password=constants.GUEST_PASSWORD,
        username="username2", # don't dupe
    )
    res = guest_user.post("/api/register", json=payload)
    assert res.status_code == 400, "Registration succeeded"


@pytest.mark.usefixtures("create_user")
def test_invalid_password(guest_user: User):
    payload = dict(
        email="test123@gmail.com",  # duplicate
        password="",
        username="username", 
    )
    res = guest_user.post("/api/register", json=payload)
    assert res.status_code == 400, "Registration succeeded"
