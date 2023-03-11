import json
from typing import Dict, Optional

import requests
from requests.auth import HTTPBasicAuth


class User:
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self.session = requests.Session()

    def register(self, email: str, username: str, password: str):
        res = self.post("/api/register", {"email": email, "username": username, "password": password})
        assert res.status_code == 200, f"Failed loging in: {res.text}"
        self.session.headers = {
            "Authorization": f"Bearer {json.loads(res.text)['token']}"
        }

    def login(self, email: str, username: str, password: str):
        res = self.post("/api/login", {"email": email, "password": password, "username": username})
        assert res.status_code == 200, f"Failed loging in: {res.text}"
        self.session.headers = {
            "Authorization": f"Bearer {json.loads(res.text)['token']}"
        }

    def post(self, url: str, json: Dict):
        return self.session.post(url=f"http://{self.host}:{self.port}{url}", json=json)

    def put(self, url: str, json: Dict):
        return self.session.put(url=f"http://{self.host}:{self.port}{url}", json=json)

    def get(self, url: str):
        return self.session.get(url=f"http://{self.host}:{self.port}{url}")

    def delete(self, url: str):
        return self.session.delete(url=f"http://{self.host}:{self.port}{url}")
