from pydantic import BaseModel, Field

class ContractAnalysis(BaseModel):
    contract_title: str = Field(description="The title of the contract, e.g., 'Freelance Web Development Service Agreement'.")
    contract_text: str = Field(description="The full, comprehensive text of the service agreement/contract, formatted as professional text.")
