function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("collapsed");
  document.querySelector(".main-content").classList.toggle("expanded");
}

const inventoryList = document.getElementById("inventoryList");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// -------------------- Load Inventory --------------------
async function loadInventory() {
  try {
    const res = await fetch("http://localhost:3000/stocks");
    const stocks = await res.json();

    const tbody = document.querySelector("#inventoryTableBody tbody");
    tbody.innerHTML = "";

    if (!stocks || stocks.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4'>No items in inventory.</td></tr>";
      return;
    }

    stocks.forEach(stock => {
      const row = createInventoryRow(stock);
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error fetching inventory:", err);
    const tbody = document.querySelector("#inventoryTableBody tbody");
    tbody.innerHTML = "<tr><td colspan='4'>Failed to load inventory.</td></tr>";
  }
}

loadInventory();

// -------------------- Create Inventory Row --------------------
function createInventoryRow(stock) {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${stock.stockId}</td>
    <td>${stock.quantity}</td>
    <td>${stock.warehouseLocation}</td>
    <td>
      <button class="edit-btn" title="Edit"><i class="bi bi-pencil-fill"></i></button>
    </td>
  `;

  // Open edit modal with original values when button is clicked
  const editBtn = row.querySelector(".edit-btn");
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("edit-stockId").value = stock.stockId;
    document.getElementById("edit-quantity").value = stock.quantity;
    document.getElementById("edit-warehouseLocation").value = stock.warehouseLocation;

    editModal.classList.remove("hidden");
  });

  return row;
}

// -------------------- Add Inventory Modal --------------------
const addModal = document.getElementById("addInventoryModal");
const addCloseBtn = addModal.querySelector(".close");
const addBtn = document.getElementById("addInventoryBtn");

addBtn.addEventListener("click", () => addModal.classList.remove("hidden"));
addCloseBtn.addEventListener("click", () => addModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === addModal) addModal.classList.add("hidden");
});

// Handle Add form submission
document.getElementById("addInventoryForm").addEventListener("submit", async e => {
  e.preventDefault();

  const newStock = {
    stockId: document.getElementById("add-stockId").value,
    quantity: parseInt(document.getElementById("add-quantity").value, 10),
    warehouseLocation: document.getElementById("add-warehouseLocation").value
  };

  try {
    const res = await fetch("http://localhost:3000/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStock)
    });

    if (res.ok) {
      alert("✅ Inventory added!");
      addModal.classList.add("hidden");
      loadInventory();
    } else {
      const err = await res.json();
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

// -------------------- Edit Inventory Modal --------------------
const editModal = document.getElementById("editModal");
const editCloseBtn = editModal.querySelector(".close");

editCloseBtn.addEventListener("click", () => editModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === editModal) editModal.classList.add("hidden");
});

// Handle edit form submission (use edit- prefixed IDs)
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const updatedStock = {
    stockId: document.getElementById("edit-stockId").value,
    quantity: parseInt(document.getElementById("edit-quantity").value, 10),
    warehouseLocation: document.getElementById("edit-warehouseLocation").value
  };

  try {
    const res = await fetch(`http://localhost:3000/stocks/${updatedStock.stockId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedStock)
    });

    if (res.ok) {
      alert("✅ Stock updated!");
      editModal.classList.add("hidden");
      loadInventory();
    } else {
      const err = await res.json();
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

searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  document.querySelectorAll("#inventoryTableBody tbody tr").forEach(row => {
    const stockIdCell = row.querySelector("td:first-child"); // first column = Stock ID
    if (stockIdCell) {
      const stockId = stockIdCell.innerText.toLowerCase();
      row.style.display = stockId.includes(term) ? "" : "none";
    }
  });
});