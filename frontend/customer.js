// Backend API
const API = window.location.hostname.includes("localhost")
  ? "http://127.0.0.1:8000"
  : "https://supportticketclassifier.onrender.com";

// Elements
const submitBtn = document.getElementById("submitBtn");
const complaintInput = document.getElementById("complaint");
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

// Submit complaint
submitBtn.addEventListener("click", async () => {
  const complaint = complaintInput.value.trim();
  if (!complaint) {
    message.textContent = "Please enter a complaint.";
    return;
  }

  message.textContent = "Submitting ticket...";

  try {
    const response = await fetch(`${API}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaint })
    });

    const data = await response.json();

    if (response.ok) {
      message.textContent = `Ticket submitted! ID: ${data.complaintID}, Category: ${data.classification}`;
      complaintInput.value = "";
    } else {
      message.textContent = data.detail || "Failed to submit ticket.";
    }
  } catch (error) {
    message.textContent = "Error connecting to backend.";
    console.error(error);
  }
});
