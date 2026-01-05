// Check if user is logged in
function checkAuth() {
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    window.location.href = 'index.html';
    return null;
  }
  
  return JSON.parse(currentUser);
}

// Check role-based access for current page
function checkPageAccess() {
  const user = checkAuth();
  if (!user) return;
  
  const currentPage = window.location.pathname.split('/').pop();
  
  // Define role permissions
  const rolePermissions = {
    superadmin: ['dashboard.html', 'products.html', 'inventory.html', 'movement.html', 'suppliers.html', 'usermanagement.html', 'settings.html', 'supplierDetails.html'],
    admin: ['dashboard.html', 'products.html', 'inventory.html', 'movement.html', 'suppliers.html', 'settings.html', 'supplierDetails.html'],
    staff: ['dashboard.html', 'products.html', 'inventory.html', 'movement.html']
  };
  
  const allowedPages = rolePermissions[user.role] || [];
  
  if (!allowedPages.includes(currentPage)) {
    alert('You do not have permission to access this page');
    window.location.href = 'dashboard.html';
  }
}

// Hide/show navigation items based on role
function updateNavigation() {
  const user = checkAuth();
  if (!user) return;
  
  // Hide User Management for admin and staff
  if (user.role === 'admin' || user.role === 'staff') {
    const userMgmtLink = document.querySelector('a[href="usermanagement.html"]');
    if (userMgmtLink && userMgmtLink.parentElement) {
      userMgmtLink.parentElement.style.display = 'none';
    }
  }
  
  // Hide Suppliers and Settings for staff
  if (user.role === 'staff') {
    const suppliersLink = document.querySelector('a[href="suppliers.html"]');
    const settingsLink = document.querySelector('a[href="settings.html"]');
    
    if (suppliersLink && suppliersLink.parentElement) {
      suppliersLink.parentElement.style.display = 'none';
    }
    if (settingsLink && settingsLink.parentElement) {
      settingsLink.parentElement.style.display = 'none';
    }
  }
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage === 'index.html' || currentPage === '') {
    return;
  }
  
  checkPageAccess();
  updateNavigation();
});
