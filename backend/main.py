import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI

# Load environment variables from the .env file at the project root
load_dotenv()

# Import all the routers and services
from router import campaigns, emails, leads
from services.followup_scheduler import FollowupScheduler
from services.gmail_api import GmailAPI
from services.langchain_agent import LangChainAgent
from services.supabase_client import SupabaseClient

# --- 1. Configure Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 2. Initialize Services ---
# These instances are created once and shared across the entire application
# to ensure efficiency and consistent state.

logger.info("Initializing services...")
db_client = SupabaseClient()
gmail_api = GmailAPI(client_file=os.getenv('GOOGLE_CLIENT_SECRET_FILE', 'credentials.json'))
agent = LangChainAgent()
# The scheduler needs access to the other services to perform its tasks
scheduler = FollowupScheduler(db_client=db_client, gmail_api=gmail_api, agent=agent)
logger.info("All services initialized.")


# --- 3. Define Application Lifecycle ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown events.
    This is the recommended way to handle background tasks like the scheduler.
    """
    logger.info("Application startup...")
    # Start the background scheduler when the application starts
    scheduler.start()
    yield
    # Gracefully shut down the scheduler when the application stops
    logger.info("Application shutdown...")
    scheduler.shutdown()


# --- 4. Create FastAPI Application Instance ---
app = FastAPI(
    title="Agentic Cold Emailer API",
    description="An API to manage and automate personalized cold email campaigns using AI.",
    version="1.0.0",
    lifespan=lifespan  # Connect the lifespan manager
)


# --- 5. Set Up Dependency Injection Overrides ---
# This is a crucial step. It tells FastAPI how to resolve the `Depends()` calls
# in your router files. Instead of creating new service instances for every request,
# it provides the single, shared instances we created above.

app.dependency_overrides[emails.get_supabase_client] = lambda: db_client
app.dependency_overrides[emails.get_gmail_api] = lambda: gmail_api
app.dependency_overrides[emails.get_langchain_agent] = lambda: agent
app.dependency_overrides[emails.get_followup_scheduler] = lambda: scheduler

app.dependency_overrides[campaigns.get_supabase_client] = lambda: db_client
app.dependency_overrides[leads.get_supabase_client] = lambda: db_client


# --- 6. Mount Routers ---
# This connects all the endpoints defined in your router files to the main application.
logger.info("Mounting routers...")
app.include_router(emails.router)
app.include_router(campaigns.router)
app.include_router(leads.router)
logger.info("Routers mounted successfully.")


# --- 7. Define Root Endpoint for Health Check ---
@app.get("/", tags=["Health Check"])
def read_root():
    """
    A simple health check endpoint to confirm the API is running.
    """
    return {"status": "ok", "message": "Welcome to the Agentic Cold Emailer API!"}