from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()
DB_URL = os.getenv("DATABASE_URL")

# Models
class Ticket(BaseModel):
    complaint: str

# DB Connection helper
def get_conn():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

# -------- Submit a ticket ----------
@app.post("/submit")
def submit_ticket(ticket: Ticket):
    try:
        conn = get_conn()
        cur = conn.cursor()

        # Simple AI classifier simulation (replace with Gemini API call)
        text = ticket.complaint.lower()
        if "bill" in text or "payment" in text:
            category = "Billing"
        elif "deliver" in text or "order" in text:
            category = "Delivery"
        elif "crash" in text or "bug" in text:
            category = "Technical"
        else:
            category = "General"

        # Insert into Customer table
        cur.execute(
            """
            INSERT INTO Customer (complaint) VALUES (%s) RETURNING custID, complaintID;
            """,
            (ticket.complaint,),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return {"custID": row["custID"], "complaintID": row["complaintID"], "classification": category}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------- Retrieve tickets ----------
@app.get("/tickets")
def get_tickets():
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT c.complaintID, c.complaint, a.ticketClass, a.ticketStatus as status
            FROM Customer c
            LEFT JOIN Admin a ON c.complaintID = a.complaintID
            ORDER BY c.complaintID DESC;
            """
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
