import subprocess
import docker
import time
import requests
import json
import os
from typing import Optional
import pytest
import psutil
import requests
from urllib.parse import urljoin
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

from lib.user import User
from lib import constants

# not on by default
pytest_plugins = ["docker_compose"]


@pytest.fixture(scope="session", autouse=True)
def admin_password() -> str:
    return constants.ADMIN_PASSWORD


@pytest.fixture(scope="session", autouse=True)
def admin_email() -> str:
    return constants.ADMIN_EMAIL

@pytest.fixture(scope="session", autouse=True)
def admin_username() -> str:
    return constants.ADMIN_USERNAME


@pytest.fixture(scope="session", autouse=True)
def hostname() -> str:
    return "localhost"


@pytest.fixture(scope="session", autouse=True)
def port() -> int:
    return constants.PORT


@pytest.fixture(scope="function", autouse=True)
def wait_for_api(function_scoped_container_getter, port: int, admin_username: str, admin_email: str, admin_password: str):
    """Wait for the api from my_api_service to become responsive"""
    request_session = requests.Session()
    retries = Retry(total=5,
                    backoff_factor=0.1,
                    status_forcelist=[500, 502, 503, 504])
    request_session.mount('http://', HTTPAdapter(max_retries=retries))

    service = function_scoped_container_getter.get("db")
    time.sleep(3)
    client = docker.from_env()
    container = client.containers.run(
        "pointinsertion.azurecr.io/backend-prod",
        auto_remove=True,
        environment={
            "DEFAULT_ADMIN_USERNAME": admin_username,
            "DEFAULT_ADMIN_EMAIL": admin_email,
            "DEFAULT_ADMIN_PASSWORD": admin_password,
            "REFRESH_SECRET": "456",
            "SECRET": "123",
            "DROP_TABLES": "true",
            "PORT": port,
            "DATABASE_URL": "postgres://app-db-user:app-db-password@192.168.1.252:5432/app-db",
        },
        detach=True,  # remove container after it is stopped
        ports={port: port},
    )
    print(f"Container started, name: {container.name} logs: {container.logs()}")

    time.sleep(1)
    try:
        yield
    finally:
        container.stop()
    return

@pytest.fixture(scope="function")
def create_user(guest_user: User):
    """
    Create a new user
    """
    payload = dict(
        email=constants.GUEST_EMAIL,
        password=constants.GUEST_PASSWORD,
        username=constants.GUEST_USERNAME,
    )
    res = guest_user.post("/api/register", json=payload)
    assert (
        res.status_code == 200
    ), f"Registration failed: {res.text} - {json.loads(res.text)}"


@pytest.fixture(scope="function")
def guest_user(hostname: str, port: int):
    yield User(host=hostname, port=port)


@pytest.fixture(scope="function")
def admin_user(hostname: str, port: int, admin_email: str, admin_password: str, admin_username: str) -> User:
    user = User(host=hostname, port=port)
    user.login(email=admin_email, username=admin_username, password=admin_password)
    yield user
