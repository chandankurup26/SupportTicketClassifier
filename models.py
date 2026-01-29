from pydantic import BaseModel

class Complaint(BaseModel):
    complaint: str

class ResolveTicket(BaseModel):
    complaintID: int
    remarks: str
    status: str