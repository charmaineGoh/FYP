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

const inventoryList = document.getElementById("inventoryList");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// Sorting state
let sortState = {
  column: 'quantity',
  direction: 'asc' 
};

let currentStocks = []; // Store current stocks for sorting

// Load Inventory with automatic sync from products
async function loadInventory(silentRefresh = false) {
  try {
    const res = await fetch("/stocks");
    const stocks = await res.json();
    currentStocks = stocks; 

    // Sort by quantity (lowest to highest) on first load
    const sortedStocks = [...stocks].sort((a, b) => a.quantity - b.quantity);
    renderInventoryTable(sortedStocks);

    // Check and display low stock alerts
    updateLowStockAlert(stocks);
    
    // Log silent refresh for debugging
    if (silentRefresh) {
      console.log("[inventory.js] Auto-synced stock data with products");
    }
  } catch (err) {
    console.error("Error fetching inventory:", err);
    const tbody = document.querySelector("#inventoryTableBody tbody");
    if (tbody) {
      tbody.innerHTML = "<tr><td colspan='5'>Failed to load inventory.</td></tr>";
    }
  }
}

// Auto-refresh inventory every 30 seconds to sync with product changes
let autoRefreshInterval = null;

function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  // Refresh every 5 seconds to keep inventory synced with product changes
  autoRefreshInterval = setInterval(() => {
    loadInventory(true); 
  }, 5000);
  
  console.log("[inventory.js] Auto-refresh started (5s intervals)");
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.log("[inventory.js] Auto-refresh stopped");
  }
}

// Render inventory table with sorting
function renderInventoryTable(stocks) {
  const tbody = document.querySelector("#inventoryTableBody tbody");
  tbody.innerHTML = "";

  if (!stocks || stocks.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>No items in inventory.</td></tr>";
    return;
  }

  stocks.forEach(stock => {
    const row = createInventoryRow(stock);
    tbody.appendChild(row);
  });
}

