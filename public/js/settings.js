function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("collapsed");
  document.querySelector(".main-content").classList.toggle("expanded");
}

// Profile dropdown functionality
function initializeProfile() {
  const user = checkAuth();
  if (!user) return;

  const profileAvatar = document.getElementById('profile-avatar');
  const profileDropdown = document.getElementById('profile-dropdown');
  const profileName = document.getElementById('profile-name');
  const profileInitial = document.getElementById('profile-initial');

  // Set profile name and initial
  profileName.textContent = user.name || user.email || 'User';
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  profileInitial.textContent = initial;

  // Toggle dropdown on avatar click
  profileAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
  });

  
  document.addEventListener('click', () => {
    profileDropdown.classList.remove('show');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeProfile();
  
  // Load saved settings
  const lowStockAlertsCheckbox = document.getElementById("low-stock-alerts");
  const savedLowStockAlerts = localStorage.getItem("lowStockAlerts") === "true";
  lowStockAlertsCheckbox.checked = savedLowStockAlerts;
  
  // Save setting immediately when checkbox is toggled
  lowStockAlertsCheckbox.addEventListener("change", () => {
    localStorage.setItem("lowStockAlerts", lowStockAlertsCheckbox.checked);
    console.log("Low Stock Alerts setting saved:", lowStockAlertsCheckbox.checked);
  });

  // Add form submit listener
  const notificationForm = document.getElementById("notification-form");
  if (notificationForm) {
    notificationForm.addEventListener("submit", function(e) {
      e.preventDefault(); 

      const lowStockAlertsChecked = document.getElementById("low-stock-alerts").checked;
      const emailChecked = document.getElementById("email-notifications").checked;
      const smsChecked = document.getElementById("sms-notifications").checked;

      // Save settings to localStorage
      localStorage.setItem("lowStockAlerts", lowStockAlertsChecked);
      
      //  log or alert
      console.log("Low Stock Alerts:", lowStockAlertsChecked);
      console.log("Email Notifications:", emailChecked);
      console.log("SMS Notifications:", smsChecked);

      
      const alertStatus = lowStockAlertsChecked ? "enabled" : "disabled";
      alert(`✅ Settings saved!\nLow Stock Alert: ${alertStatus}`);
    });
  }
});
