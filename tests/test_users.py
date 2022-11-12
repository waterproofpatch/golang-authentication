import pytest

from lib.user import User


@pytest.fixture(params=["/api/users", "/api/users/1"])
def url(request):
    yield request.param


def test_get_allowed(admin_user: User, url: str):
    assert admin_user.get(url).status_code == 200


def test_get_not_allowed(guest_user: User, url: str):
    assert guest_user.get(url).status_code == 401


def test_put_bad_request(admin_user: User, url: str):
    assert admin_user.put(url, json={}).status_code == 400


def test_put_not_allowed(guest_user: User, url: str):
    assert guest_user.put(url, json={}).status_code == 401


def test_post_not_allowed(guest_user: User):
    assert guest_user.post("/api/users/1", json={}).status_code == 401