import requests

version = requests.get("https://strider.azurewebsites.net/api/version")
print(f"version={version}, {version.json()['version']}")