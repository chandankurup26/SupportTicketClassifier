const API = window.location.hostname.includes("localhost")
  ? "http://127.0.0.1:8000"
  : "https://supportticketclassifier.onrender.com";

const loadBtn = document.getElementById("loadBtn");
const ticketsDiv = document.getElementById("tickets");
const statusFilter = document.getElementById("statusFilter");
const message = document.getElementById("message");
const backBtn = document.getElementById("backBtn");
const themeToggle = document.getElementById("themeToggle");

// Dark mode
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Back
backBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

// Load tickets
loadBtn.addEventListener("click", async () => {
  ticketsDiv.innerHTML = "";
  message.textContent = "Loading tickets...";

  try {
    const response = await fetch(`${API}/tickets`);

    if (!response.ok) {
      const err = await response.text();
      message.textContent = err || "Failed to load tickets.";
      return;
    }

    const tickets = await response.json();

    // Stats
    document.getElementById("totalCount").innerHTML =
      `${tickets.length}<br><small>Total</small>`;
    document.getElementById("openCount").innerHTML =
      `${tickets.filter(t => t.ticketStatus === "Open").length}<br><small>Open</small>`;
    document.getElementById("resolvedCount").innerHTML =
      `${tickets.filter(t => t.ticketStatus === "Resolved").length}<br><small>Resolved</small>`;

    const status = statusFilter.value;
    const filtered = status
      ? tickets.filter(t => t.ticketStatus === status)
      : tickets;

    if (filtered.length === 0) {
      message.textContent = "No tickets found.";
      return;
    }

    filtered.forEach(ticket => {
      const ticketCard = document.createElement("div");
      ticketCard.className = "ticket";

      ticketCard.innerHTML = `
        <strong>ID:</strong> ${ticket.complaintID}<br>
        <strong>Complaint:</strong> ${ticket.complaint}<br>
        <strong>Status:</strong> <span class="status">${ticket.ticketStatus}</span><br>
        <strong>Category:</strong> ${ticket.ticketClass}<br>
        <strong>Remarks:</strong> <span class="remarks">${ticket.ticketRemarks || "-"}</span><br>
        ${
          ticket.ticketStatus === "Open"
            ? `<button class="resolveBtn">Mark as Resolved</button>`
            : ""
        }
      `;

      ticketsDiv.appendChild(ticketCard);

      const resolveBtn = ticketCard.querySelector(".resolveBtn");
      if (resolveBtn) {
        resolveBtn.addEventListener("click", async () => {
          message.textContent = "Resolving ticket...";
          resolveBtn.disabled = true;

          try {
            const res = await fetch(`${API}/resolve/${ticket.complaintID}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticketRemarks: "Resolved by admin" })
            });

            if (!res.ok) {
              const err = await res.text();
              message.textContent = err || "Failed to resolve ticket.";
              resolveBtn.disabled = false;
              return;
            }

            ticketCard.querySelector(".status").textContent = "Resolved";
            ticketCard.querySelector(".remarks").textContent = "Resolved by admin";
            resolveBtn.remove();

            message.textContent = "Ticket resolved successfully!";
          } catch (err) {
            console.error(err);
            message.textContent = "Error connecting to backend.";
            resolveBtn.disabled = false;
          }
        });
      }
    });

    message.textContent = "Tickets loaded successfully!";
  } catch (error) {
    console.error(error);
    message.textContent = "Backend not reachable.";
  }
});
