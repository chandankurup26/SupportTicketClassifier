const API = "https://supportticketclassifier.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  // NAVIGATION
  const customerBtn = document.getElementById("customerBtn");
  const adminBtn = document.getElementById("adminBtn");
  const backBtn = document.getElementById("backBtn");
  if(customerBtn) customerBtn.onclick = () => location.href='customer.html';
  if(adminBtn) adminBtn.onclick = () => location.href='admin.html';
  if(backBtn) backBtn.onclick = () => location.href='index.html';

  // DARK MODE
  const themeToggle = document.getElementById("themeToggle");
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
  if(themeToggle) themeToggle.onclick = () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark':'light');
  };

  // CUSTOMER SUBMIT
  const submitBtn = document.getElementById("submitBtn");
  if(submitBtn) submitBtn.onclick = submitTicket;

  // ADMIN LOAD
  const loadBtn = document.getElementById("loadBtn");
  const statusFilter = document.getElementById("statusFilter");
  if(loadBtn) loadBtn.onclick = () => loadTickets(statusFilter?.value || "");
  if(statusFilter) statusFilter.onchange = () => loadTickets(statusFilter.value);
});

// -------- CUSTOMER SUBMIT --------
function submitTicket(){
  const complaint = document.getElementById("complaint").value.trim();
  const msg = document.getElementById("message");
  if(!complaint){ msg.textContent="❌ Please enter a complaint."; return; }
  msg.textContent="⏳ Submitting...";
  fetch(`${API}/submit`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({complaint})
  })
  .then(r=>r.json())
  .then(data=>{
    msg.textContent=`✅ Ticket submitted. Category: ${data.classification}`;
    document.getElementById("complaint").value='';
  })
  .catch(()=> msg.textContent="❌ Failed to submit ticket.");
}

// -------- ADMIN LOAD & RESOLVE --------
function loadTickets(filter=""){
  const msg = document.getElementById("message");
  const ticketsDiv = document.getElementById("tickets");
  const total = document.getElementById("totalCount");
  const open = document.getElementById("openCount");
  const resolved = document.getElementById("resolvedCount");
  ticketsDiv.innerHTML="";
  msg.textContent="⏳ Loading tickets...";

  fetch(`${API}/tickets`)
    .then(r=>r.json())
    .then(data=>{
      if(filter) data = data.filter(t => t.ticketStatus === filter);
      msg.textContent=`✅ ${data.length} tickets loaded`;
      let o=0,r=0;
      data.forEach(t=>{
        if(t.ticketStatus==="Open") o++;
        if(t.ticketStatus==="Resolved") r++;
        const div = document.createElement("div");
        div.className="ticket";
        div.innerHTML = `<b>${t.ticketClass}</b> • ${t.ticketStatus}<br/>
          ${t.complaint}<br/>
          <button onclick="resolveTicket(${t.complaintID})" ${t.ticketStatus==='Resolved'?'disabled':''}>Resolve</button>
          <p>${t.ticketRemarks||''}</p>`;
        ticketsDiv.appendChild(div);
      });
      if(total) total.innerHTML=`${data.length}<br><small>Total</small>`;
      if(open) open.innerHTML=`${o}<br><small>Open</small>`;
      if(resolved) resolved.innerHTML=`${r}<br><small>Resolved</small>`;
    })
    .catch(()=> msg.textContent="❌ Failed to load tickets.");
}

// -------- ADMIN RESOLVE --------
function resolveTicket(id){
  const remarks = prompt("Enter remarks for this ticket:");
  if(remarks===null) return;
  fetch(`${API}/resolve/${id}`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ticketRemarks:remarks})
  })
  .then(()=> loadTickets(document.getElementById("statusFilter")?.value || ""))
  .catch(()=> alert("❌ Failed to resolve ticket."));
}
