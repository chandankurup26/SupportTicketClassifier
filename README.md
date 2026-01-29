# Support Ticket Classifier

**Demo Project:** A working demo of a **Support Ticket Classifier** web application.  

It allows customers to submit complaints, which are automatically classified into **Billing, Technical, Delivery, or General** categories using **Google Gemini API**. Admins can view, filter, and resolve tickets dynamically.

## Features

- **Customer Side:** Submit complaints and see AI-based category.
- **Admin Side:** View tickets, filter by status, mark as resolved.
- **Automated Classification:** Uses **Google Gemini API** for categorization.
- **Reactive UI:** Buttons, messages, and stats update in real time.
- **Dark Mode:** Toggle between light and dark themes.

## Technologies & Frameworks

- **Backend:** Python, FastAPI, psycopg2 (PostgreSQL)
- **Frontend:** HTML, CSS, JavaScript
- **Database:** Neon Postgres
- **Hosting:** Render (backend), Vercel (frontend)
- **API:** Gemini API
- **Version Control:** GitHub

## Notes

- This project is a **demo** showcasing real-time ticket management and AI-powered classification.
- No authentication is implemented; all pages are publicly accessible for demonstration purposes.
