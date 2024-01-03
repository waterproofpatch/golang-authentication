import argparse

from email_handlers import send_email

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--recipient", type=str, help="Recipient email address", required=True
    )
    parser.add_argument("--content", type=str, help="Email content", required=True)
    parser.add_argument("--subject", type=str, help="Email subject line", required=True)
    args = parser.parse_args()
    send_email(args.recipient, args.content, args.subject)
