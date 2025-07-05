import os
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request


#will be responsible for createion of different services of goolge 
def create_services(client_secret_file, api_name, api_version, scopes, prefix = ''):
    CLIENT_SECRET_FILE = client_secret_file
    API_SERVICE_NAME = api_name
    API_VERSION = api_version

    SCOPES = scopes

    creds = None
    working_dir = os.getcwd()
    token_dir_name = 'token files'
    token_file_name = f'token_{API_SERVICE_NAME}_{API_VERSION}{prefix}.json'
    token_dir_path = os.path.join(working_dir, token_dir_name)
    token_file_path = os.path.join(token_dir_path, token_file_name)

    # Ensure the token directory exists
    if not os.path.exists(token_dir_path):
        os.makedirs(token_dir_path, exist_ok=True)
    
    if os.path.exists(token_file_path):
        creds = Credentials.from_authorized_user_file(token_file_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_file_path, 'w') as token:
            token.write(creds.to_json())


    try:
        service = build(API_SERVICE_NAME, API_VERSION, credentials=creds, static_discovery=False)
        print(API_SERVICE_NAME, API_VERSION, 'service created sucessfully')
        return service
    except Exception as e:
        print(e)
        print(f'Failed to create services instance for {API_SERVICE_NAME}')
        if os.path.exists(token_file_path):
            os.remove(token_file_path)
        return None