// Sort inventory by quantity
function sortInventory(column, direction) {
  const sortedStocks = [...currentStocks];
  
  if (column === 'quantity') {
    sortedStocks.sort((a, b) => {
      const aVal = a.quantity;
      const bVal = b.quantity;
      
      if (direction === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });
  }
  
  // Update header indicators
  updateSortIndicators(column, direction);
  
  // Render sorted table
  renderInventoryTable(sortedStocks);
}

// Create Inventory Rowwww
function createInventoryRow(stock) {
  const row = document.createElement("tr");
  const isLowStock = stock.quantity < 10;
  const supplierName = stock.supplierId?.supplierName || "—";

  row.innerHTML = `
    <td>${stock.stockId}</td>
    <td><span class="quantity-value">${stock.quantity}</span></td>
    <td>${stock.warehouseLocation}</td>
    <td>${supplierName}</td>
    <td>
      <button class="edit-btn" title="Edit"><i class="bi bi-pencil-fill"></i></button>
      <button class="delete-btn" title="Delete"><i class="bi bi-trash-fill"></i></button>
      ${!stock.productId ? `<button class="add-to-products-btn" title="Add to Products"><i class="bi bi-plus-circle"></i></button>` : ''}
    </td>
  `;
  
  if (isLowStock) {
    row.classList.add('low-stock-row');
  }

  // Store stock data in row for easy access
  row.dataset.stockId = stock.stockId;
  row.dataset.productId = stock.productId?._id || '';
  row.dataset.supplierId = stock.supplierId?._id || '';
  row.dataset.quantity = stock.quantity;

  // Open edit modal with original values when button is clicked
  const editBtn = row.querySelector(".edit-btn");
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("edit-stockId").value = stock.stockId;
    document.getElementById("edit-quantity").value = stock.quantity;
    document.getElementById("edit-warehouseLocation").value = stock.warehouseLocation;
    document.getElementById("edit-supplierId").value = stock.supplierId?._id || '';

    editModal.classList.remove("hidden");
  });

  // Delete button functionality
  const deleteBtn = row.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete stock ${stock.stockId}?`)) {
      try {
        const res = await fetch(`/stocks/${stock._id}`, {
          method: "DELETE"
        });
        
        if (res.ok) {
          alert("✅ Stock deleted successfully!");
          loadInventory();
        } else {
          alert("❌ Failed to delete stock.");
        }
      } catch (error) {
        console.error("Error deleting stock:", error);
        alert("❌ Error deleting stock.");
      }
    }
  });

  // Add to Products functionality
  const addToProductsBtn = row.querySelector(".add-to-products-btn");
  if (addToProductsBtn) {
    addToProductsBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      
      
      showAddProductFromInventoryModal(stock);
    });
  }

  return row;
}

// Add Inventory Modal 
const addModal = document.getElementById("addInventoryModal");
const addCloseBtn = addModal.querySelector(".close");
const addBtn = document.getElementById("addInventoryBtn");

addBtn.addEventListener("click", async () => {
  // Load products and suppliers list for selection
  await loadProductsForSelection();
  await loadSuppliersForSelection();
  addModal.classList.remove("hidden");
});
addCloseBtn.addEventListener("click", () => addModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === addModal) addModal.classList.add("hidden");
});

// Load products for selection dropdown
async function loadProductsForSelection() {
  try {
    const res = await fetch("/products");
    const products = await res.json();

    const productSelect = document.getElementById("add-productId");
    if (productSelect) {
      productSelect.innerHTML = '<option value="">-- Select Product (Optional) --</option>';
      products.forEach(product => {
        const option = document.createElement("option");
        option.value = product._id;
        option.textContent = `${product.productName} (${product.category})`;
        productSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// Load suppliers for selection dropdown
async function loadSuppliersForSelection() {
  try {
    const res = await fetch("/suppliers");
    const suppliers = await res.json();

    const supplierSelect = document.getElementById("add-supplierId");
    const editSupplierSelect = document.getElementById("edit-supplierId");
    
    const supplierOptions = '<option value="">-- Select Supplier (Optional) --</option>' + 
      suppliers.map(supplier => `<option value="${supplier._id}">${supplier.supplierName}</option>`).join('');
    
    if (supplierSelect) {
      supplierSelect.innerHTML = supplierOptions;
    }
    if (editSupplierSelect) {
      editSupplierSelect.innerHTML = supplierOptions;
    }
  } catch (err) {
    console.error("Error loading suppliers:", err);
  }
}

// Handle Add form submission
document.getElementById("addInventoryForm").addEventListener("submit", async e => {
  e.preventDefault();

  const productId = document.getElementById("add-productId")?.value || null;
  const supplierId = document.getElementById("add-supplierId")?.value || null;
  const stockId = document.getElementById("add-stockId")?.value || null;

  const newStock = {
    productId: productId || undefined,
    supplierId: supplierId || undefined,
    stockId: stockId || undefined,
    quantity: parseInt(document.getElementById("add-quantity").value, 10),
    warehouseLocation: document.getElementById("add-warehouseLocation").value
  };

  console.log("Adding stock with supplier:", newStock);

  try {
    const res = await fetch("/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStock)
    });

    console.log("Add response status:", res.status);

    if (res.ok) {
      const savedStock = await res.json();
      console.log("Stock saved:", savedStock);
      alert("✅ Inventory added!");
      addModal.classList.add("hidden");
      loadInventory();
    } else {
      const contentType = res.headers.get('content-type') || '';
      let err;
      if (contentType.includes('application/json')) {
        try { err = await res.json(); } catch { err = { error: 'Invalid JSON error response' }; }
      } else {
        const text = await res.text();
        err = { error: text || res.statusText };
      }
      const errorMessage = err.error || err.message || "Unknown error";
      
      // Check for duplicate key error
      if (errorMessage.includes('E11000') || errorMessage.includes('duplicate key')) {
        alert("❌ Stock ID already exists! Please use a different Stock ID.");
      } else {
        alert("❌ Failed: " + errorMessage);
      }
    }
  } catch (err) {
    console.error("Error adding inventory:", err);
    alert("❌ Error adding inventory.");
  }
});

// Edit Inventory Modal 
const editModal = document.getElementById("editModal");
const editCloseBtn = editModal.querySelector(".close");

editCloseBtn.addEventListener("click", () => editModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === editModal) editModal.classList.add("hidden");
});

// Load products for edit modal's product selection
async function loadProductsForEditSelection() {
  try {
    const res = await fetch("/products");
    const products = await res.json();

    const productSelect = document.getElementById("edit-productId");
    if (productSelect) {
      productSelect.innerHTML = '<option value="">-- No Product Linked --</option>';
      products.forEach(product => {
        const option = document.createElement("option");
        option.value = product._id;
        option.textContent = `${product.productName} (${product.category})`;
        productSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error loading products:", err);
  }
}
// Handle edit form submission 
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const supplierId = document.getElementById("edit-supplierId")?.value || null;
  const stockId = document.getElementById("edit-stockId").value;

  const updatedStock = {
    stockId: stockId,
    supplierId: supplierId || undefined,
    quantity: parseInt(document.getElementById("edit-quantity").value, 10),
    warehouseLocation: document.getElementById("edit-warehouseLocation").value
  };

  console.log("Updating stock:", updatedStock);

  try {
    const res = await fetch(`/stocks/${stockId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedStock)
    });

    console.log("Update response status:", res.status);

    if (res.ok) {
      const updatedData = await res.json();
      console.log("Stock updated:", updatedData);
      alert("✅ Stock updated!");
      editModal.classList.add("hidden");
      loadInventory();
    } else {
      const contentType = res.headers.get('content-type') || '';
      let err;
      if (contentType.includes('application/json')) {
        try { err = await res.json(); } catch { err = { error: 'Invalid JSON error response' }; }
      } else {
        const text = await res.text();
        err = { error: text || res.statusText };
      }
      alert("❌ Failed to update: " + err.error);
    }
  } catch (err) {
    console.error("Error updating stock:", err);
    alert("❌ Error updating stock.");
  }
});

