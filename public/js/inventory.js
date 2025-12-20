function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("collapsed");
  document.querySelector(".main-content").classList.toggle("expanded");
}

const inventoryList = document.getElementById("inventoryList");

// -------------------- Load Inventory --------------------
async function loadInventory() {
  try {
    const res = await fetch("http://localhost:3000/stocks");
    const stocks = await res.json();

    inventoryList.innerHTML = "";

    if (!stocks || stocks.length === 0) {
      inventoryList.innerHTML = "<p>No items in inventory.</p>";
      return;
    }

    stocks.forEach(stock => {
      const card = createInventoryCard(stock);
      inventoryList.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching inventory:", err);
    inventoryList.innerHTML = "<p>Failed to load inventory.</p>";
  }
}

loadInventory();

// -------------------- Create Inventory Card --------------------
function createInventoryCard(stock) {
  const card = document.createElement("div");
  card.classList.add("inventory-card");

  card.innerHTML = `
    <img src="${stock.image}" alt="${stock.stockId}">
    <div class="inventory-info">
      <h3>${stock.stockId}</h3>
      <p>Quantity: ${stock.quantity}</p>
      <p>Warehouse: ${stock.warehouseLocation}</p>
    </div>
  `;

  // Open edit modal with original values
  card.addEventListener("click", () => {
    document.getElementById("edit-stockId").value = stock.stockId;
    document.getElementById("edit-quantity").value = stock.quantity;
    document.getElementById("edit-warehouseLocation").value = stock.warehouseLocation;
    document.getElementById("edit-image").value = stock.image;

    editModal.classList.remove("hidden");
  });

  return card;
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

// Handle Add form submission (use add- prefixed IDs)
document.getElementById("addInventoryForm").addEventListener("submit", async e => {
  e.preventDefault();

  const productIdValue = document.getElementById("add-productId").value.trim();
  const newStock = {
    stockId: document.getElementById("add-stockId").value,
    productId: productIdValue === "" || productIdValue.toUpperCase() === "NIL" ? null : productIdValue,
    quantity: parseInt(document.getElementById("add-quantity").value, 10),
    warehouseLocation: document.getElementById("add-warehouseLocation").value,
    image: document.getElementById("add-image").value
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
      alert("❌ Failed: " + err.error);
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
    warehouseLocation: document.getElementById("edit-warehouseLocation").value,
    image: document.getElementById("edit-image").value
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