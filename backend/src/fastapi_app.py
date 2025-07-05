#!/usr/bin/env python3
"""
FastAPI Application for Lead Management and Email Automation
Powered by Supabase and Gemini AI
"""

import os
import csv
import io
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import uvicorn

# Import your custom modules
from gmail_api import GmailAPI
from ai_generator import AIGenerator
from lead_manager import SupabaseLeadManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Lead Management & Email Automation API",
    description="AI-powered lead management and email automation system",
    version="1.0.0"
)

# Pydantic models for request/response validation
class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = ""
    industry: Optional[str] = ""
    status: Optional[str] = "new"
    notes: Optional[str] = ""

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class EmailRequest(BaseModel):
    lead_email: EmailStr
    sender_name: Optional[str] = "Your Name"
    sender_company: Optional[str] = "Your Company"
    custom_subject: Optional[str] = None
    custom_body: Optional[str] = None

class BulkEmailRequest(BaseModel):
    status_filter: Optional[str] = "new"
    max_leads: Optional[int] = None
    sender_name: Optional[str] = "Your Name"
    sender_company: Optional[str] = "Your Company"
    delay_seconds: Optional[int] = 5

class FollowUpRequest(BaseModel):
    lead_email: EmailStr
    follow_up_date: datetime
    message: Optional[str] = None

class ImportResponse(BaseModel):
    success: bool
    message: str
    imported_count: int
    failed_count: int
    errors: List[str]

class EmailResponse(BaseModel):
    success: bool
    message: str
    email_content: Optional[Dict[str, str]] = None

class AnalyticsResponse(BaseModel):
    total_leads: int
    leads_by_status: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
    email_stats: Dict[str, Any]

# Global instances
lead_manager = None
gmail_api = None
ai_generator = None

# Dependency functions
def get_lead_manager():
    global lead_manager
    if lead_manager is None:
        lead_manager = SupabaseLeadManager()
    return lead_manager

def get_gmail_api():
    global gmail_api
    if gmail_api is None:
        credentials_path = os.getenv("GMAIL_CREDENTIALS_PATH", "credentials.json")
        if not Path(credentials_path).exists():
            raise HTTPException(
                status_code=500, 
                detail="Gmail credentials file not found. Please set GMAIL_CREDENTIALS_PATH environment variable."
            )
        gmail_api = GmailAPI(credentials_path)
    return gmail_api

def get_ai_generator():
    global ai_generator
    if ai_generator is None:
        ai_generator = AIGenerator()
    return ai_generator

# Utility functions
def parse_csv_content(content: str) -> List[Dict[str, str]]:
    """Parse CSV content and return list of lead dictionaries."""
    leads = []
    try:
        csv_reader = csv.DictReader(io.StringIO(content))
        # Strip whitespace from headers
        csv_reader.fieldnames = [field.strip() if field else field for field in csv_reader.fieldnames]
        
        for row in csv_reader:
            # Strip whitespace from all values
            cleaned_row = {k.strip(): v.strip() if v else v for k, v in row.items()}
            if cleaned_row.get('email'):  # Only add rows that have an email
                leads.append(cleaned_row)
    except Exception as e:
        logger.error(f"Error parsing CSV: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
    
    return leads

async def send_email_background(
    lead_data: Dict, 
    sender_data: Dict, 
    custom_subject: Optional[str] = None,
    custom_body: Optional[str] = None
):
    """Background task to send email to a lead."""
    try:
        ai_gen = get_ai_generator()
        gmail = get_gmail_api()
        lead_mgr = get_lead_manager()
        
        if custom_subject and custom_body:
            email_content = {
                'subject': custom_subject,
                'body': custom_body
            }
        else:
            email_content = ai_gen.generate_email_content(lead_data, sender_data)
        
        gmail.send_email(to=lead_data['email'], **email_content)
        
        # Update lead status
        notes = f"Email sent on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        lead_mgr.update_lead_status(lead_data['email'], 'contacted', notes)
        
        logger.info(f"Email sent successfully to {lead_data['email']}")
        
    except Exception as e:
        logger.error(f"Failed to send email to {lead_data['email']}: {e}")
        # Update lead with error status
        lead_mgr = get_lead_manager()
        lead_mgr.update_lead_status(lead_data['email'], 'failed', f"Email failed: {str(e)}")

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Lead Management & Email Automation API",
        "version": "1.0.0",
        "endpoints": {
            "import_leads": "/import-leads",
            "generate_email": "/generate-email",
            "send_email": "/send-email",
            "schedule_followups": "/schedule-followups",
            "analytics": "/analytics"
        }
    }

