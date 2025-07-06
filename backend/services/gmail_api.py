import os
import base64
import logging
from typing import List, Dict, Optional, Union
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from .google_apis import create_services

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GmailAPIError(Exception):
    """Custom exception for Gmail API errors"""
    pass

class GmailAPI:
    """Enhanced Gmail API wrapper with improved error handling and features"""
    
    def __init__(self, client_file: str, api_name: str = 'gmail', 
                 api_version: str = 'v1', scopes: List[str] = None):
        """Initialize Gmail API service"""
        if scopes is None:
            scopes = ['https://mail.google.com/']
        
        try:
            self.service = create_services(client_file, api_name, api_version, scopes)
            logger.info("Gmail API service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gmail API service: {e}")
            raise GmailAPIError(f"Service initialization failed: {e}")
    
    def _extract_body(self, payload: Dict) -> str:
        """Extract email body from payload with improved handling"""
        body = '<Text body not available>'
        
        try:
            if 'parts' in payload:
                for part in payload['parts']:
                    if part['mimeType'] == 'multipart/alternative':
                        for subpart in part['parts']:
                            if subpart['mimeType'] == 'text/plain' and 'data' in subpart['body']:
                                body = base64.urlsafe_b64decode(subpart['body']['data']).decode('utf-8')
                                break
                    elif part['mimeType'] == 'text/plain' and 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                        break
                    elif part['mimeType'] == 'text/html' and 'data' in part['body'] and body == '<Text body not available>':
                        # Fallback to HTML if plain text not available
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
            elif 'body' in payload and 'data' in payload['body']:
                body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        except Exception as e:
            logger.warning(f"Failed to extract email body: {e}")
        
        return body
    
    def get_messages(self, user_id: str = 'me', label_ids: List[str] = None, 
                    folder_name: str = 'INBOX', max_results: int = 5) -> List[Dict]:
        """Get email messages with improved error handling"""
        messages = []
        next_page_token = None
        
        try:
            # Handle folder name to label ID conversion
            if folder_name:
                label_result = self.service.users().labels().list(userId=user_id).execute()
                labels = label_result.get('labels', [])
                folder_label_id = next((label['id'] for label in labels 
                                      if label['name'].lower() == folder_name.lower()), None)
                
                if folder_label_id:
                    if label_ids:
                        label_ids.append(folder_label_id)
                    else:
                        label_ids = [folder_label_id]
                else:
                    raise GmailAPIError(f"Folder '{folder_name}' not found")
            
            while True:
                result = self.service.users().messages().list(
                    userId=user_id,
                    labelIds=label_ids,
                    maxResults=min(500, max_results - len(messages)) if max_results else 500,
                    pageToken=next_page_token
                ).execute()
                
                messages.extend(result.get('messages', []))
                next_page_token = result.get('nextPageToken')
                
                if not next_page_token or (max_results and len(messages) >= max_results):
                    break
            
            logger.info(f"Retrieved {len(messages)} messages")
            return messages[:max_results] if max_results else messages
            
        except Exception as e:
            logger.error(f"Failed to get messages: {e}")
            raise GmailAPIError(f"Failed to retrieve messages: {e}")
    
    def get_message_details(self, msg_id: str, user_id: str = 'me') -> Dict:
        """Get detailed information about a specific message"""
        try:
            message = self.service.users().messages().get(
                userId=user_id, id=msg_id, format='full'
            ).execute()
            
            payload = message['payload']
            headers = payload.get('headers', [])
            
            # Extract headers with safer approach
            header_dict = {header['name'].lower(): header['value'] for header in headers}
            
            return {
                'id': msg_id,
                'subject': header_dict.get('subject', 'No subject'),
                'sender': header_dict.get('from', 'No sender'),
                'recipients': header_dict.get('to', 'No recipients'),
                'cc': header_dict.get('cc', ''),
                'bcc': header_dict.get('bcc', ''),
                'date': header_dict.get('date', 'No date'),
                'body': self._extract_body(payload),
                'snippet': message.get('snippet', 'No snippet'),
                'has_attachments': any(part.get('filename') for part in payload.get('parts', []) 
                                     if part.get('filename')),
                'starred': 'STARRED' in message.get('labelIds', []),
                'labels': message.get('labelIds', []),
                'thread_id': message.get('threadId', ''),
                'size_estimate': message.get('sizeEstimate', 0)
            }
            
        except Exception as e:
            logger.error(f"Failed to get message details for {msg_id}: {e}")
            raise GmailAPIError(f"Failed to retrieve message details: {e}")
    
    def send_email(self, to: Union[str, List[str]], subject: str, body: str, 
                   body_type: str = 'plain', cc: str = None, bcc: str = None,
                   attachment_paths: List[Union[str, Path]] = None) -> Dict:
        """Send email with enhanced features"""
        try:
            message = MIMEMultipart()
            
            # Handle multiple recipients
            if isinstance(to, list):
                message['To'] = ', '.join(to)
            else:
                message['To'] = to
            
            message['Subject'] = subject
            
            if cc:
                message['Cc'] = cc
            if bcc:
                message['Bcc'] = bcc
            
            # Validate body type
            if body_type.lower() not in ['plain', 'html']:
                raise ValueError("body_type must be either 'plain' or 'html'")
            
            message.attach(MIMEText(body, body_type.lower()))
            
            # Handle attachments
            if attachment_paths:
                for attachment_path in attachment_paths:
                    attachment_path = Path(attachment_path)
                    
                    if not attachment_path.exists():
                        raise FileNotFoundError(f"Attachment not found: {attachment_path}")
                    
                    with open(attachment_path, "rb") as attachment:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(attachment.read())
                    
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename={attachment_path.name}"
                    )
                    message.attach(part)
            
            # Send message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            sent_message = self.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            logger.info(f"Email sent successfully. Message ID: {sent_message['id']}")
            return sent_message
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise GmailAPIError(f"Failed to send email: {e}")
    
    def search_emails(self, query: str, user_id: str = 'me', max_results: int = 5) -> List[Dict]:
        """Search emails with query"""
        messages = []
        next_page_token = None
        
        try:
            while True:
                result = self.service.users().messages().list(
                    userId=user_id,
                    q=query,
                    maxResults=min(500, max_results - len(messages)) if max_results else 500,
                    pageToken=next_page_token
                ).execute()
                
                messages.extend(result.get('messages', []))
                next_page_token = result.get('nextPageToken')
                
                if not next_page_token or (max_results and len(messages) >= max_results):
                    break
            
            logger.info(f"Found {len(messages)} messages for query: {query}")
            return messages[:max_results] if max_results else messages
            
        except Exception as e:
            logger.error(f"Failed to search emails: {e}")
            raise GmailAPIError(f"Failed to search emails: {e}")
    
    def create_label(self, name: str, label_list_visibility: str = 'labelShow',
                    message_list_visibility: str = 'show') -> Dict:
        """Create a new label"""
        try:
            label = {
                'name': name,
                'labelListVisibility': label_list_visibility,
                'messageListVisibility': message_list_visibility
            }
            created_label = self.service.users().labels().create(
                userId='me', body=label
            ).execute()
            
            logger.info(f"Label '{name}' created successfully")
            return created_label
            
        except Exception as e:
            logger.error(f"Failed to create label '{name}': {e}")
            raise GmailAPIError(f"Failed to create label: {e}")
    
    def list_labels(self) -> List[Dict]:
        """List all labels"""
        try:
            results = self.service.users().labels().list(userId='me').execute()
            labels = results.get('labels', [])
            logger.info(f"Retrieved {len(labels)} labels")
            return labels
            
        except Exception as e:
            logger.error(f"Failed to list labels: {e}")
            raise GmailAPIError(f"Failed to list labels: {e}")
    
    def modify_message_labels(self, message_id: str, add_labels: List[str] = None,
                             remove_labels: List[str] = None, user_id: str = 'me') -> Dict:
        """Modify labels on a message"""
        try:
            body = {}
            if add_labels:
                body['addLabelIds'] = add_labels
            if remove_labels:
                body['removeLabelIds'] = remove_labels
            
            if not body:
                raise ValueError("Must specify either add_labels or remove_labels")
            
            result = self.service.users().messages().modify(
                userId=user_id, id=message_id, body=body
            ).execute()
            
            logger.info(f"Modified labels for message {message_id}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to modify labels for message {message_id}: {e}")
            raise GmailAPIError(f"Failed to modify message labels: {e}")
    
    def trash_message(self, message_id: str, user_id: str = 'me') -> Dict:
        """Move message to trash"""
        try:
            result = self.service.users().messages().trash(
                userId=user_id, id=message_id
            ).execute()
            
            logger.info(f"Message {message_id} moved to trash")
            return result
            
        except Exception as e:
            logger.error(f"Failed to trash message {message_id}: {e}")
            raise GmailAPIError(f"Failed to trash message: {e}")
    
    def batch_trash_messages(self, message_ids: List[str], user_id: str = 'me') -> None:
        """Trash multiple messages in batch"""
        try:
            batch = self.service.new_batch_http_request()
            for message_id in message_ids:
                batch.add(self.service.users().messages().trash(userId=user_id, id=message_id))
            
            batch.execute()
            logger.info(f"Trashed {len(message_ids)} messages in batch")
            
        except Exception as e:
            logger.error(f"Failed to batch trash messages: {e}")
            raise GmailAPIError(f"Failed to batch trash messages: {e}")
    
    def create_draft(self, to: Union[str, List[str]], subject: str, body: str,
                    body_type: str = 'plain', cc: str = None, bcc: str = None,
                    attachment_paths: List[Union[str, Path]] = None) -> Dict:
        """Create email draft"""
        try:
            message = MIMEMultipart()
            
            # Handle multiple recipients
            if isinstance(to, list):
                message['To'] = ', '.join(to)
            else:
                message['To'] = to
            
            message['Subject'] = subject
            
            if cc:
                message['Cc'] = cc
            if bcc:
                message['Bcc'] = bcc
            
            if body_type.lower() not in ['plain', 'html']:
                raise ValueError("body_type must be either 'plain' or 'html'")
            
            message.attach(MIMEText(body, body_type.lower()))
            
            # Handle attachments
            if attachment_paths:
                for attachment_path in attachment_paths:
                    attachment_path = Path(attachment_path)
                    
                    if not attachment_path.exists():
                        raise FileNotFoundError(f"Attachment not found: {attachment_path}")
                    
                    with open(attachment_path, "rb") as attachment:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(attachment.read())
                    
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename={attachment_path.name}"
                    )
                    message.attach(part)
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            draft = self.service.users().drafts().create(
                userId='me',
                body={'message': {'raw': raw_message}}
            ).execute()
            
            logger.info(f"Draft created successfully. Draft ID: {draft['id']}")
            return draft
            
        except Exception as e:
            logger.error(f"Failed to create draft: {e}")
            raise GmailAPIError(f"Failed to create draft: {e}")
    
    def send_draft(self, draft_id: str) -> Dict:
        """Send a draft email"""
        try:
            sent_message = self.service.users().drafts().send(
                userId='me',
                body={'id': draft_id}
            ).execute()
            
            logger.info(f"Draft {draft_id} sent successfully")
            return sent_message
            
        except Exception as e:
            logger.error(f"Failed to send draft {draft_id}: {e}")
            raise GmailAPIError(f"Failed to send draft: {e}")
    
    def get_thread_messages(self, thread_id: str, user_id: str = 'me') -> List[Dict]:
        """Get all messages in a thread"""
        try:
            thread = self.service.users().threads().get(
                userId=user_id, id=thread_id
            ).execute()
            
            processed_messages = []
            for msg in thread['messages']:
                headers = {h['name'].lower(): h['value'] for h in msg['payload']['headers']}
                
                processed_messages.append({
                    'id': msg['id'],
                    'subject': headers.get('subject', 'No Subject'),
                    'from': headers.get('from', 'Unknown Sender'),
                    'to': headers.get('to', 'Unknown Recipient'),
                    'date': headers.get('date', 'Unknown Date'),
                    'body': self._extract_body(msg['payload']),
                    'snippet': msg.get('snippet', ''),
                    'labels': msg.get('labelIds', [])
                })
            
            logger.info(f"Retrieved {len(processed_messages)} messages from thread {thread_id}")
            return processed_messages
            
        except Exception as e:
            logger.error(f"Failed to get thread messages for {thread_id}: {e}")
            raise GmailAPIError(f"Failed to get thread messages: {e}")
    
    def download_attachment(self, message_id: str, attachment_id: str, 
                          filename: str, target_dir: str = '.', user_id: str = 'me') -> str:
        """Download a specific attachment"""
        try:
            target_dir = Path(target_dir)
            target_dir.mkdir(parents=True, exist_ok=True)
            
            attachment = self.service.users().messages().attachments().get(
                userId=user_id, messageId=message_id, id=attachment_id
            ).execute()
            
            file_data = base64.urlsafe_b64decode(attachment['data'].encode('UTF-8'))
            file_path = target_dir / filename
            
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            logger.info(f"Attachment saved to: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Failed to download attachment: {e}")
            raise GmailAPIError(f"Failed to download attachment: {e}")


