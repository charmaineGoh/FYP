function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("collapsed");
  document.querySelector(".main-content").classList.toggle("expanded");
}

console.log("[products] script loaded");

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

// Get product list container
const productList = document.getElementById('productList');

// Track loading state
let isLoadingProducts = false;
let cachedProducts = [];
let currentFilter = 'all';

// Pagination state
const PRODUCTS_PER_PAGE = 12;
let currentPage = 1;
let totalPages = 1;

// Load products with optional category filter and pagination
async function loadProduct(category = "all", page = 1) {
  if (isLoadingProducts) return; 
  
  try {
    isLoadingProducts = true;
    currentFilter = category;
    currentPage = page;
    
    console.log("[products] fetching /products …");
    const res = await fetch("/products");
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      let err;
      if (contentType.includes('application/json')) {
        try { err = await res.json(); } catch { err = { error: 'Invalid JSON error response' }; }
      } else {
        const text = await res.text();
        err = { error: text || res.statusText };
      }
      console.error("Fetch /products failed:", err);
      productList.innerHTML = `<p>Failed to load products: ${err.error || 'Unknown error'}</p>`;
      return;
    }

    const products = contentType.includes('application/json') ? await res.json() : [];
    cachedProducts = products; // Cache for filtering
    console.log(`[products] fetch ok, received ${products.length} items`);

    // Filter by category if provided
    let filtered = category === "all"
      ? products
      : products.filter(p => p.category?.toLowerCase() === category.toLowerCase());

    if (filtered.length === 0) {
      productList.innerHTML = "<p>No products found in this category.</p>";
      isLoadingProducts = false;
      return;
    }

    // Implement pagination
    totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
    const startIdx = (page - 1) * PRODUCTS_PER_PAGE;
    const endIdx = startIdx + PRODUCTS_PER_PAGE;
    const paginatedProducts = filtered.slice(startIdx, endIdx);

    productList.innerHTML = '';

    paginatedProducts.forEach(product => {
      const card = createProductCard(product);
      productList.appendChild(card);
    });

    // Add pagination controls
    if (totalPages > 1) {
      addPaginationControls(filtered.length, page);
    }

    console.log(`Rendered ${paginatedProducts.length} products (page ${page} of ${totalPages})`);
  } catch (err) {
    console.error("Error fetching products:", err);
    productList.innerHTML = "<p>Failed to load products.</p>";
  } finally {
    isLoadingProducts = false;
  }
}

// Add pagination controls
function addPaginationControls(total, currentPage) {
  const paginationContainer = document.getElementById('pagination');
  
  // Clear existing pagination
  paginationContainer.innerHTML = '';
  
  const paginationDiv = document.createElement('div');
  paginationDiv.style.cssText = 'display: flex; justify-content: center; gap: 10px; margin-top: 30px; padding: 20px;';
  
  // Previous button
  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.style.cssText = 'padding: 8px 16px; background: #9e8bf7; color: white; border: none; border-radius: 4px; cursor: pointer;';
    prevBtn.onclick = () => loadProduct(currentFilter, currentPage - 1);
    paginationDiv.appendChild(prevBtn);
  }

  // Page info
  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  pageInfo.style.cssText = 'padding: 8px 16px; align-self: center; font-weight: 600;';
  paginationDiv.appendChild(pageInfo);

  // Next button
  if (currentPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.style.cssText = 'padding: 8px 16px; background: #9e8bf7; color: white; border: none; border-radius: 4px; cursor: pointer;';
    nextBtn.onclick = () => loadProduct(currentFilter, currentPage + 1);
    paginationDiv.appendChild(nextBtn);
  }

  paginationContainer.appendChild(paginationDiv);
}

// Initial load
loadProduct();

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

  card.addEventListener("click", () => {
    document.getElementById("editProductId").value = product._id || product.productId;
    document.getElementById("editProductName").value = product.productName;
    document.getElementById("editProductCategory").value = product.category;
    document.getElementById("editProductDescription").value = product.description;
    document.getElementById("editProductImage").dataset.currentImage = product.image;
    document.getElementById("editProductPrice").value = product.price;
    document.getElementById("editProductQuantity").value = product.quantity;

    editModal.classList.remove("hidden");
  });

  return card;
}

