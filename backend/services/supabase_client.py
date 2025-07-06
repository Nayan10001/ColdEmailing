import logging
import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from supabase import Client, create_client

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SupabaseClientError(Exception):
    """Custom exception for Supabase client errors."""
    pass


class SupabaseClient:
    """
    A client to handle all interactions with the Supabase database.
    It abstracts away the raw Supabase calls into business-logic-oriented methods.
    """

    def __init__(self):
        """
        Initializes the Supabase client using credentials from environment variables.
        """
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
            raise ValueError("Supabase credentials not found in environment variables.")

        try:
            self.client: Client = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise SupabaseClientError(f"Failed to initialize Supabase client: {e}")

    def get_lead(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches a single lead by its ID.
        Assumes your table is named 'leads'.
        """
        try:
            response = self.client.table('leads').select('*').eq('id', lead_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching lead with ID {lead_id}: {e}")
            raise SupabaseClientError(f"Error fetching lead: {e}")

    def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches a single campaign by its ID.
        Assumes your table is named 'campaigns'.
        """
        try:
            response = self.client.table('campaigns').select('*').eq('id', campaign_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching campaign with ID {campaign_id}: {e}")
            raise SupabaseClientError(f"Error fetching campaign: {e}")

    def log_email_activity(self, email_log: Dict[str, Any]) -> str:
        """
        Logs a generated or sent email to the database.
        Assumes your table is named 'emails'.
        Returns the ID of the newly created log entry.
        """
        try:
            response = self.client.table('emails').insert(email_log).execute()
            if not response.data:
                raise SupabaseClientError("Failed to insert email log, no data returned.")
            
            # Return the ID of the new row
            return response.data[0]['id']
        except Exception as e:
            logger.error(f"Error logging email activity for lead {email_log.get('lead_id')}: {e}")
            raise SupabaseClientError(f"Error logging email activity: {e}")

    def update_email_status(self, email_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates the status or other details of an email log by its ID.
        Assumes your table is named 'emails'.
        """
        try:
            response = self.client.table('emails').update(update_data).eq('id', email_id).execute()
            if not response.data:
                raise SupabaseClientError(f"Failed to update email log ID {email_id}, no data returned.")
            return response.data[0]
        except Exception as e:
            logger.error(f"Error updating email status for email ID {email_id}: {e}")
            raise SupabaseClientError(f"Error updating email status: {e}")

    def get_email_status(self, email_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves the full record for a single email by its ID.
        Assumes your table is named 'emails'.
        """
        return self.client.table('emails').select('*').eq('id', email_id).single().execute().data

    def get_campaign_emails(self, campaign_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieves all emails associated with a specific campaign, with pagination.
        """
        try:
            response = self.client.table('emails').select('*').eq('campaign_id', campaign_id).range(skip, skip + limit - 1).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching emails for campaign {campaign_id}: {e}")
            raise SupabaseClientError(f"Error fetching campaign emails: {e}")

    def get_lead_emails(self, lead_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all emails sent to a specific lead.
        """
        try:
            response = self.client.table('emails').select('*').eq('lead_id', lead_id).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching emails for lead {lead_id}: {e}")
            raise SupabaseClientError(f"Error fetching lead emails: {e}")

    # --- Template Management ---

    def create_email_template(self, template_data: Dict[str, Any]) -> str:
        """
        Creates a new email template in the database.
        Assumes your table is named 'templates'.
        """
        try:
            response = self.client.table('templates').insert(template_data).execute()
            if not response.data:
                raise SupabaseClientError("Failed to create email template.")
            return response.data[0]['id']
        except Exception as e:
            logger.error(f"Error creating email template: {e}")
            raise SupabaseClientError(f"Error creating template: {e}")

    def get_email_templates(self) -> List[Dict[str, Any]]:
        """
        Retrieves all email templates from the database.
        """
        try:
            response = self.client.table('templates').select('*').execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching email templates: {e}")
            raise SupabaseClientError(f"Error fetching templates: {e}")
        
    def get_latest_email_for_lead_campaign(self, lead_id: str, campaign_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches the most recent email log for a specific lead-campaign combination.
        """
        try:
            response = self.client.table('emails') \
                .select('*') \
                .eq('lead_id', lead_id) \
                .eq('campaign_id', campaign_id) \
                .order('created_at', desc=True) \
                .limit(1) \
                .single() \
                .execute()
            return response.data
        except Exception as e:
            # PostgREST may raise an error if no rows are found with .single()
            # We can safely ignore it and return None
            if "JSON object requested, multiple (or no) rows returned" in str(e):
                logger.warning(f"No email log found for lead {lead_id} in campaign {campaign_id}")
                return None
            logger.error(f"Error fetching latest email for lead {lead_id}: {e}")
            raise SupabaseClientError(f"Error fetching latest email: {e}")
        

        
    def get_all_leads(self) -> List[Dict[str, Any]]:
        """
        Retrieves all leads from the database, ordered by creation date.
        """
        try:
            response = self.client.table('leads').select('*').order('created_at', desc=True).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching all leads: {e}")
            raise SupabaseClientError(f"Error fetching all leads: {e}")

    def get_leads_by_status(self, status: str) -> List[Dict[str, Any]]:
        """
        Retrieves all leads that match a given status.
        """
        try:
            response = self.client.table('leads').select('*').eq('status', status).order('created_at', desc=True).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching leads with status {status}: {e}")
            raise SupabaseClientError(f"Error fetching leads by status: {e}")

    def bulk_insert_leads(self, leads_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Inserts a list of leads into the database in a single transaction.
        """
        try:
            # The 'upsert=True' flag can help avoid errors with duplicate emails if desired,
            # but a simple insert is fine for this use case.
            response = self.client.table('leads').insert(leads_data).execute()
            if not response.data:
                raise SupabaseClientError("Bulk insert failed, no data returned.")
            return response.data
        except Exception as e:
            logger.error(f"Error during bulk lead insert: {e}")
            raise SupabaseClientError(f"Error during bulk lead insert: {e}")
        
    

    # Add these methods inside the SupabaseClient class

    def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a new campaign in the database.
        Assumes your table is named 'campaigns'.
        """
        try:
            response = self.client.table('campaigns').insert(campaign_data).execute()
            if not response.data:
                raise SupabaseClientError("Failed to create campaign, no data returned.")
            return response.data[0]
        except Exception as e:
            logger.error(f"Error creating campaign: {e}")
            raise SupabaseClientError(f"Error creating campaign: {e}")

    def get_all_campaigns(self) -> List[Dict[str, Any]]:
        """
        Retrieves all campaigns from the database.
        """
        try:
            response = self.client.table('campaigns').select('*').order('created_at', desc=True).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching all campaigns: {e}")
            raise SupabaseClientError(f"Error fetching all campaigns: {e}")

    def update_campaign(self, campaign_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Updates an existing campaign by its ID.
        """
        try:
            response = self.client.table('campaigns').update(update_data).eq('id', campaign_id).execute()
            if not response.data:
                return None
            return response.data[0]
        except Exception as e:
            logger.error(f"Error updating campaign {campaign_id}: {e}")
            raise SupabaseClientError(f"Error updating campaign: {e}")
    