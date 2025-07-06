from sched import scheduler
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
import logging
import os
import asyncio

# Import your services
from services.gmail_api import GmailAPI, GmailAPIError
from services.langchain_agent import LangChainAgent
from services.supabase_client import SupabaseClient
from services.followup_scheduler import FollowupScheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/emails", tags=["emails"])

# Pydantic models for request/response
class EmailGenerationRequest(BaseModel):
    lead_id: str
    campaign_id: str
    lead_name: str
    lead_email: EmailStr
    lead_company: Optional[str] = None
    lead_position: Optional[str] = None
    lead_linkedin: Optional[str] = None
    campaign_type: str = Field(..., description="Type of campaign (cold_email, followup)")
    custom_context: Optional[Dict[str, Any]] = None
    template_id: Optional[str] = None

class EmailSendRequest(BaseModel):
    email_log_id: int
    lead_id: str
    campaign_id: str
    recipient_email: EmailStr
    subject: str
    body: str
    body_type: str = Field(default="html", description="plain or html")
    schedule_followup: bool = Field(default=True)
    followup_days: int = Field(default=3, ge=1, le=30)

class BulkEmailRequest(BaseModel):
    campaign_id: str
    lead_ids: List[str]
    custom_context: Optional[Dict[str, Any]] = None

class EmailResponse(BaseModel):
    success: bool
    message: str
    email_id: Optional[Union[int, str]] = None  # Changed to accept both int and str
    subject: Optional[str] = None
    body: Optional[str] = None
    sent_at: Optional[datetime] = None

class EmailStatus(BaseModel):
    email_id: str
    status: str
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    error_message: Optional[str] = None

# Dependency injection functions
async def get_gmail_api():
    """Get Gmail API instance"""
    try:
        client_file = os.getenv('GOOGLE_CLIENT_SECRET_FILE', 'credentials.json')
        if not os.path.exists(client_file):
            raise FileNotFoundError(f"Gmail credentials file not found: {client_file}")
        
        gmail_api = GmailAPI(client_file)
        return gmail_api
    except Exception as e:
        logger.error(f"Failed to initialize Gmail API: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize Gmail API")

async def get_langchain_agent():
    """Get LangChain agent instance"""
    try:
        agent = LangChainAgent()
        return agent
    except Exception as e:
        logger.error(f"Failed to initialize LangChain agent: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize AI agent")

async def get_supabase_client():
    """Get Supabase client instance"""
    try:
        client = SupabaseClient()
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize database client")

async def get_followup_scheduler():
    """Get followup scheduler instance"""
    try:
        scheduler = FollowupScheduler()
        return scheduler
    except Exception as e:
        logger.error(f"Failed to initialize followup scheduler: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize followup scheduler")

