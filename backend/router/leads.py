import io
import logging
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, EmailStr, Field

# Import the Supabase client and its dependency function
from services.supabase_client import SupabaseClient, SupabaseClientError

# In a real app, this would be in a central dependencies.py file
# For now, we define it here for clarity.
async def get_supabase_client():
    """Dependency function to get a Supabase client instance."""
    return SupabaseClient()


# --- Pydantic Models for Lead Data ---

class LeadBase(BaseModel):
    name: str = Field(..., description="Full name of the lead.")
    email: EmailStr = Field(..., description="Email address of the lead.")
    company: Optional[str] = None
    position: Optional[str] = None
    linkedin_url: Optional[str] = None
    status: str = Field(default="new", description="The current status of the lead.")
    custom_data: Optional[Dict[str, Any]] = Field(default=None, description="Flexible JSONB field for extra data.")

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    position: Optional[str] = None
    linkedin_url: Optional[str] = None
    status: Optional[str] = None
    custom_data: Optional[Dict[str, Any]] = None

class LeadResponse(LeadBase):
    id: int
    created_at: Any

    class Config:
        orm_mode = True # Use from_attributes=True for Pydantic v2

class BulkUploadResponse(BaseModel):
    message: str
    successful_uploads: int
    failed_records: int
    errors: List[Dict]


# --- API Router ---

router = APIRouter(
    prefix="/leads",
    tags=["Leads"],
    responses={404: {"description": "Not found"}}
)
logger = logging.getLogger(__name__)


@router.post("/upload/csv", response_model=BulkUploadResponse)
def upload_leads_from_csv(
    file: UploadFile = File(...),
    db: SupabaseClient = Depends(get_supabase_client)
):
    """
    Uploads leads from a CSV file.
    The CSV must contain columns: 'name', 'email'.
    Optional columns: 'company', 'position', 'linkedin_url'.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    try:
        # Read CSV file into a pandas DataFrame
        contents = file.file.read()
        buffer = io.StringIO(contents.decode('utf-8'))
        df = pd.read_csv(buffer)
        df.columns = [col.lower().strip() for col in df.columns] # Normalize column names

        # Validate required columns
        required_columns = {'name', 'email'}
        if not required_columns.issubset(df.columns):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain the following columns: {list(required_columns)}"
            )

    except Exception as e:
        logger.error(f"Error parsing CSV file: {e}")
        raise HTTPException(status_code=400, detail=f"Could not parse CSV file: {e}")

    leads_to_insert = []
    errors = []
    for index, row in df.iterrows():
        try:
            # Use Pydantic to validate each row
            lead_data = LeadCreate(**row.to_dict())
            leads_to_insert.append(lead_data.model_dump()) # Use .dict() for Pydantic v1
        except Exception as e:
            errors.append({"row": index + 2, "details": str(e)}) # +2 to account for header and 0-indexing

    if not leads_to_insert:
        return BulkUploadResponse(
            message="No valid lead data found to upload.",
            successful_uploads=0,
            failed_records=len(errors),
            errors=errors
        )

    try:
        # Perform a bulk insert
        inserted_leads = db.bulk_insert_leads(leads_to_insert)
        return BulkUploadResponse(
            message=f"Successfully uploaded {len(inserted_leads)} leads.",
            successful_uploads=len(inserted_leads),
            failed_records=len(errors),
            errors=errors
        )
    except SupabaseClientError as e:
        logger.error(f"Database error during bulk insert: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to insert leads into database: {e}")


@router.get("/", response_model=List[LeadResponse])
def get_leads(
    status: Optional[str] = None,
    db: SupabaseClient = Depends(get_supabase_client)
):
    """
    Retrieves leads, optionally filtered by status.
    """
    logger.info(f"Fetching leads with status: {status if status else 'any'}")
    if status:
        leads = db.get_leads_by_status(status)
    else:
        leads = db.get_all_leads()
    return leads


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead_by_id(
    lead_id: int,
    db: SupabaseClient = Depends(get_supabase_client)
):
    """
    Retrieves a single lead by its ID.
    """
    logger.info(f"Fetching lead with ID: {lead_id}")
    lead = db.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with ID {lead_id} not found.")
    return lead