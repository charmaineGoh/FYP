function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("collapsed");
  document.querySelector(".main-content").classList.toggle("expanded");
}

// Get product list container
const productList = document.getElementById('productList');

// Load products from backend
async function loadProduct() {
  try {
    const res = await fetch("http://localhost:3000/products");
    const products = await res.json();

    productList.innerHTML = '';

    if (!products || products.length === 0) {
      productList.innerHTML = "<p>No products found.</p>";
      return;
    }

    products.forEach(product => {
      const card = createProductCard(product);
      productList.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    productList.innerHTML = "<p>Failed to load products.</p>";
  }
}
loadProduct();

// Create product card
function createProductCard(product) {
  const card = document.createElement("div");
  card.classList.add("product-card");

  card.innerHTML = `
    <img src="${product.image}" alt="${product.productName}">
    <div class="product-info">
      <h3>${product.productName}</h3>
      <p>Price: ${product.price}</p>
      <p>Quantity: ${product.quantity}</p>
      <p>Description: ${product.description}</p>
    </div>
  `;

  // Open edit modal when card clicked
  card.addEventListener("click", () => {
    document.getElementById("editProductId").value = product._id || product.productId;
    document.getElementById("editProductName").value = product.productName;
    document.getElementById("editProductCategory").value = product.category;
    document.getElementById("editProductDescription").value = product.description;
    document.getElementById("editProductImage").value = product.image;
    document.getElementById("editProductPrice").value = product.price;
    document.getElementById("editProductQuantity").value = product.quantity;

    editModal.classList.remove("hidden");
  });

  return card;
}

// ----- Add Product Modal -----
const addModal = document.getElementById("addProductModal");
const addBtn = document.getElementById("addProductBtn");
const addCloseBtn = addModal.querySelector(".close");

addBtn.addEventListener("click", () => addModal.classList.remove("hidden"));
addCloseBtn.addEventListener("click", () => addModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === addModal) addModal.classList.add("hidden");
});

// Handle Add Product form
document.getElementById("addProductForm").addEventListener("submit", async e => {
  e.preventDefault();

  const product = {
    productName: document.getElementById("productName").value,
    category: document.getElementById("productCategory").value,
    description: document.getElementById("productDescription").value,
    image: document.getElementById("productImage").value, // ⚠️ if using file upload, switch to FormData
    price: parseFloat(document.getElementById("productPrice").value),
    quantity: parseInt(document.getElementById("productQuantity").value, 10)
  };

  try {
    const res = await fetch("http://localhost:3000/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });

    if (res.ok) {
      alert("✅ Product added!");
      addModal.classList.add("hidden");
      loadProduct();
    } else {
      const err = await res.json();
      alert("❌ Failed: " + err.error);
    }
  } catch (err) {
    console.error("Error adding product:", err);
    alert("❌ Error adding product.");
  }
});

// ----- Edit Product Modal -----
const editModal = document.getElementById("editProductModal");
const editCloseBtn = editModal.querySelector(".close");

editCloseBtn.addEventListener("click", () => editModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === editModal) editModal.classList.add("hidden");
});

// Handle Edit Product form
document.getElementById("editProductForm").addEventListener("submit", async e => {
  e.preventDefault();

  const productId = document.getElementById("editProductId").value;
  const product = {
    productName: document.getElementById("editProductName").value,
    category: document.getElementById("editProductCategory").value,
    description: document.getElementById("editProductDescription").value,
    image: document.getElementById("editProductImage").value,
    price: parseFloat(document.getElementById("editProductPrice").value),
    quantity: parseInt(document.getElementById("editProductQuantity").value, 10)
  };

  try {
    const res = await fetch(`http://localhost:3000/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });

    if (res.ok) {
      alert("✅ Product updated!");
      editModal.classList.add("hidden");
      loadProduct();
    } else {
      const err = await res.json();
      alert("❌ Failed to update: " + err.error);
    }
  } catch (err) {
    console.error("Error updating product:", err);
    alert("❌ Error updating product.");
  }
});

//Filter
const filterSelect = document.getElementById("filter-category");

// Load products with optional category filter
async function loadProduct(category = "all") {
  try {
    const res = await fetch("http://localhost:3000/products");
    const products = await res.json();

    productList.innerHTML = '';

    if (!products || products.length === 0) {
      productList.innerHTML = "<p>No products found.</p>";
      return;
    }

    // Filter by category
    const filtered = category === "all"
      ? products
      : products.filter(p => p.category.toLowerCase() === category.toLowerCase());

    if (filtered.length === 0) {
      productList.innerHTML = "<p>No products found in this category.</p>";
      return;
    }

    filtered.forEach(product => {
      const card = createProductCard(product);
      productList.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    productList.innerHTML = "<p>Failed to load products.</p>";
  }
}

// Initial load
loadProduct();

// Listen for filter changes
filterSelect.addEventListener("change", () => {
  const selectedCategory = filterSelect.value;
  loadProduct(selectedCategory);
});

