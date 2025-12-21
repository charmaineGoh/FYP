function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("collapsed");
  document.querySelector(".main-content").classList.toggle("expanded");
}

document.getElementById("notification-form").addEventListener("submit", function(e) {
  e.preventDefault(); // stop page reload

  const emailChecked = document.getElementById("email-notifications").checked;
  const smsChecked = document.getElementById("sms-notifications").checked;

  // For now, just log or alert
  console.log("Email Notifications:", emailChecked);
  console.log("SMS Notifications:", smsChecked);

  alert("Settings saved!");
});