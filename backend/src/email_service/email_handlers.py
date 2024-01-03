import os
from typing import Tuple

from azure.communication.email import EmailClient
from azure.identity import DefaultAzureCredential


def _get_az_email_client() -> Tuple[EmailClient, str]:
    conn_string = os.environ["AZ_EMAIL_CONNECTION_STRING"]
    sender_address = os.environ["AZ_EMAIL_SENDER_ADDRESS"]
    if not conn_string or not sender_address:
        raise RuntimeError(
            "No AZ_EMAIL_CONNECTION_STRING or AZ_EMAIL_SENDER_ADDRESS set in the environment."
        )

    email_client = EmailClient.from_connection_string(conn_string)
    return email_client, sender_address


def send_care_email(
    recipient: str,
    plant_name: str,
    username: str,
    needs_fertilizer: bool,
    needs_water: bool,
) -> None:
    """
    Send an email to a recipient about a plant that needs to be cared for.
    :param recpient: email address.
    :param plant_name: the name of the plant.
    :param username: the username of the user who owns the plant.
    :param needs_fertilizer: if the plant needs fertilizing
    :param needs_water: if the plant needs water
    """
    if (
        os.environ.get("DEBUG_EMAIL", False)
        and os.environ.get("DEBUG_EMAIL") != recipient
    ):
        print("Debug email does not match recipient. Not sending.")
        return
    try:
        email_client, sender_address = _get_az_email_client()

        content = "Time to "
        if needs_fertilizer:
            content += "fertilize"
        if needs_water:
            if needs_fertilizer:
                content += " and "
            content += "water"
        content += f" {plant_name}"

        message = {
            "content": {
                "subject": f"{plant_name} needs some care!",
                # "plainText": f"Time to water plant {plant_name}",
                "plainText": content,
                "html": f"<html><p>{content}. Visit https://www.plantmindr.com to view your plants.</p></html>",
            },
            "recipients": {
                "to": [{"address": f"{recipient}", "displayName": f"{username}"}]
            },
            "senderAddress": f"{sender_address}",
        }

        poller = email_client.begin_send(message)
        print(f"Result: {poller.result()}")
    except Exception as ex:
        print(f"Exception: {ex}")


def send_email(email_address: str, content: str, subject: str) -> None:
    try:
        email_client, sender_address = _get_az_email_client()

        message = {
            "content": {
                "subject": subject,
                "plainText": content,
                "html": f"<html><p>{content}</p></html>",
            },
            "recipients": {
                "to": [
                    {"address": f"{email_address}", "displayName": f"{email_address}"}
                ]
            },
            "senderAddress": f"{sender_address}",
        }

        poller = email_client.begin_send(message)
        print(f"Result: {poller.result()}")
    except Exception as ex:
        print(f"Exception: {ex}")
