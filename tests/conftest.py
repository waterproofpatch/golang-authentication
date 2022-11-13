import subprocess
import docker
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


@pytest.fixture(scope="function", autouse=True)
def start_server(admin_email: str, admin_password: str):
    def _kill(proc_pid):
        process = psutil.Process(proc_pid)
        for proc in process.children(recursive=True):
            proc.kill()
        process.kill()

    client = docker.from_env()
    logs = client.containers.run(
        "golang-backend-app",
        auto_remove=True,
        environment={
            "DEFAULT_ADMIN_USER": admin_email,
            "DEFAULT_ADMIN_PASSWORD": admin_password,
            "SECRET": "123",
            "DROP_TABLES": "true",
            "PORT": "5000",
            "DEFAULT_ADMIN_USER": "admin@gmail.com",
            "DEFAULT_ADMIN_PASSWORD": "admin123",
            "DATABASE_URL": "postgres://app-db-user:app-db-password@192.168.1.252:5432/app-db",
        },
        detach=True,
    )
    import pdb

    pdb.set_trace()

    try:
        yield
    finally:
        _kill(proc.pid)


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
