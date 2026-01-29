const API = "https://supportticketclassifier.onrender.com"; // Replace with backend URL

document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const themeToggle = document.getElementById("themeToggle");
  const loadBtn = document.getElementById("loadBtn");
  const statusFilter = document.getElementById("statusFilter");
  const msg = document.getElementById("message");
  const ticketsDiv = document.getElementById("tickets");
  const total = document.getElementById("totalCount");
  const open = document.getElementById("openCount");
  const resolved = document.getElementById("resolvedCount");

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

  // Load tickets
  const loadTickets = () => {
    msg.textContent="⏳ Loading tickets...";
    ticketsDiv.innerHTML="";
    fetch(`${API}/tickets`)
      .then(r => r.json())
      .then(data => {
        const filterValue = statusFilter.value;
        if(filterValue) data = data.filter(t => t.ticketStatus === filterValue);
        msg.textContent=`✅ ${data.length} tickets loaded`;

        let o=0,r=0;
        data.forEach(t => {
          if(t.ticketStatus==="Open") o++;
          if(t.ticketStatus==="Resolved") r++;
          const div = document.createElement("div");
          div.className="ticket";
          div.innerHTML = `<b>${t.ticketClass}</b> • ${t.ticketStatus}<br/>
            ${t.complaint}<br/>
            <button onclick="resolveTicket(${t.complaintID})" ${t.ticketStatus==='Resolved'?'disabled':''}>Resolve</button>
            <p>${t.ticketRemarks || ''}</p>`;
          ticketsDiv.appendChild(div);
        });

        if(total) total.innerHTML=`${data.length}<br><small>Total</small>`;
        if(open) open.innerHTML=`${o}<br><small>Open</small>`;
        if(resolved) resolved.innerHTML=`${r}<br><small>Resolved</small>`;
      })
      .catch(()=> msg.textContent="❌ Failed to load tickets.");
  };

  if(loadBtn) loadBtn.addEventListener("click", loadTickets);
  if(statusFilter) statusFilter.addEventListener("change", loadTickets);

  // Expose resolve function globally
  window.resolveTicket = function(id){
    const remarks = prompt("Enter remarks for this ticket:");
    if(remarks===null) return;
    fetch(`${API}/resolve/${id}`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ticketRemarks:remarks})
    })
    .then(() => loadTickets())
    .catch(()=> alert("❌ Failed to resolve ticket."));
  };
});
