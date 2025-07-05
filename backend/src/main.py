#!/usr/bin/env python3
"""
Gmail Automation Main Script
Lead Generation and Email Management System
Powered by Supabase and Gemini AI
"""
import sys
import time
import logging
import csv
from pathlib import Path
import argparse

# Import your custom modules
from gmail_api import GmailAPI
from ai_generator import AIGenerator
from lead_manager import SupabaseLeadManager

# Configure logging to see the script's progress and any errors
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('gmail_automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def load_leads_from_csv(csv_file_path: str) -> list:
    """Load leads from a CSV file."""
    leads = []
    try:
        with open(csv_file_path, 'r', newline='', encoding='utf-8') as csvfile:
            # Strip whitespace from headers to handle any formatting issues
            reader = csv.DictReader(csvfile)
            reader.fieldnames = [field.strip() if field else field for field in reader.fieldnames]
            
            for row in reader:
                # Strip whitespace from all values and skip empty rows
                cleaned_row = {k.strip(): v.strip() if v else v for k, v in row.items()}
                if cleaned_row.get('email'):  # Only add rows that have an email
                    leads.append(cleaned_row)
            
        logger.info(f"Successfully loaded {len(leads)} leads from {csv_file_path}")
        return leads
    except FileNotFoundError:
        logger.error(f"CSV file not found: {csv_file_path}")
        return []
    except Exception as e:
        logger.error(f"Error reading CSV file {csv_file_path}: {e}")
        return []


def main():
    """Main function to run the email automation tasks."""
    parser = argparse.ArgumentParser(
        description='AI-Powered Gmail Automation with Supabase',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument(
        '--command', 
        choices=['send', 'setup', 'create-table', 'load-csv'],
        default='send', 
        help='The command to execute: "create-table" to initialize the DB, "setup" to add sample leads, "load-csv" to load leads from CSV, "send" to run a campaign.'
    )
    parser.add_argument(
        '--credentials', 
        default='credentials.json', 
        help='Path to your Google API credentials file.'
    )
    parser.add_argument(
        '--csv-file',
        default='leads.csv',
        help='Path to your CSV file containing leads data.'
    )
    parser.add_argument(
        '--dry-run', 
        action='store_true', 
        help='Simulate the run without sending actual emails or updating lead statuses.'
    )
    parser.add_argument(
        '--delay', 
        type=int, 
        default=5, 
        help='Delay in seconds between sending emails to avoid rate limits.'
    )
    parser.add_argument(
        '--max-leads', 
        type=int, 
        default=None, 
        help='The maximum number of new leads to process in this run.'
    )
    
    args = parser.parse_args()
    
    try:
        logger.info("Initializing Gmail and Supabase automation system...")
        
        # --- Initialization ---
        if not Path(args.credentials).exists() and args.command not in ['create-table', 'load-csv']:
            logger.error(f"Credentials file not found: {args.credentials}. Please download it from Google Cloud Console.")
            return 1
        
        lead_manager = SupabaseLeadManager()

        # --- Command Handling ---
        if args.command == 'create-table':
            logger.info("Executing command to create 'leads' table in Supabase...")
            if lead_manager.create_leads_table():
                logger.info("Table creation process finished successfully.")
            else:
                logger.error("Table creation process failed. Check logs for details, especially for the 'exec' function hint.")
            return 0

        if args.command == 'load-csv':
            logger.info(f"Loading leads from CSV file: {args.csv_file}")
            csv_leads = load_leads_from_csv(args.csv_file)
            
            if not csv_leads:
                logger.error("No leads found in CSV file or file could not be read.")
                return 1
            
            logger.info(f"Found {len(csv_leads)} leads in CSV file. Adding to Supabase...")
            added_count = 0
            
            for lead in csv_leads:
                # Ensure required fields are present
                if not lead.get('name') or not lead.get('email'):
                    logger.warning(f"Skipping lead with missing name or email: {lead}")
                    continue
                
                # Prepare lead data with proper defaults
                lead_data = {
                    'name': lead.get('name', ''),
                    'email': lead.get('email', ''),
                    'company': lead.get('company', ''),
                    'industry': lead.get('industry', ''),
                    'status': lead.get('status', 'new'),
                    'notes': lead.get('notes', '')
                }
                
                # Only add last_updated if it's not empty
                if lead.get('last_updated'):
                    lead_data['last_updated'] = lead.get('last_updated')
                
                if lead_manager.add_lead(lead_data):
                    added_count += 1
            
            logger.info(f"Successfully added {added_count} new leads from CSV to Supabase.")
            return 0

        # All other commands require Gmail API
        gmail_api = GmailAPI(args.credentials)
        
        if args.command == 'setup':
            logger.info("Setting up sample data in Supabase 'leads' table...")
            
            # First, try to load from CSV if it exists
            if Path(args.csv_file).exists():
                logger.info(f"CSV file found: {args.csv_file}. Loading leads from CSV instead of using hardcoded samples.")
                csv_leads = load_leads_from_csv(args.csv_file)
                leads_to_add = csv_leads if csv_leads else []
            else:
                logger.info("No CSV file found. Using hardcoded sample leads.")
                leads_to_add = [
                    {'name': 'John Doe', 'email': 'john.doe@example.com', 'company': 'Example Corp', 'industry': 'Technology', 'status': 'new'},
                    {'name': 'Jane Smith', 'email': 'jane.smith@example.com', 'company': 'Sample Inc', 'industry': 'Marketing', 'status': 'new'}
                ]
            
            count = 0
            for lead in leads_to_add:
                if lead_manager.add_lead(lead):
                    count += 1
            
            logger.info(f"Setup completed! Added {count} new leads to your Supabase table.")
            return 0
        
        if args.command == 'send':
            if not lead_manager.does_table_have_leads():
                logger.error("No leads found in Supabase. Run with '--command create-table' then '--command load-csv' to get started.")
                return 1

            leads_to_process = lead_manager.get_leads_by_status('new')
            
            if not leads_to_process:
                logger.info("No new leads to process in Supabase. All leads have been contacted or are in progress.")
                return 0
                
            if args.max_leads:
                leads_to_process = leads_to_process[:args.max_leads]  # Fixed typo: was max_leeads
            
            logger.info(f"Starting AI-powered email campaign for {len(leads_to_process)} leads...")
            
            try:
                ai_generator = AIGenerator()
                # --- TODO: Customize your sender details here! ---
                sender_data = {
                    'sender_name': 'Your Name',
                    'sender_company': 'Your Company'
                }
                
                for i, lead in enumerate(leads_to_process):
                    try:
                        email_content = ai_generator.generate_email_content(lead, sender_data)
                        
                        if args.dry_run:
                            logger.info(f"--- [DRY RUN] Lead {i+1}/{len(leads_to_process)}: {lead['email']} ---")
                            logger.info(f"AI Subject: {email_content['subject']}")
                            logger.info(f"AI Body:\n{email_content['body']}\n--------------------")
                            continue
                        
                        gmail_api.send_email(to=lead['email'], **email_content)
                        notes = "Sent AI-generated email."
                        lead_manager.update_lead_status(lead['email'], 'contacted_ai', notes)
                        
                        logger.info(f"Successfully sent email to {lead['email']} ({i+1}/{len(leads_to_process)})")
                        
                        if i < len(leads_to_process) - 1:
                            time.sleep(args.delay)

                    except Exception as e:
                        logger.error(f"Failed to process lead {lead['email']}. Error: {e}")

            except Exception as e:
                logger.error(f"Could not start AI campaign. Ensure GOOGLE_API_KEY is set in your .env file. Error: {e}")
                return 1

        logger.info("Operation completed successfully!")
        return 0
        
    except KeyboardInterrupt:
        logger.warning("\nOperation cancelled by user.")
        return 1
    except Exception as e:
        logger.critical(f"A critical, unhandled error occurred: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())