@app.post("/import-leads", response_model=ImportResponse)
async def import_leads(
    file: UploadFile = File(...),
    lead_manager: SupabaseLeadManager = Depends(get_lead_manager)
):
    """Import leads from CSV file."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Read file content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        leads = parse_csv_content(csv_content)
        
        if not leads:
            raise HTTPException(status_code=400, detail="No valid leads found in CSV file")
        
        # Import leads
        imported_count = 0
        failed_count = 0
        errors = []
        
        for lead in leads:
            try:
                # Validate required fields
                if not lead.get('name') or not lead.get('email'):
                    errors.append(f"Missing name or email for lead: {lead}")
                    failed_count += 1
                    continue
                
                # Prepare lead data
                lead_data = {
                    'name': lead.get('name', ''),
                    'email': lead.get('email', ''),
                    'company': lead.get('company', ''),
                    'industry': lead.get('industry', ''),
                    'status': lead.get('status', 'new'),
                    'notes': lead.get('notes', '')
                }
                
                if lead_manager.add_lead(lead_data):
                    imported_count += 1
                else:
                    failed_count += 1
                    errors.append(f"Failed to import lead: {lead.get('email', 'Unknown')}")
                    
            except Exception as e:
                failed_count += 1
                errors.append(f"Error importing {lead.get('email', 'Unknown')}: {str(e)}")
        
        return ImportResponse(
            success=True,
            message=f"Import completed. {imported_count} leads imported successfully.",
            imported_count=imported_count,
            failed_count=failed_count,
            errors=errors
        )
        
    except Exception as e:
        logger.error(f"Import leads error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to import leads: {str(e)}")

@app.post("/generate-email", response_model=EmailResponse)
async def generate_email(
    request: EmailRequest,
    lead_manager: SupabaseLeadManager = Depends(get_lead_manager),
    ai_generator: AIGenerator = Depends(get_ai_generator)
):
    """Generate AI-powered email content for a specific lead."""
    try:
        # Get lead data
        leads = lead_manager.get_leads_by_status('new')
        all_leads = []
        for status in ['new', 'contacted', 'responded', 'qualified', 'closed']:
            all_leads.extend(lead_manager.get_leads_by_status(status))
        
        lead_data = None
        for lead in all_leads:
            if lead['email'] == request.lead_email:
                lead_data = lead
                break
        
        if not lead_data:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Generate email content
        sender_data = {
            'sender_name': request.sender_name,
            'sender_company': request.sender_company
        }
        
        email_content = ai_generator.generate_email_content(lead_data, sender_data)
        
        return EmailResponse(
            success=True,
            message="Email content generated successfully",
            email_content=email_content
        )
        
    except Exception as e:
        logger.error(f"Generate email error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate email: {str(e)}")

@app.post("/send-email", response_model=EmailResponse)
async def send_email(
    request: EmailRequest,
    background_tasks: BackgroundTasks,
    lead_manager: SupabaseLeadManager = Depends(get_lead_manager)
):
    """Send email to a specific lead."""
    try:
        # Get lead data
        all_leads = []
        for status in ['new', 'contacted', 'responded', 'qualified', 'closed']:
            all_leads.extend(lead_manager.get_leads_by_status(status))
        
        lead_data = None
        for lead in all_leads:
            if lead['email'] == request.lead_email:
                lead_data = lead
                break
        
        if not lead_data:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Prepare sender data
        sender_data = {
            'sender_name': request.sender_name,
            'sender_company': request.sender_company
        }
        
        # Add email sending to background tasks
        background_tasks.add_task(
            send_email_background,
            lead_data,
            sender_data,
            request.custom_subject,
            request.custom_body
        )
        
        return EmailResponse(
            success=True,
            message=f"Email is being sent to {request.lead_email}"
        )
        
    except Exception as e:
        logger.error(f"Send email error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@app.post("/send-bulk-emails")
async def send_bulk_emails(
    request: BulkEmailRequest,
    background_tasks: BackgroundTasks,
    lead_manager: SupabaseLeadManager = Depends(get_lead_manager)
):
    """Send emails to multiple leads based on status filter."""
    try:
        leads = lead_manager.get_leads_by_status(request.status_filter)
        
        if not leads:
            raise HTTPException(status_code=404, detail=f"No leads found with status: {request.status_filter}")
        
        # Limit leads if specified
        if request.max_leads:
            leads = leads[:request.max_leads]
        
        sender_data = {
            'sender_name': request.sender_name,
            'sender_company': request.sender_company
        }
        
        # Add bulk email sending to background tasks
        for i, lead in enumerate(leads):
            # Add delay between emails
            delay = i * request.delay_seconds
            background_tasks.add_task(
                send_email_background,
                lead,
                sender_data
            )
        
        return {
            "success": True,
            "message": f"Bulk email campaign started for {len(leads)} leads",
            "leads_count": len(leads)
        }
        
    except Exception as e:
        logger.error(f"Bulk email error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send bulk emails: {str(e)}")

@app.post("/schedule-followups")
async def schedule_followups(
    request: FollowUpRequest,
    lead_manager: SupabaseLeadManager = Depends(get_lead_manager)
):
    """Schedule follow-up for a specific lead."""
    try:
        # Check if lead exists
        all_leads = []
        for status in ['new', 'contacted', 'responded', 'qualified', 'closed']:
            all_leads.extend(lead_manager.get_leads_by_status(status))
        
        lead_exists = any(lead['email'] == request.lead_email for lead in all_leads)
        
        if not lead_exists:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Update lead with follow-up information
        follow_up_notes = f"Follow-up scheduled for {request.follow_up_date.strftime('%Y-%m-%d %H:%M:%S')}"
        if request.message:
            follow_up_notes += f" - Message: {request.message}"
        
        success = lead_manager.update_lead_status(
            request.lead_email,
            'follow_up_scheduled',
            follow_up_notes
        )
        
        if success:
            return {
                "success": True,
                "message": f"Follow-up scheduled for {request.lead_email}",
                "follow_up_date": request.follow_up_date,
                "notes": follow_up_notes
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to schedule follow-up")
            
    except Exception as e:
        logger.error(f"Schedule follow-up error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to schedule follow-up: {str(e)}")

@app.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    lead_manager: SupabaseLeadManager = Depends(get_lead_manager)
):
    """Get analytics and statistics about leads and email campaigns."""
    try:
        # Get leads by status
        statuses = ['new', 'contacted', 'responded', 'qualified', 'closed', 'follow_up_scheduled', 'failed']
        leads_by_status = {}
        all_leads = []
        
        for status in statuses:
            leads = lead_manager.get_leads_by_status(status)
            leads_by_status[status] = len(leads)
            all_leads.extend(leads)
        
        total_leads = len(all_leads)
        
        # Get recent activity (last 10 updates)
        recent_activity = []
        for lead in sorted(all_leads, key=lambda x: x.get('last_updated', ''), reverse=True)[:10]:
            if lead.get('last_updated'):
                recent_activity.append({
                    'email': lead['email'],
                    'name': lead['name'],
                    'status': lead['status'],
                    'last_updated': lead['last_updated'],
                    'notes': lead.get('notes', '')
                })
        
        # Calculate email stats
        contacted_count = leads_by_status.get('contacted', 0)
        responded_count = leads_by_status.get('responded', 0)
        failed_count = leads_by_status.get('failed', 0)
        
        email_stats = {
            'total_sent': contacted_count + failed_count,
            'successful_sends': contacted_count,
            'failed_sends': failed_count,
            'response_rate': round((responded_count / contacted_count * 100) if contacted_count > 0 else 0, 2),
            'success_rate': round((contacted_count / (contacted_count + failed_count) * 100) if (contacted_count + failed_count) > 0 else 0, 2)
        }
        
        return AnalyticsResponse(
            total_leads=total_leads,
            leads_by_status=leads_by_status,
            recent_activity=recent_activity,
            email_stats=email_stats
        )
        
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

# Additional utility endpoints
@app.get("/leads")
async def get_leads(
    status: Optional[str] = None,
    limit: Optional[int] = 100,
    lead_manager: SupabaseLeadManager = Depends(get_lead_manager)
):
    """Get leads with optional status filter."""
    try:
        if status:
            leads = lead_manager.get_leads_by_status(status)
        else:
            # Get all leads
            statuses = ['new', 'contacted', 'responded', 'qualified', 'closed', 'follow_up_scheduled', 'failed']
            leads = []
            for s in statuses:
                leads.extend(lead_manager.get_leads_by_status(s))
        
        # Apply limit
        if limit:
            leads = leads[:limit]
        
        return {
            "success": True,
            "count": len(leads),
            "leads": leads
        }
        
    except Exception as e:
        logger.error(f"Get leads error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get leads: {str(e)}")

@app.put("/leads/{email}")
async def update_lead(
    email: str,
    lead_update: LeadUpdate,
    lead_manager: SupabaseLeadManager = Depends(get_lead_manager)
):
    """Update a specific lead."""
    try:
        # Build update data
        update_data = {}
        if lead_update.name is not None:
            update_data['name'] = lead_update.name
        if lead_update.company is not None:
            update_data['company'] = lead_update.company
        if lead_update.industry is not None:
            update_data['industry'] = lead_update.industry
        if lead_update.status is not None:
            update_data['status'] = lead_update.status
        if lead_update.notes is not None:
            update_data['notes'] = lead_update.notes
        
        # Update lead
        success = lead_manager.update_lead_status(
            email,
            update_data.get('status', 'updated'),
            update_data.get('notes', 'Lead updated via API')
        )
        
        if success:
            return {
                "success": True,
                "message": f"Lead {email} updated successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Lead not found")
            
    except Exception as e:
        logger.error(f"Update lead error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update lead: {str(e)}")

@app.delete("/leads/{email}")
async def delete_lead(
    email: str,
    lead_manager: SupabaseLeadManager = Depends(get_lead_manager)
):
    """Delete a specific lead."""
    try:
        # Note: This is a placeholder - you'll need to implement delete functionality in SupabaseLeadManager
        # For now, we'll update the status to 'deleted'
        success = lead_manager.update_lead_status(email, 'deleted', 'Lead deleted via API')
        
        if success:
            return {
                "success": True,
                "message": f"Lead {email} marked as deleted"
            }
        else:
            raise HTTPException(status_code=404, detail="Lead not found")
            
    except Exception as e:
        logger.error(f"Delete lead error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete lead: {str(e)}")

if __name__ == "__main__":
    # Run the FastAPI app
    uvicorn.run(
        "fastapi_app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )