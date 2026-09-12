from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class LinkRequest(BaseModel):
    parentUserId: str
    guardianContact: EmailStr

class AlertRequest(BaseModel):
    parentUserId: str
    sourceModule: str  # "prevention" or "aftermath"
    riskType: str
    riskScore: float
    timestamp: str

class LinkStatusResponse(BaseModel):
    status: str

class AlertResponse(BaseModel):
    delivered: bool
