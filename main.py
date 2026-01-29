from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
import requests
from config import DATABASE_URL, GEMINI_API_KEY, GEMINI_API_URL
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for your frontend domain (Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Neon Postgres
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Create tables if not exist
cur.execute("""
CREATE TABLE IF NOT EXISTS customer (
    custID SERIAL PRIMARY KEY,
    complaintID SERIAL UNIQUE,
    complaint TEXT NOT NULL
);
""")
cur.execute("""
CREATE TABLE IF NOT EXISTS admin (
    ticketID SERIAL PRIMARY KEY,
    custID INT REFERENCES customer(custID),
    complaintID INT UNIQUE REFERENCES customer(complaintID),
    ticketDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticketStatus TEXT DEFAULT 'Open',
    ticketRemarks TEXT,
    ticketClass TEXT
);
""")
conn.commit()

# Pydantic models
class Complaint(BaseModel):
    complaint: str

class ResolveTicket(BaseModel):
    ticketRemarks: str

# -------- Gemini AI Classification --------
def classify_complaint(text: str) -> str:
    prompt = f"Classify this customer complaint into one of: Billing, Technical, Delivery, General:\n{text}"
    headers = {"Authorization": f"Bearer {GEMINI_API_KEY}"}
    json_data = {"prompt": prompt, "maxOutputTokens":50}

    try:
        response = requests.post(GEMINI_API_URL, headers=headers, json=json_data)
        response.raise_for_status()
        result = response.json()
        classification = result.get("candidates", [{}])[0].get("content", "General")
        # Ensure it is one of the four categories
        if classification not in ["Billing","Technical","Delivery","General"]:
            classification = "General"
        return classification
    except Exception as e:
        print("Gemini API error:", e)
        return "General"

# -------- ENDPOINTS --------

# Submit a new complaint
@app.post("/submit")
def submit_complaint(data: Complaint):
    classification = classify_complaint(data.complaint)
    # Insert into customer table
    cur.execute("INSERT INTO customer (complaint) VALUES (%s) RETURNING custID, complaintID;", (data.complaint,))
    custID, complaintID = cur.fetchone()
    # Insert into admin table
    cur.execute(
        "INSERT INTO admin (custID, complaintID, ticketClass) VALUES (%s, %s, %s);",
        (custID, complaintID, classification)
    )
    conn.commit()
    return {"custID": custID, "complaintID": complaintID, "classification": classification}

# Get all tickets
@app.get("/tickets")
def get_tickets():
    cur.execute("""
        SELECT a.complaintID, c.complaint, a.ticketStatus, a.ticketRemarks, a.ticketClass
        FROM admin a
        JOIN customer c ON a.complaintID = c.complaintID
        ORDER BY a.ticketDate DESC;
    """)
    rows = cur.fetchall()
    tickets = []
    for r in rows:
        tickets.append({
            "complaintID": r[0],
            "complaint": r[1],
            "ticketStatus": r[2],
            "ticketRemarks": r[3],
            "ticketClass": r[4]
        })
    return tickets

# Resolve ticket
@app.post("/resolve/{complaintID}")
def resolve_ticket(complaintID: int, data: ResolveTicket):
    cur.execute("UPDATE admin SET ticketStatus='Resolved', ticketRemarks=%s WHERE complaintID=%s;", (data.ticketRemarks, complaintID))
    conn.commit()
    return {"message":"Ticket resolved"}
