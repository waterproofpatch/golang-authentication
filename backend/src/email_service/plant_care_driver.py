import os
import argparse

from email_handlers import send_email

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--recipient", type=str, help="email", required=True)
    parser.add_argument("--content", type=str, help="content", required=True)
    args = parser.parse_args()
    send_email(
        args.recipient,
        args.content,
    )