# Email generation endpoints
@router.post("/generate", response_model=EmailResponse)
async def generate_email(
    request: EmailGenerationRequest,
    agent: LangChainAgent = Depends(get_langchain_agent),
    db: SupabaseClient = Depends(get_supabase_client)
):
    """Generate AI-powered cold email content"""
    try:
        logger.info(f"Generating email for lead {request.lead_id} in campaign {request.campaign_id}")
        
        # Get campaign details from database
        campaign = db.get_campaign(request.campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Get lead details from database
        lead = db.get_lead(request.lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Prepare context for AI generation
        context = {
            "lead_name": request.lead_name,
            "lead_email": request.lead_email,
            "lead_company": request.lead_company,
            "lead_position": request.lead_position,
            "lead_linkedin": request.lead_linkedin,
            "campaign_name": campaign.get("name"),
            "campaign_objective": campaign.get("objective"),
            "campaign_tone": campaign.get("tone", "professional"),
            "custom_context": request.custom_context or {}
        }
        
        # Generate email content using AI
        if request.campaign_type == "cold_email":
            email_content = await agent.generate_cold_email(context)
        elif request.campaign_type == "followup":
            email_content = await agent.generate_followup_email(context)
        else:
            raise HTTPException(status_code=400, detail="Invalid campaign type")
        
        # Log generation to database
        email_log = {
            "lead_id": request.lead_id,
            "campaign_id": request.campaign_id,
            "subject": email_content.get("subject"),
            "body": email_content.get("body"),
            "status": "generated",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "email_type": request.campaign_type
        }
        
        email_id = db.log_email_activity(email_log)
        
        logger.info(f"Email generated successfully for lead {request.lead_id}")
        
        return EmailResponse(
            success=True,
            message="Email generated successfully",
            email_id=email_id,
            subject=email_content.get("subject"),
            body=email_content.get("body")
        )
        
    except Exception as e:
        logger.error(f"Failed to generate email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate email: {str(e)}")

@router.post("/send", response_model=EmailResponse)
async def send_email(
    request: EmailSendRequest,
    background_tasks: BackgroundTasks,
    gmail_api: GmailAPI = Depends(get_gmail_api),
    db: SupabaseClient = Depends(get_supabase_client),
    scheduler: FollowupScheduler = Depends(get_followup_scheduler)
):
    """Send email via Gmail API and log to database"""
    try:
        logger.info(f"Sending email for lead {request.lead_id} in campaign {request.campaign_id}")
        
        # Send email via Gmail API
        sent_message = gmail_api.send_email(
            to=request.recipient_email,
            subject=request.subject,
            body=request.body,
            body_type=request.body_type
        )
        
        sent_at = datetime.now(timezone.utc)
        
        # Update email status in database
        email_update = {
            "status": "sent",
            "sent_at": sent_at.isoformat(),
            "gmail_message_id": sent_message.get("id"),
            "gmail_thread_id": sent_message.get("threadId")
        }
        
        db.update_email_status(request.email_log_id, email_update)
        
        # Schedule followup if requested
        if request.schedule_followup:
            background_tasks.add_task(
                schedule_followup_task,
                scheduler,
                request.lead_id,
                request.campaign_id,
                request.followup_days
            )
        
        logger.info(f"Email sent successfully to {request.recipient_email}")
        
        return EmailResponse(
            success=True,
            message="Email sent successfully",
            email_id=sent_message.get("id"),  # Gmail message ID (string)
            subject=request.subject,
            sent_at=sent_at
        )
        
    except GmailAPIError as e:
        logger.error(f"Gmail API error: {e}")
        db.update_email_status(
            request.email_log_id,
            {"status": "failed", "error_message": str(e)}
        )
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/generate-and-send", response_model=EmailResponse)
async def generate_and_send_email(
    request: EmailGenerationRequest,
    background_tasks: BackgroundTasks,
    agent: LangChainAgent = Depends(get_langchain_agent),
    gmail_api: GmailAPI = Depends(get_gmail_api),
    db: SupabaseClient = Depends(get_supabase_client),
    scheduler: FollowupScheduler = Depends(get_followup_scheduler)
):
    """Generate and send email in one step"""
    try:
        logger.info(f"Generating and sending email for lead {request.lead_id}")
        
        # Generate email content
        generate_response = await generate_email(request, agent, db)
        
        if not generate_response.success:
            return generate_response
        
        # Send the generated email
        send_request = EmailSendRequest(
            email_log_id=generate_response.email_id,  # This is the database ID (int)
            lead_id=request.lead_id,
            campaign_id=request.campaign_id,
            recipient_email=request.lead_email,
            subject=generate_response.subject,
            body=generate_response.body,
            body_type="html"
        )
        
        send_response = await send_email(send_request, background_tasks, gmail_api, db, scheduler)
        
        return send_response
        
    except Exception as e:
        logger.error(f"Failed to generate and send email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate and send email: {str(e)}")

@router.post("/bulk-send")
async def bulk_send_emails(
    request: BulkEmailRequest,
    background_tasks: BackgroundTasks,
    agent: LangChainAgent = Depends(get_langchain_agent),
    gmail_api: GmailAPI = Depends(get_gmail_api),
    db: SupabaseClient = Depends(get_supabase_client)
):
    """Send emails to multiple leads in a campaign"""
    try:
        logger.info(f"Bulk sending emails for campaign {request.campaign_id}")
        
        results = []
        
        for lead_id in request.lead_ids:
            try:
                # Get lead details
                lead = db.get_lead(lead_id)
                if not lead:
                    results.append({
                        "lead_id": lead_id,
                        "success": False,
                        "error": "Lead not found"
                    })
                    continue
                
                # Generate email for this lead
                generate_request = EmailGenerationRequest(
                    lead_id=lead_id,
                    campaign_id=request.campaign_id,
                    lead_name=lead.get("name"),
                    lead_email=lead.get("email"),
                    lead_company=lead.get("company"),
                    lead_position=lead.get("position"),
                    lead_linkedin=lead.get("linkedin"),
                    campaign_type="cold_email",
                    custom_context=request.custom_context
                )
                
                response = await generate_and_send_email(
                    generate_request, background_tasks, agent, gmail_api, db, scheduler
                )
                
                results.append({
                    "lead_id": lead_id,
                    "success": response.success,
                    "email_id": response.email_id,
                    "subject": response.subject
                })
                
                # Add delay between emails to avoid rate limiting
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Failed to send email to lead {lead_id}: {e}")
                results.append({
                    "lead_id": lead_id,
                    "success": False,
                    "error": str(e)
                })
        
        success_count = sum(1 for r in results if r["success"])
        
        return {
            "success": True,
            "message": f"Bulk email sending completed. {success_count}/{len(request.lead_ids)} emails sent successfully",
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Failed to bulk send emails: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to bulk send emails: {str(e)}")

# Email status and tracking endpoints
@router.get("/status/{email_id}", response_model=EmailStatus)
async def get_email_status(
    email_id: str,
    db: SupabaseClient = Depends(get_supabase_client)
):
    """Get email status and tracking information"""
    try:
        email_data = db.get_email_status(email_id)
        
        if not email_data:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return EmailStatus(**email_data)
        
    except Exception as e:
        logger.error(f"Failed to get email status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get email status: {str(e)}")

@router.get("/campaign/{campaign_id}/emails")
async def get_campaign_emails(
    campaign_id: str,
    skip: int = 0,
    limit: int = 100,
    db: SupabaseClient = Depends(get_supabase_client)
):
    """Get all emails for a specific campaign"""
    try:
        emails = db.get_campaign_emails(campaign_id, skip, limit)
        
        return {
            "success": True,
            "emails": emails,
            "count": len(emails)
        }
        
    except Exception as e:
        logger.error(f"Failed to get campaign emails: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get campaign emails: {str(e)}")

@router.get("/lead/{lead_id}/emails")
async def get_lead_emails(
    lead_id: str,
    db: SupabaseClient = Depends(get_supabase_client)
):
    """Get all emails for a specific lead"""
    try:
        emails = db.get_lead_emails(lead_id)
        
        return {
            "success": True,
            "emails": emails,
            "count": len(emails)
        }
        
    except Exception as e:
        logger.error(f"Failed to get lead emails: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get lead emails: {str(e)}")

# Utility functions
async def schedule_followup_task(
    scheduler: FollowupScheduler,
    lead_id: str,
    campaign_id: str,
    followup_days: int
):
    """Background task to schedule followup emails"""
    try:
        await scheduler.schedule_followup(lead_id, campaign_id, followup_days)
        logger.info(f"Followup scheduled for lead {lead_id} in {followup_days} days")
    except Exception as e:
        logger.error(f"Failed to schedule followup: {e}")

@router.post("/test-connection")
async def test_email_connection(
    gmail_api: GmailAPI = Depends(get_gmail_api)
):
    """Test Gmail API connection"""
    try:
        # Try to list labels to test connection
        labels = gmail_api.list_labels()
        
        return {
            "success": True,
            "message": "Gmail API connection successful",
            "labels_count": len(labels)
        }
        
    except Exception as e:
        logger.error(f"Gmail API connection test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Gmail API connection failed: {str(e)}")

# Email template management
@router.post("/templates")
async def create_email_template(
    template_data: Dict[str, Any],
    db: SupabaseClient = Depends(get_supabase_client)
):
    """Create a new email template"""
    try:
        template_id = db.create_email_template(template_data)
        
        return {
            "success": True,
            "message": "Email template created successfully",
            "template_id": template_id
        }
        
    except Exception as e:
        logger.error(f"Failed to create email template: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create email template: {str(e)}")

@router.get("/templates")
async def get_email_templates(
    db: SupabaseClient = Depends(get_supabase_client)
):
    """Get all email templates"""
    try:
        templates = db.get_email_templates()
        
        return {
            "success": True,
            "templates": templates,
            "count": len(templates)
        }
        
    except Exception as e:
        logger.error(f"Failed to get email templates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get email templates: {str(e)}")