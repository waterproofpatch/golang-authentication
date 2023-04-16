import os
import argparse
from azure.communication.email import EmailClient
from azure.identity import DefaultAzureCredential

def send_email(recipient: str, plant_name: str, username: str) -> None:
        """
        Send an email to a recipient about a plant that needs to be watered.
        :param recpient: email address.
        :param plant_name: the name of the plant.
        :param username: the username of the user who owns the plant.
        """
        try:
                conn_string = os.environ['AZ_EMAIL_CONNECTION_STRING']
                sender_address = os.environ['AZ_EMAIL_SENDER_ADDRESS']
                if not conn_string or not sender_address:
                        raise RuntimeError("No AZ_EMAIL_CONNECTION_STRING or AZ_EMAIL_SENDER_ADDRESS set in the environment.")

                email_client = EmailClient.from_connection_string(conn_string)

                message = {
                        "content": {
                                "subject": f"Time to water {plant_name}!",
                                "plainText": f"Time to water plant {plant_name}",
                                "html": f"<html><h1>It's time to water {plant_name}</h1></html>"
                        },
                        "recipients": {
                                "to": [
                                {
                                        "address": f"{recipient}",
                                        "displayName": f"{username}"
                                }
                                ]
                        },
                        "senderAddress": f"{sender_address}"
                }

                poller = email_client.begin_send(message)
                print(f"Result: {poller.result()}")
        except Exception as ex:
                print(f'Exception: {ex}')
if __name__ == "__main__":
        parser = argparse.ArgumentParser()
        parser.add_argument("--recipient", type=str, help="email", required=True)
        parser.add_argument("--username", type=str, help="username", required=True)
        parser.add_argument("--plant-name", type=str, help="name of plant to water", required=True)
        args = parser.parse_args()
        send_email(args.recipient, args.plant_name, args.username)