import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

# Import the Supabase client and its dependency function
from services.supabase_client import SupabaseClient, SupabaseClientError

# This dependency getter should be defined in a central dependencies.py
# or we can import it if it's already defined elsewhere. For now, we define it here.
async def get_supabase_client():
    """Dependency function to get a Supabase client instance."""
    return SupabaseClient()


# --- Pydantic Models for Campaign Data ---

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=3, description="The name of the campaign.")
    objective: str = Field(..., min_length=10, description="The primary goal of the campaign (e.g., 'To book a demo for our new SaaS product').")
    tone: str = Field(default="professional", description="The desired tone for AI-generated content (e.g., 'professional', 'casual', 'witty').")
    status: str = Field(default="draft", description="The current status of the campaign (e.g., 'draft', 'active', 'paused', 'completed').")

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3)
    objective: Optional[str] = Field(None, min_length=10)
    tone: Optional[str] = None
    status: Optional[str] = None

class CampaignResponse(CampaignBase):
    id: int
    created_at: Any # Using Any to avoid strict datetime parsing on the client side

    class Config:
        orm_mode = True # Use from_attributes=True for Pydantic v2


# --- API Router ---

router = APIRouter(
    prefix="/campaigns",
    tags=["Campaigns"],
    responses={404: {"description": "Not found"}}
)

logger = logging.getLogger(__name__)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=CampaignResponse)
def create_campaign(
    campaign: CampaignCreate,
    db: SupabaseClient = Depends(get_supabase_client)
):
    """
    Creates a new email campaign.
    """
    try:
        logger.info(f"Creating new campaign with name: {campaign.name}")
        campaign_dict = campaign.model_dump() # Use campaign.dict() for Pydantic v1
        new_campaign = db.create_campaign(campaign_dict)
        return new_campaign
    except SupabaseClientError as e:
        logger.error(f"Database error creating campaign: {e}")
        # This can happen if a unique constraint is violated, for example.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error creating campaign: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An internal error occurred.")


@router.get("/", response_model=List[CampaignResponse])
def get_all_campaigns(
    db: SupabaseClient = Depends(get_supabase_client)
):
    """
    Retrieves a list of all campaigns.
    """
    logger.info("Fetching all campaigns.")
    campaigns = db.get_all_campaigns()
    return campaigns


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign_by_id(
    campaign_id: int,
    db: SupabaseClient = Depends(get_supabase_client)
):
    """
    Retrieves a single campaign by its ID.
    """
    logger.info(f"Fetching campaign with ID: {campaign_id}")
    campaign = db.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign with ID {campaign_id} not found.")
    return campaign


@router.patch("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int,
    campaign_update: CampaignUpdate,
    db: SupabaseClient = Depends(get_supabase_client)
):
    """
    Updates an existing campaign's attributes. Only provided fields will be updated.
    """
    logger.info(f"Updating campaign with ID: {campaign_id}")
    # Get rid of None values so we only update fields that were provided
    update_data = campaign_update.model_dump(exclude_unset=True) # Use .dict(exclude_unset=True) for Pydantic v1
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided.")
    
    updated_campaign = db.update_campaign(campaign_id, update_data)
    if not updated_campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign with ID {campaign_id} not found to update.")
    return updated_campaign


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: int,
    db: SupabaseClient = Depends(get_supabase_client)
):
    """
    Deletes a campaign by its ID.
    Note: This will also delete all associated emails due to the 'ON DELETE CASCADE'
    constraint in the database schema.
    """
    logger.info(f"Attempting to delete campaign with ID: {campaign_id}")
    deleted_campaign = db.delete_campaign(campaign_id)
    if not deleted_campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign with ID {campaign_id} not found to delete.")
    
    logger.info(f"Successfully deleted campaign with ID: {campaign_id}")
    return None