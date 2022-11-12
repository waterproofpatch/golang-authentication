import subprocess
import time
import json
import os
from typing import Optional
import pytest
import psutil

from lib.user import User
from lib import constants


@pytest.fixture(scope="session", autouse=True)
def admin_password() -> str:
    return constants.ADMIN_PASSWORD


@pytest.fixture(scope="session", autouse=True)
def admin_email() -> str:
    return constants.ADMIN_EMAIL


@pytest.fixture(scope="session", autouse=True)
def hostname() -> str:
    return "localhost"


@pytest.fixture(scope="session", autouse=True)
def port() -> int:
    return constants.PORT


# @pytest.fixture(scope="function", autouse=True)
# def start_server(port: int, coach_email: str, coach_password: str):
#     def _kill(proc_pid):
#         process = psutil.Process(proc_pid)
#         for proc in process.children(recursive=True):
#             proc.kill()
#         process.kill()

#     my_env = os.environ.copy()
#     my_env["PORT"] = str(port)  # env vars need to be strings for subprocess.run
#     my_env["DATABASE_URL"] = "postgres://tennis:docker@localhost:5432/tennis-db"
#     my_env["COACH_USER"] = coach_email
#     my_env["COACH_PASS"] = coach_password
#     my_env["SECRET"] = "secrettoken"
#     my_env["DROP_TABLES"] = "true"
#     proc = subprocess.Popen(
#         args="go run .",
#         stdout=subprocess.PIPE,
#         stderr=subprocess.PIPE,
#         shell=True,
#         cwd="../backend/src",
#         env=my_env,
#     )

#     # wait for server startup
#     time.sleep(3)

#     try:
#         yield
#     finally:
#         _kill(proc.pid)


@pytest.fixture(scope="function")
def create_user(guest_user: User):
    """
    Create a new user
    """
    payload = dict(
        email=constants.GUEST_EMAIL,
        password=constants.GUEST_PASSWORD,
    )
    res = guest_user.post("/api/register", json=payload)
    assert (
        res.status_code == 200
    ), f"Registration failed: {res.text} - {json.loads(res.text)}"


@pytest.fixture(scope="function")
def guest_user(hostname: str, port: int):
    yield User(host=hostname, port=port)


@pytest.fixture(scope="function")
def admin_user(hostname: str, port: int, admin_email: str, admin_password: str):
    user = User(host=hostname, port=port)
    user.login(email=admin_email, password=admin_password)
    yield user
