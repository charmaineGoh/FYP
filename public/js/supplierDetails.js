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

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    profileDropdown.classList.remove('show');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeProfile();
  loadSupplierDetails();
});

async function loadSupplierDetails() {
  const params = new URLSearchParams(window.location.search);
  const supplierId = params.get("id");

  if (!supplierId) {
    document.getElementById("supplierDetails").innerText = "No supplier ID provided.";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/suppliers/${supplierId}`);
    if (!res.ok) throw new Error("Failed to fetch supplier");
    const supplier = await res.json();

    document.getElementById("supplierDetails").innerHTML = `
      <p><strong>Name:</strong> ${supplier.supplierName}</p>
      <p><strong>Contact Person:</strong> ${supplier.supplierContactName}</p>
      <p><strong>Phone:</strong> ${supplier.supplierPhone}</p>
      <p><strong>Email:</strong> ${supplier.supplierEmail}</p>
      <p><strong>Address:</strong> ${supplier.supplierAddress}, ${supplier.supplierCity}, ${supplier.supplierCountry}</p>
    `;
  } catch (err) {
    document.getElementById("supplierDetails").innerText = "Error loading supplier details.";
    console.error(err);
  }
}

loadSupplierDetails();