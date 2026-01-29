// Dynamic API URL (not used here, but good practice for consistency)
const API = window.location.hostname.includes("localhost")
  ? "http://127.0.0.1:8000"
  : "https://supportticketclassifier.onrender.com";

// Buttons
const customerBtn = document.getElementById("customerBtn");
const adminBtn = document.getElementById("adminBtn");
const themeToggle = document.getElementById("themeToggle");

// Navigate to pages
customerBtn.addEventListener("click", () => {
  window.location.href = "customer.html";
});

adminBtn.addEventListener("click", () => {
  window.location.href = "admin.html";
});

// Dark mode toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
