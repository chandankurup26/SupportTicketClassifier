from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()
DB_URL = os.getenv("DATABASE_URL")

# ---------- MODELS ----------
class Ticket(BaseModel):
    complaint: str

class ResolveTicket(BaseModel):
    ticketRemarks: str

# ---------- DB HELPER ----------
def get_conn():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

# ---------- SUBMIT TICKET ----------
@app.post("/submit")
def submit_ticket(ticket: Ticket):
    try:
        conn = get_conn()
        cur = conn.cursor()

        # AI placeholder
        text = ticket.complaint.lower()
        if "bill" in text or "payment" in text:
            category = "Billing"
        elif "deliver" in text or "order" in text:
            category = "Delivery"
        elif "crash" in text or "bug" in text:
            category = "Technical"
        else:
            category = "General"

        # Insert Customer
        cur.execute(
            "INSERT INTO Customer (complaint) VALUES (%s) RETURNING custID, complaintID",
            (ticket.complaint,)
        )
        row = cur.fetchone()

        # Insert Admin table with category
        cur.execute(
            "INSERT INTO Admin (custID, complaintID, ticketClass) VALUES (%s, %s, %s)",
            (row["custID"], row["complaintID"], category)
        )

        conn.commit()
        cur.close()
        conn.close()

        return {"custID": row["custID"], "complaintID": row["complaintID"], "classification": category}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- GET ALL TICKETS ----------
@app.get("/tickets")
def get_tickets():
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT c.complaintID, c.complaint, a.ticketClass, a.ticketStatus, a.ticketRemarks
            FROM Customer c
            LEFT JOIN Admin a ON c.complaintID = a.complaintID
            ORDER BY c.complaintID DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- RESOLVE TICKET ----------
@app.post("/resolve/{complaint_id}")
def resolve_ticket(complaint_id: int, resolve: ResolveTicket):
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            UPDATE Admin SET ticketStatus='Resolved', ticketRemarks=%s
            WHERE complaintID=%s
        """, (resolve.ticketRemarks, complaint_id))
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "Resolved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
