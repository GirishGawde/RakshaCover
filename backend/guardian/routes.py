from fastapi import APIRouter
from pydantic import BaseModel
from models import LinkRequest, AlertRequest, LinkStatusResponse, AlertResponse
from linking import create_or_update_link, get_link_status, accept_link
from alert_dispatcher import dispatch_alert
import uuid

router = APIRouter(prefix="/guardian", tags=["Guardian"])

@router.post("/link")
def link_account(req: LinkRequest):
    """Creates a link between a vulnerable user and a guardian."""
    res = create_or_update_link(req.parentUserId, req.guardianContact)
    return {
        "linkId": res.get("id", str(uuid.uuid4())),
        "status": res.get("status", "pending")
    }

class LinkIdRequest(BaseModel):
    linkId: str

@router.post("/link/accept")
def accept_link_endpoint(req: LinkIdRequest):
    """Accepts a pending link request."""
    success = accept_link(req.linkId)
    return {"success": success}

@router.post("/alert", response_model=AlertResponse)
def trigger_alert(req: AlertRequest):
    """Internal endpoint: called by A and C when risk is detected."""
    success = dispatch_alert(
        parent_user_id=req.parentUserId,
        source_module=req.sourceModule,
        risk_type=req.riskType,
        risk_score=req.riskScore
    )
    return AlertResponse(delivered=success)

@router.get("/status")
def check_status(linkId: str):
    """Checks the status of a specific link."""
    status = get_link_status(linkId)
    return LinkStatusResponse(status=status)