// add Product Modal 
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

  const imageFile = document.getElementById("productImage").files[0];
  if (!imageFile) {
    alert("❌ Please select an image");
    return;
  }
  if (imageFile.size > 2097152) {
    alert("❌ Image is too large. Please use an image smaller than 2MB.");
    return;
  }
  const imageUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.readAsDataURL(imageFile);
  });

  const product = {
    productName: document.getElementById("productName").value,
    category: document.getElementById("productCategory").value,
    description: document.getElementById("productDescription").value,
    image: imageUrl,
    price: parseFloat(document.getElementById("productPrice").value),
    quantity: parseInt(document.getElementById("productQuantity").value, 10)
  };

  try {
    const res = await fetch("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });

    if (res.ok) {
      const newProduct = await res.json();
      alert("✅ Product added!");
      addModal.classList.add("hidden");
      
      // Immediately add new product to cache and refresh without full reload
      cachedProducts.push(newProduct);
      loadProduct(currentFilter, 1); // Reset to first page
    } else {
      const contentType = res.headers.get('content-type') || '';
      let err;
      if (contentType.includes('application/json')) {
        try { err = await res.json(); } catch { err = { error: 'Invalid JSON error response' }; }
      } else {
        const text = await res.text();
        err = { error: text || res.statusText };
      }
      alert("❌ Failed: " + (err.error || 'Unknown error'));
    }
  } catch (err) {
    console.error("Error adding product:", err);
    alert("❌ Error adding product.");
  }
});

// Edit Product Modal 
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
  const imageFile = document.getElementById("editProductImage").files[0];

  let imageUrl = document.getElementById("editProductImage").dataset.currentImage;
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
  }

  const product = {
    productName: document.getElementById("editProductName").value,
    category: document.getElementById("editProductCategory").value,
    description: document.getElementById("editProductDescription").value,
    image: imageUrl,
    price: parseFloat(document.getElementById("editProductPrice").value),
    quantity: parseInt(document.getElementById("editProductQuantity").value, 10)
  };

  try {
    const res = await fetch(`/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });

    if (res.ok) {
      const updatedProduct = await res.json();
      alert("✅ Product updated!");
      editModal.classList.add("hidden");
      
      // Update cache
      const idx = cachedProducts.findIndex(p => p._id === productId);
      if (idx !== -1) {
        cachedProducts[idx] = updatedProduct;
      }
      
      // Reload products immediately without full page refresh
      loadProduct(currentFilter, currentPage);
      
      // Trigger immediate inventory refresh if inventory page is open
      if (window.location.pathname.includes('inventory') || document.querySelector('#inventoryTableBody')) {
        console.log("[sync] Triggering immediate inventory refresh...");
        if (typeof loadInventory === 'function') {
          loadInventory(false);
        }
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
      alert("❌ Failed to update: " + (err.error || 'Unknown error'));
    }
  } catch (err) {
    console.error("Error updating product:", err);
    alert("❌ Error updating product.");
  }
});

// Handle Delete Product button using event delegation
document.addEventListener("click", async (e) => {
  if (e.target && e.target.id === "deleteProductBtn") {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const productId = document.getElementById("editProductId").value;
    if (!productId) {
      alert("❌ No product selected");
      return;
    }

    try {
      const res = await fetch(`/products/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        alert("✅ Product deleted!");
        editModal.classList.add("hidden");
        
        // Remove from cache and refresh immediately
        cachedProducts = cachedProducts.filter(p => p._id !== productId);
        loadProduct(currentFilter, 1); // Reset to first page
      } else {
        const contentType = res.headers.get('content-type') || '';
        let err;
        if (contentType.includes('application/json')) {
          try { err = await res.json(); } catch { err = { error: 'Invalid JSON error response' }; }
        } else {
          const text = await res.text();
          err = { error: text || res.statusText };
        }
        alert("❌ Failed to delete: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      alert("❌ Error deleting product: " + err.message);
    }
  }
});

const filterSelect = document.getElementById("filter-category");
initializeProfile();

// Debounce filter changes to prevent excessive loads
let filterTimeout;
filterSelect.addEventListener("change", () => {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    const selectedCategory = filterSelect.value;
    loadProduct(selectedCategory, 1); // Reset to first page
  }, 300); // Wait 300ms after user stops interacting
});

