from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
import os
import google.generativeai as genai

# ----------------------
# FastAPI App
# ----------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://support-ticket-classifier-kappa.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Environment Variables
# ----------------------
DATABASE_URL = os.environ["DATABASE_URL"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

# ----------------------
# Gemini Setup
# ----------------------
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-pro")

# ----------------------
# Database Helper
# ----------------------
def get_db():
    return psycopg2.connect(DATABASE_URL, sslmode="require")

# ----------------------
# Pydantic Models
# ----------------------
class Complaint(BaseModel):
    complaint: str

class ResolveTicket(BaseModel):
    ticketRemarks: str

# ----------------------
# Root Check (IMPORTANT)
# ----------------------
@app.get("/")
def root():
    return {"status": "Support Ticket Classifier API running"}

# ----------------------
# Gemini Classification
# ----------------------
def classify_complaint(text: str) -> str:
    prompt = (
        "Classify this complaint into one category only:\n"
        "Billing, Technical, Delivery, or General.\n\n"
        f"Complaint: {text}"
    )

    try:
        response = model.generate_content(prompt)
        result = response.text.strip()
        if result not in ["Billing", "Technical", "Delivery", "General"]:
            return "General"
        return result
    except Exception as e:
        print("Gemini error:", e)
        return "General"

# ----------------------
# Submit Complaint
# ----------------------
@app.post("/submit")
def submit_complaint(data: Complaint):
    classification = classify_complaint(data.complaint)

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO customer (complaint) VALUES (%s) RETURNING custID, complaintID;",
            (data.complaint,)
        )
        custID, complaintID = cur.fetchone()

        cur.execute(
            """
            INSERT INTO admin (custID, complaintID, ticketClass)
            VALUES (%s, %s, %s);
            """,
            (custID, complaintID, classification)
        )

        conn.commit()

        return {
            "custID": custID,
            "complaintID": complaintID,
            "classification": classification
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()

# ----------------------
# Get Tickets (Admin)
# ----------------------
@app.get("/tickets")
def get_tickets():
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT a.complaintID, c.complaint,
                   a.ticketStatus, a.ticketRemarks, a.ticketClass
            FROM admin a
            JOIN customer c ON a.complaintID = c.complaintID
            ORDER BY a.ticketDate DESC;
        """)

        rows = cur.fetchall()

        return [
            {
                "complaintID": r[0],
                "complaint": r[1],
                "ticketStatus": r[2],
                "ticketRemarks": r[3],
                "ticketClass": r[4]
            }
            for r in rows
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()

# ----------------------
# Resolve Ticket
# ----------------------
@app.post("/resolve/{complaintID}")
def resolve_ticket(complaintID: int, data: ResolveTicket):
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            UPDATE admin
            SET ticketStatus = 'Resolved',
                ticketRemarks = %s
            WHERE complaintID = %s;
            """,
            (data.ticketRemarks, complaintID)
        )

        conn.commit()
        return {"message": "Ticket resolved"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()
