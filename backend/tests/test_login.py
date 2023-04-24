import pytest
import json

from lib.user import User
from lib import constants

@pytest.mark.usefixtures("create_user")
def test_login(guest_user: User):
    payload = dict(
        email=constants.GUEST_EMAIL,
        password=constants.GUEST_PASSWORD,
    )
    res = guest_user.post("/api/login", json=payload)
    assert (
        res.status_code == 200
    ), f"Registration failed: {res.text} - {json.loads(res.text)}"