searchBtn.addEventListener("click", () => {
  const term = searchInput.value.trim().toLowerCase();

  document.querySelectorAll("#inventoryTableBody tbody tr").forEach(row => {
    const stockIdCell = row.querySelector("td:first-child"); // first column = Stock ID
    if (stockIdCell) {
      const stockId = stockIdCell.innerText.toLowerCase();
      row.style.display = stockId.includes(term) ? "" : "none";
    }
  });
});

// Add Product from Inventory 
function showAddProductFromInventoryModal(stock) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  // Determine which category to pre-select
  const categoryToSelect = stock.category || (stock.productId?.category) || 'Shirts';
  
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
      <h3>Add to Products</h3>
      <form id="addProductFromInventoryForm">
        <label for="productName">Product Name:</label>
        <input type="text" id="productName" placeholder="Enter product name" value="${stock.stockId}" required>

        <label for="productCategory">Category:</label>
        <select id="productCategory" required>
          <option value="Shirts" ${categoryToSelect.toLowerCase() === 'shirts' ? 'selected' : ''}>Shirts</option>
          <option value="Pants" ${categoryToSelect.toLowerCase() === 'pants' ? 'selected' : ''}>Pants</option>
          <option value="Accessories" ${categoryToSelect.toLowerCase() === 'accessories' ? 'selected' : ''}>Accessories</option>
        </select>

        <label for="productDescription">Description:</label>
        <input type="text" id="productDescription" placeholder="Enter product description" required>

        <label for="productImage">Product Image:</label>
        <input type="file" id="productImage" accept="image/*" required>

        <label for="productPrice">Price:</label>
        <input type="number" id="productPrice" step="0.01" placeholder="Enter price" required>

        <label for="productQuantity">Quantity (from stock):</label>
        <input type="number" id="productQuantity" value="${stock.quantity}" readonly>

        <button type="submit" class="btn-primary">Add to Products</button>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.classList.remove('hidden');

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.getElementById('addProductFromInventoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const imageFile = document.getElementById("productImage").files[0];
    
    
    let imageUrl = null;
    if (imageFile) {
      
      if (imageFile.size > 2097152) {
        alert("❌ Image is too large. Please use an image smaller than 2MB.");
        return;
      }

      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(imageFile);
      });
    } else {
      alert("❌ Please select an image");
      return;
    }

    const newProduct = {
      productName: document.getElementById("productName").value,
      category: document.getElementById("productCategory").value,
      description: document.getElementById("productDescription").value,
      image: imageUrl,
      price: parseFloat(document.getElementById("productPrice").value),
      quantity: parseInt(document.getElementById("productQuantity").value, 10)
    };

    console.log("Submitting product:", newProduct);

    try {
      const res = await fetch("/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct)
      });

      console.log("Response status:", res.status);

      if (res.ok) {
        const product = await res.json();
        console.log("Product created:", product);
        
        
        const updateStockRes = await fetch(`/stocks/${stock.stockId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: stock.quantity })
        });

        if (updateStockRes.ok) {
          alert("✅ Product added and linked to inventory!");
          modal.remove();
          loadInventory();
        } else {
          alert("✅ Product added!");
          modal.remove();
          loadInventory();
        }
      } else {
        const contentType = res.headers.get('content-type') || '';
        let err;
        if (contentType.includes('application/json')) {
          try { err = await res.json(); } catch { err = { error: 'Invalid JSON error response' }; }
        } else {
          const text = await res.text();
          err = { error: text || res.statusText };
        }
        console.error("Backend error:", err);
        alert("❌ Failed to add product: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error adding product from inventory:", err);
      alert("❌ Error adding product: " + err.message);
    }
  });
}
// Low Stock Alert 
function updateLowStockAlert(stocks) {
  const lowStockAlertsEnabled = localStorage.getItem("lowStockAlerts") === "true";
  
  if (!lowStockAlertsEnabled) {
    document.getElementById('lowStockAlert').style.display = 'none';
    return;
  }
  
  const lowStockItems = stocks.filter(stock => stock.quantity < 10);
  const alertDiv = document.getElementById('lowStockAlert');
  const countSpan = document.getElementById('lowStockCount');

  if (lowStockItems.length > 0) {
    alertDiv.style.display = 'flex';
    countSpan.textContent = `${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} below 10 units`;
  } else {
    alertDiv.style.display = 'none';
  }
}

// Update sort column indicators in header
function updateSortIndicators(column, direction) {
  // Clear all indicators
  document.querySelectorAll("#inventoryTableBody th").forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    const arrow = th.querySelector('.sort-arrow');
    if (arrow) arrow.remove();
  });

  // Add indicator to current sort column
  if (column === 'quantity') {
    const quantityHeader = document.querySelectorAll("#inventoryTableBody th")[1]; // Quantity is 2nd column
    quantityHeader.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
    const arrow = document.createElement('span');
    arrow.className = 'sort-arrow';
    arrow.textContent = direction === 'asc' ? ' ↑' : ' ↓';
    quantityHeader.appendChild(arrow);
  }
}

// Initialize header click handlers for sorting
function initializeSortHandlers() {
  const quantityHeader = document.querySelectorAll("#inventoryTableBody th")[1]; // Quantity column
  
  quantityHeader.style.cursor = 'pointer';
  quantityHeader.addEventListener('click', () => {
    // Toggle between ascending and descending
    if (sortState.direction === 'asc') {
      sortState.direction = 'desc';
    } else {
      sortState.direction = 'asc';
    }
    
    sortInventory('quantity', sortState.direction);
  });
}

searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  document.querySelectorAll("#inventoryTableBody tbody tr").forEach(row => {
    const stockIdCell = row.querySelector("td:first-child"); 
    if (stockIdCell) {
      const stockId = stockIdCell.innerText.toLowerCase();
      row.style.display = stockId.includes(term) ? "" : "none";
    }
  });
});

// Initialize profile on page load
loadInventory();
setTimeout(() => {
  initializeSortHandlers();
  updateSortIndicators('quantity', 'asc'); // Show ascending indicator on load
}, 100); // Delay to ensure table is rendered
initializeProfile();
loadSuppliersForSelection();

// Start auto-refresh to sync with product changes
startAutoRefresh();

// Stop auto-refresh when user leaves the page
window.addEventListener('beforeunload', stopAutoRefresh);