// Backend API
const API = window.location.hostname.includes("localhost")
  ? "http://127.0.0.1:8000"
  : "https://supportticketclassifier.onrender.com";

// Elements
const loadBtn = document.getElementById("loadBtn");
const ticketsDiv = document.getElementById("tickets");
const statusFilter = document.getElementById("statusFilter");
const message = document.getElementById("message");
const backBtn = document.getElementById("backBtn");
const themeToggle = document.getElementById("themeToggle");

// Dark mode toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Back button
backBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

// Load tickets
loadBtn.addEventListener("click", async () => {
  const status = statusFilter.value;

  message.textContent = "Loading tickets...";
  ticketsDiv.innerHTML = "";

  try {
    const response = await fetch(`${API}/tickets`);
    const tickets = await response.json();

    if (!response.ok) {
      message.textContent = tickets.detail || "Failed to load tickets.";
      return;
    }

    let filtered = tickets;
    if (status) {
      filtered = tickets.filter(ticket => ticket.ticketStatus === status);
    }

    if (filtered.length === 0) {
      message.textContent = "No tickets found.";
      return;
    }

    // Stats
    document.getElementById("totalCount").innerHTML = `${tickets.length}<br><small>Total</small>`;
    document.getElementById("openCount").innerHTML = `${tickets.filter(t => t.ticketStatus === "Open").length}<br><small>Open</small>`;
    document.getElementById("resolvedCount").innerHTML = `${tickets.filter(t => t.ticketStatus === "Resolved").length}<br><small>Resolved</small>`;

    // Display tickets
    filtered.forEach(ticket => {
      const ticketCard = document.createElement("div");
      ticketCard.className = "ticket";
      ticketCard.innerHTML = `
        <strong>ID:</strong> ${ticket.complaintID} <br>
        <strong>Customer ID:</strong> ${ticket.custID} <br>
        <strong>Complaint:</strong> ${ticket.complaint} <br>
        <strong>Status:</strong> ${ticket.ticketStatus} <br>
        <strong>Category:</strong> ${ticket.ticketClass} <br>
        <strong>Remarks:</strong> ${ticket.ticketRemarks || "-"} <br>
        <button class="resolveBtn">Mark as Resolved</button>
      `;
      ticketsDiv.appendChild(ticketCard);

      const resolveBtn = ticketCard.querySelector(".resolveBtn");
      resolveBtn.addEventListener("click", async () => {
        try {
          const res = await fetch(`${API}/tickets/${ticket.complaintID}/resolve`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
          });

          const result = await res.json();
          if (res.ok) {
            ticketCard.querySelector("strong:nth-child(4)").textContent = `Status: Resolved`;
            ticketCard.querySelector("strong:nth-child(6)").textContent = `Remarks: ${result.ticketRemarks || "-"}`;
            message.textContent = "Ticket marked as resolved!";
          } else {
            message.textContent = result.detail || "Failed to resolve ticket.";
          }
        } catch (err) {
          message.textContent = "Error connecting to backend.";
          console.error(err);
        }
      });
    });

    message.textContent = "Tickets loaded!";
  } catch (error) {
    message.textContent = "Error fetching tickets.";
    console.error(error);
  }
});
