from openai import OpenAI
from openai import OpenAIError, APIConnectionError,InternalServerError,RateLimitError
from django.conf import settings
from  tenacity import retry,stop_after_attempt, wait_exponential,retry_if_exception_type


class OpenAILLM:

    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    #using tenacity for retry logic 
    @retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1,min=2,max=30),
    retry=retry_if_exception_type(
        (
            RateLimitError,
            APIConnectionError,
            InternalServerError
        )),
    reraise=True)
    def generate(self,input,instructions,model=None,temperature=None):

        try:
            response = self.client.responses.create(
                model=model,
                input=input,
                instructions=instructions,
                temperature=temperature
            )
            return response.output_text

        except OpenAIError as e:

            raise Exception(str(e))