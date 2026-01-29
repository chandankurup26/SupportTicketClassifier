from fastapi import FastAPI
from db import conn, cursor
from models import Complaint, ResolveTicket
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Gemini setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-pro")

def classify_ticket(text):
    prompt = f"""
    Classify the following customer complaint into ONLY one category:
    Billing, Technical, Delivery, or General.

    Complaint: {text}

    Respond with ONLY the category name.
    """
    response = model.generate_content(prompt)
    return response.text.strip()

@app.post("/submit")
def submit_complaint(data: Complaint):
    ticket_class = classify_ticket(data.complaint)

    cursor.execute(
        "INSERT INTO Customer (complaint) VALUES (%s) RETURNING custID, complaintID",
        (data.complaint,)
    )
    custID, complaintID = cursor.fetchone()

    cursor.execute(
        "INSERT INTO Admin (custID, complaintID, ticketClass) VALUES (%s, %s, %s)",
        (custID, complaintID, ticket_class)
    )

    conn.commit()

    return {
        "message": "Complaint submitted",
        "classification": ticket_class,
        "complaintID": complaintID
    }

@app.get("/tickets")
def get_tickets():
    cursor.execute("""
        SELECT A.ticketDate, A.custID, A.complaintID,
               A.ticketStatus, A.ticketRemarks, A.ticketClass,
               C.complaint
        FROM Admin A
        JOIN Customer C ON A.complaintID = C.complaintID
    """)
    rows = cursor.fetchall()

    tickets = []
    for r in rows:
        tickets.append({
            "ticketDate": r[0],
            "custID": r[1],
            "complaintID": r[2],
            "status": r[3],
            "remarks": r[4],
            "class": r[5],
            "complaint": r[6]
        })
    return tickets

@app.post("/resolve")
def resolve_ticket(data: ResolveTicket):
    cursor.execute("""
        UPDATE Admin
        SET ticketStatus=%s, ticketRemarks=%s
        WHERE complaintID=%s
    """, (data.status, data.remarks, data.complaintID))
    conn.commit()

    return {"message": "Ticket updated"}