# Convenience functions for backward compatibility
def init_gmail_services(client_file: str, api_name: str = 'gmail', 
                       api_version: str = 'v1', scopes: List[str] = None) -> object:
    """Initialize Gmail API service (backward compatibility)"""
    gmail_api = GmailAPI(client_file, api_name, api_version, scopes)
    return gmail_api.service

def get_email_messages(service, user_id: str = 'me', label_ids: List[str] = None, 
                      folder_name: str = 'INBOX', max_results: int = 5) -> List[Dict]:
    """Get email messages (backward compatibility)"""
    gmail_api = GmailAPI.__new__(GmailAPI)
    gmail_api.service = service
    return gmail_api.get_messages(user_id, label_ids, folder_name, max_results)

def get_email_message_details(service, msg_id: str) -> Dict:
    """Get message details (backward compatibility)"""
    gmail_api = GmailAPI.__new__(GmailAPI)
    gmail_api.service = service
    return gmail_api.get_message_details(msg_id)

def send_email(service, to: Union[str, List[str]], subject: str, body: str, 
               body_type: str = 'plain', attachment_paths: List[Union[str, Path]] = None) -> Dict:
    """Send email (backward compatibility)"""
    gmail_api = GmailAPI.__new__(GmailAPI)
    gmail_api.service = service
    return gmail_api.send_email(to, subject, body, body_type, attachment_paths=attachment_paths)