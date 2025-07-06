import logging
from datetime import datetime, timedelta
import asyncio

from apscheduler.schedulers.background import BackgroundScheduler

# Import your services
# These will be passed in during initialization to avoid re-creating them
from services.gmail_api import GmailAPI
from services.langchain_agent import LangChainAgent
from services.supabase_client import SupabaseClient

logging.basicConfig(level=logging.INFO)
# Set APScheduler's logging to a higher level to reduce noise
logging.getLogger('apscheduler').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


class FollowupScheduler:
    """
    Manages scheduling and execution of follow-up email tasks using APScheduler.
    """

    def __init__(self, db_client: SupabaseClient, gmail_api: GmailAPI, agent: LangChainAgent):
        """
        Initializes the scheduler and injects required service dependencies.

        Args:
            db_client: An instance of SupabaseClient.
            gmail_api: An instance of GmailAPI.
            agent: An instance of LangChainAgent.
        """
        self.scheduler = BackgroundScheduler(daemon=True)
        self.db = db_client
        self.gmail = gmail_api
        self.agent = agent

    def start(self):
        """Starts the scheduler's background thread."""
        try:
            self.scheduler.start()
            logger.info("Follow-up scheduler started successfully.")
        except Exception as e:
            logger.error(f"Failed to start the scheduler: {e}")

    def shutdown(self):
        """Shuts down the scheduler gracefully."""
        logger.info("Shutting down the follow-up scheduler...")
        self.scheduler.shutdown()

    async def schedule_followup(self, lead_id: str, campaign_id: str, followup_days: int):
        """
        Schedules a follow-up check for a given lead and campaign.

        If a job for this lead/campaign combo already exists, it will be replaced.
        """
        run_date = datetime.now() + timedelta(days=followup_days)
        job_id = f"followup_{lead_id}_{campaign_id}"

        self.scheduler.add_job(
            self._execute_followup_check,
            'date',
            run_date=run_date,
            args=[lead_id, campaign_id],
            id=job_id,
            replace_existing=True
        )
        logger.info(f"Scheduled follow-up for lead {lead_id} on {run_date.strftime('%Y-%m-%d %H:%M:%S')}. Job ID: {job_id}")

    def _execute_followup_check(self, lead_id: str, campaign_id: str):
        """
        The actual job executed by the scheduler. It checks for replies and sends a follow-up if needed.
        """
        logger.info(f"Executing follow-up check for lead ID: {lead_id}, campaign ID: {campaign_id}")

        try:
            # 1. Check if the lead has already replied
            # NOTE: This requires a method in SupabaseClient to check for replies.
            # We'll assume a method `has_lead_replied` for this logic.
            # A simple implementation would check the `status` of the latest email for that lead/campaign.
            
            # Fetch the latest email log for this lead/campaign
            # This is a hypothetical method, you'll need to add it to supabase_client.py
            # get_latest_email(lead_id, campaign_id) -> orders by created_at DESC, limit 1
            latest_email = self.db.get_latest_email_for_lead_campaign(lead_id, campaign_id)

            if not latest_email:
                logger.warning(f"No initial email log found for lead {lead_id} in campaign {campaign_id}. Aborting follow-up.")
                return

            if latest_email.get('status') == 'replied':
                logger.info(f"Lead {lead_id} has already replied. No follow-up will be sent.")
                return
            
            # 2. If no reply, fetch context and generate a follow-up email
            logger.info(f"No reply from lead {lead_id}. Proceeding to generate follow-up.")
            
            lead_info = self.db.get_lead(lead_id)
            campaign_info = self.db.get_campaign(campaign_id)
            
            if not lead_info or not campaign_info:
                 logger.error(f"Could not retrieve lead or campaign info for lead {lead_id}. Aborting.")
                 return

            context = {
                "lead_name": lead_info.get("name"),
                "campaign_objective": campaign_info.get("objective"),
                "previous_email_subject": latest_email.get("subject"),
                "previous_email_body": latest_email.get("body"),
            }

            # Use asyncio.run to handle the async method call
            followup_content = asyncio.run(self.agent.generate_followup_email(context))
            subject = followup_content["subject"]
            body = followup_content["body"]
            
            # 3. Send the follow-up email
            # For a true threaded reply, more headers (In-Reply-To, References) are needed.
            # For simplicity, we send an email with a "Re:" subject and log it to the same threadId.
            sent_message = self.gmail.send_email(
                to=lead_info["email"],
                subject=subject,
                body=body,
            )
            
            # 4. Log the follow-up email to the database
            followup_log = {
                "lead_id": lead_id,
                "campaign_id": campaign_id,
                "gmail_message_id": sent_message["id"],
                "gmail_thread_id": latest_email.get("gmail_thread_id"), # Use the original thread ID
                "subject": subject,
                "body": body,
                "status": "sent",
                "email_type": "followup",
                "sent_at": datetime.now().isoformat(),
            }
            self.db.log_email_activity(followup_log)
            logger.info(f"Successfully sent and logged follow-up to lead {lead_id}.")

        except Exception as e:
            logger.error(f"An error occurred during follow-up execution for lead {lead_id}: {e}", exc_info=True)