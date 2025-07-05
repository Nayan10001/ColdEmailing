import os
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv

# Set up logging to get information about the generator's status
logger = logging.getLogger(__name__)

class AIGenerator:
    """Handles email content generation using the Gemini LLM."""
    
    def __init__(self):
        """Initializes the AI generator and configures the Gemini model."""
        
        # Load environment variables from a .env file if it exists
        load_dotenv()
        
        try:
            # Retrieve the API key from environment variables
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment or .env file.")
            
            # Configure the Gemini library with the API key
            genai.configure(api_key=api_key)
            
            # Set up the model's generation configuration
            # - temperature: Controls randomness. Lower is more predictable.
            # - response_mime_type: Crucial for forcing the model to output valid JSON.
            generation_config = {
                "temperature": 0.7,
                "top_p": 1,
                "top_k": 1,
                "max_output_tokens": 2048,
                "response_mime_type": "application/json",
            }
            
            # Initialize the generative model
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-flash", # A fast and capable model
                generation_config=generation_config
            )
            logger.info("Gemini AI Generator initialized successfully.")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI Generator: {e}")
            raise

    def generate_email_content(self, lead_data: dict, sender_data: dict) -> dict:
        """
        Generates a personalized email subject and body for a given lead.
        
        Args:
            lead_data: A dictionary containing lead info (e.g., name, company, industry).
            sender_data: A dictionary containing sender info (e.g., sender_name, sender_company).
            
        Returns:
            A dictionary with 'subject' and 'body' keys.
        """
        
        # This prompt is the "brain" of your AI. The quality of your output
        # depends heavily on how well you craft this prompt.
        prompt = f"""
        You are a highly skilled Business Development Representative for the company "{sender_data['sender_company']}".
        Your name is {sender_data['sender_name']}.
        Your goal is to write a compelling, concise, and professional cold email to a potential lead.

        **Lead Information:**
        - Name: {lead_data['name']}
        - Company: {lead_data['company']}
        - Industry: {lead_data['industry']}

        **Instructions:**
        1.  Create a short, attention-grabbing subject line that feels personal. Do not use quotes around the subject.
        2.  Write a personalized email body. Start the email with "Hi {lead_data['name']}".
        3.  Smoothly mention the lead's company ({lead_data['company']}) or their industry ({lead_data['industry']}) to show you've done your research. This is very important.
        4.  Briefly introduce a value proposition. Keep it concise and focused on a potential benefit for the lead.
        5.  End with a clear, low-friction call-to-action (e.g., asking for a brief 15-minute call, or if they are the right person to talk to).
        6.  The email tone should be professional, friendly, and confident, but not overly casual, salesy, or robotic.
        7.  Sign off simply with your name: "{sender_data['sender_name']}". Do not add a title or company name to the sign-off, as that will be in the email signature.
        
        Your entire output MUST be a valid JSON object with exactly two keys: "subject" and "body".
        Example format:
        {{
            "subject": "Your generated subject line here",
            "body": "Hi {lead_data['name']},\\n\\nYour generated email body here...\\n\\nBest regards,\\n{sender_data['sender_name']}"
        }}
        """
        
        try:
            logger.info(f"Generating AI email for {lead_data['name']} at {lead_data['company']}")
            response = self.model.generate_content(prompt)
            
            # Because we specified "application/json" as the mime type,
            # the response.text will be a string containing a valid JSON object.
            # We just need to parse it.
            content = json.loads(response.text)
            
            if 'subject' not in content or 'body' not in content:
                logger.error(f"AI response did not contain the required keys. Response: {content}")
                raise ValueError("AI response is missing 'subject' or 'body' keys.")
                
            return {
                'subject': content['subject'].strip(),
                'body': content['body'].strip()
            }
            
        except Exception as e:
            logger.error(f"Failed to generate or parse AI content for {lead_data['email']}: {e}")
            raise