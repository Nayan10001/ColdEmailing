import logging
import os
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LangChainAgent:
    """
    An agent that uses LangChain and a Google Gemini model to perform
    tasks like generating and evaluating email content.
    """

    def __init__(self):
        """
        Initializes the agent, loading the Google API key and setting up
        the Gemini LLM and a JSON output parser.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY not found in environment variables.")
            raise ValueError("GEMINI_API_KEY is not set.")

        # Initialize the ChatGoogleGenerativeAI model
        # Model: gemini-1.5-flash-001 is a fast, multimodal model.
        # Temperature: 0.7 strikes a balance between creativity and predictability.
        #   - Lower (e.g., 0.2) would be more deterministic and less "creative".
        #   - Higher (e.g., 1.0) would be more random and potentially less coherent.
        self.model = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            api_key=api_key,
            temperature=0.7,
            convert_system_message_to_human=True # Helps with some models
        )
        
        # Initialize a parser to get structured JSON output
        self.parser = JsonOutputParser()

    def _load_prompt_template(self, file_name: str) -> str:
        """Loads a prompt template from the 'prompts' directory."""
        prompt_path = Path("prompts") / file_name
        if not prompt_path.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
        return prompt_path.read_text()

    async def generate_cold_email(self, context: Dict[str, Any]) -> Dict[str, str]:
        """
        Generates a personalized cold email subject and body.

        Args:
            context: A dictionary containing lead and campaign information.
                     Expected keys: lead_name, lead_company, lead_position,
                                    campaign_objective, campaign_tone.

        Returns:
            A dictionary with "subject" and "body" keys.
        """
        logger.info(f"Generating cold email for lead: {context.get('lead_name')}")
        try:
            prompt_template_str = self._load_prompt_template("cold_email_prompt.txt")
            prompt = ChatPromptTemplate.from_template(
                template=prompt_template_str,
                partial_variables={"format_instructions": self.parser.get_format_instructions()}
            )
            
            chain = prompt | self.model | self.parser
            response =  await chain.ainvoke(context)
            
            logger.info("Successfully generated and parsed cold email.")
            return response
        except Exception as e:
            logger.error(f"Failed to generate cold email: {e}")
            # Fallback in case of an error
            return {"subject": "Following up", "body": "I hope you are having a great week."}

    def generate_followup_email(self, context: Dict[str, Any]) -> Dict[str, str]:
        """
        Generates a follow-up email based on the initial outreach.

        Args:
            context: A dictionary containing original context plus the previous email.
                     Expected keys: lead_name, campaign_objective, previous_email_subject,
                                    previous_email_body.

        Returns:
            A dictionary with "subject" and "body" keys.
        """
        logger.info(f"Generating follow-up email for lead: {context.get('lead_name')}")
        try:
            prompt_template_str = self._load_prompt_template("followup_prompt.txt")
            prompt = ChatPromptTemplate.from_template(
                template=prompt_template_str,
                partial_variables={"format_instructions": self.parser.get_format_instructions()}
            )

            chain = prompt | self.model | self.parser
            response = chain.invoke(context)
            
            logger.info("Successfully generated and parsed follow-up email.")
            return response
        except Exception as e:
            logger.error(f"Failed to generate follow-up email: {e}")
            return {"subject": "Quick Follow-up", "body": "Just checking in on my previous email."}

    def evaluate_email_quality(self, email_text: str, goal: str) -> Dict[str, Any]:
        """
        Evaluates the quality of a given email against a specific goal.

        Args:
            email_text: The full body of the email to evaluate.
            goal: The campaign objective or goal the email is trying to achieve.

        Returns:
            A dictionary with "score" (1-10) and "feedback" (string).
        """
        logger.info("Evaluating email quality...")
        try:
            prompt_template_str = self._load_prompt_template("eval_prompt.txt")
            prompt = ChatPromptTemplate.from_template(
                template=prompt_template_str,
                partial_variables={"format_instructions": self.parser.get_format_instructions()}
            )

            chain = prompt | self.model | self.parser
            response = chain.invoke({"email_text": email_text, "goal": goal})
            
            logger.info(f"Email evaluation complete. Score: {response.get('score')}")
            return response
        except Exception as e:
            logger.error(f"Failed to evaluate email quality: {e}")
            return {"score": 0, "feedback": "Could not evaluate the email due to an error."}