document.addEventListener("DOMContentLoaded", () => {
  const customerBtn = document.getElementById("customerBtn");
  const adminBtn = document.getElementById("adminBtn");
  const themeToggle = document.getElementById("themeToggle");

  // Navigation
  if(customerBtn) customerBtn.addEventListener("click", () => location.href='customer.html');
  if(adminBtn) adminBtn.addEventListener("click", () => location.href='admin.html');

  // Dark mode
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
  if(themeToggle){
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark')?'dark':'light');
    });
  }
});
