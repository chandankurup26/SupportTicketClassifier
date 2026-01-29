const API = "https://YOUR_RENDER_BACKEND_URL"; // Replace with your backend URL

document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");
  const backBtn = document.getElementById("backBtn");
  const themeToggle = document.getElementById("themeToggle");
  const msg = document.getElementById("message");

  // Back button
  if(backBtn) backBtn.addEventListener("click", () => location.href='index.html');

  // Dark mode
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
  if(themeToggle){
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark')?'dark':'light');
    });
  }

  // Submit ticket
  if(submitBtn) submitBtn.addEventListener("click", () => {
    const complaint = document.getElementById("complaint").value.trim();
    if(!complaint){ msg.textContent="❌ Please enter a complaint."; return; }
    msg.textContent="⏳ Submitting...";

    fetch(`${API}/submit`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({complaint})
    })
    .then(r => r.json())
    .then(data => {
      msg.textContent = `✅ Ticket submitted. Category: ${data.classification}`;
      document.getElementById("complaint").value = "";
    })
    .catch(() => { msg.textContent = "❌ Failed to submit ticket." });
  });
});
