// Sidebar toggle
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

// DOM references
const supplierTableBody = document.querySelector("#supplierTable tbody");

const addModal = document.getElementById("addSupplierModal");
const editModal = document.getElementById("editSupplierModal");

const addBtn = document.getElementById("addSupplierBtn");
const addCloseBtn = addModal.querySelector(".close");
const editCloseBtn = editModal.querySelector(".close");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");


//  Load Suppliers 
async function loadSuppliers(category = "all") {
  try {
    const res = await fetch("http://localhost:3000/suppliers");
    const suppliers = await res.json();

    supplierTableBody.innerHTML = "";

    const filtered = category === "all"
      ? suppliers
      : suppliers.filter(s => s.supplierCategory?.toLowerCase() === category.toLowerCase());

    if (filtered.length === 0) {
      supplierTableBody.innerHTML = `<tr><td colspan="6">No suppliers found.</td></tr>`;
      return;
    }

    filtered.forEach(supplier => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${supplier.supplierName}</td>
        <td>${supplier.supplierContactName}</td>
        <td>${supplier.supplierAddress}, ${supplier.supplierCity}, ${supplier.supplierCountry}</td>
        <td>${supplier.supplierPhone}</td>
        <td>${supplier.supplierEmail}</td>
        <td class="actions">
          <button class="edit-btn" data-id="${supplier._id}" title="Edit"><i class="bi bi-pencil-fill"></i></button>
          <button class="delete-btn" data-id="${supplier._id}" title="Delete"><i class="bi bi-trash-fill"></i></button>
        </td>
      `;
      supplierTableBody.appendChild(row);

      // Edit button handler
      row.querySelector(".edit-btn").addEventListener("click", () => {
        document.getElementById("editSupplierId").value = supplier._id;
        document.getElementById("editSupplierName").value = supplier.supplierName;
        document.getElementById("editSupplierContactName").value = supplier.supplierContactName;
        document.getElementById("editSupplierPhone").value = supplier.supplierPhone;
        document.getElementById("editSupplierEmail").value = supplier.supplierEmail;
        document.getElementById("editSupplierAddress").value = supplier.supplierAddress;
        document.getElementById("editSupplierCity").value = supplier.supplierCity;
        document.getElementById("editSupplierCountry").value = supplier.supplierCountry;
        editModal.classList.remove("hidden");
      });

      // Delete button handler
      row.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm(`Delete supplier ${supplier.supplierName}?`)) {
          const res = await fetch(`http://localhost:3000/suppliers/${supplier._id}`, {
            method: "DELETE"
          });
          if (res.ok) {
            alert("✅ Supplier deleted!");
            loadSuppliers();
          } else {
            alert("❌ Failed to delete supplier.");
          }
        }
      });
    });
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    supplierTableBody.innerHTML = `<tr><td colspan="6">Failed to load suppliers.</td></tr>`;
  }
}

// Initial load
loadSuppliers();

//  Add Supplier Modal 
addBtn.addEventListener("click", () => addModal.classList.remove("hidden"));
addCloseBtn.addEventListener("click", () => addModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === addModal) addModal.classList.add("hidden");
});

// Add Supplier form submit
document.getElementById("addSupplierForm").addEventListener("submit", async e => {
  e.preventDefault();
  const supplier = {
    supplierName: document.getElementById("supplierName").value,
    supplierContactName: document.getElementById("supplierContactName").value,
    supplierPhone: document.getElementById("supplierPhone").value,
    supplierEmail: document.getElementById("supplierEmail").value,
    supplierAddress: document.getElementById("supplierAddress").value,
    supplierCity: document.getElementById("supplierCity").value,
    supplierCountry: document.getElementById("supplierCountry").value
  };
  const res = await fetch("http://localhost:3000/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(supplier)
  });
  if (res.ok) {
    alert("✅ Supplier added!");
    addModal.classList.add("hidden");
    loadSuppliers();
  } else {
    const err = await res.json();
    alert("❌ Failed to add supplier: " + err.error);
  }
});

//  Edit Supplier Modal 
editCloseBtn.addEventListener("click", () => editModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === editModal) editModal.classList.add("hidden");
});

// Edit Supplier form submit
document.getElementById("editSupplierForm").addEventListener("submit", async e => {
  e.preventDefault();
  const supplierId = document.getElementById("editSupplierId").value;
  const supplier = {
    supplierName: document.getElementById("editSupplierName").value,
    supplierContactName: document.getElementById("editSupplierContactName").value,
    supplierPhone: document.getElementById("editSupplierPhone").value,
    supplierEmail: document.getElementById("editSupplierEmail").value,
    supplierAddress: document.getElementById("editSupplierAddress").value,
    supplierCity: document.getElementById("editSupplierCity").value,
    supplierCountry: document.getElementById("editSupplierCountry").value
  };
  const res = await fetch(`http://localhost:3000/suppliers/${supplierId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(supplier)
  });
  if (res.ok) {
    alert("✅ Supplier updated!");
    editModal.classList.add("hidden");
    loadSuppliers();
  } else {
    const err = await res.json();
    alert("❌ Failed to update supplier: " + err.error);
  }
});

//  Search 

searchBtn.addEventListener("click", () => {
  const term = searchInput.value.trim().toLowerCase();

  document.querySelectorAll("#supplierTable tbody tr").forEach(row => {
    const supplierNameCell = row.querySelector("td:first-child"); 
    if (supplierNameCell) {
      const name = supplierNameCell.innerText.toLowerCase();
      row.style.display = name.includes(term) ? "" : "none";
    }
  });
});

searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  document.querySelectorAll("#supplierTable tbody tr").forEach(row => {
    const supplierNameCell = row.querySelector("td:first-child"); 
    if (supplierNameCell) {
      const name = supplierNameCell.innerText.toLowerCase();
      row.style.display = name.includes(term) ? "" : "none";
    }
  });
});

// Initialize on page load
loadSuppliers();
initializeProfile();