const productList = document.getElementById('product-list');

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
    document.getElementById("edit-productName").value = product.productName;
    document.getElementById("edit-price").value = product.price;
    document.getElementById("edit-quantity").value = product.quantity;
    document.getElementById("edit-description").value = product.description;
    document.getElementById("edit-image").value = product.image;

    editModal.classList.remove("hidden");
  });

  return card;

}

const addModal = document.getElementById("addProductModal");
const addCloseBtn = addModal.querySelector(".close");
const addBtn = document.getElementById("addProductBtn");

addBtn.addEventListener("click", () => addModal.classList.remove("hidden"));
addCloseBtn.addEventListener("click", () => addModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === addModal) addModal.classList.add("hidden");
});

document.getElementById("addProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const product = {
    productName: document.getElementById("add-productName").value,
    price: document.getElementById("add-price").value,
    quantity: document.getElementById("add-quantity").value,
    description: document.getElementById("add-description").value,
    image: document.getElementById("add-image").value
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

const editModal = document.getElementById("editProductModal");
const editCloseBtn = editModal.querySelector(".close");

editCloseBtn.addEventListener("click", () => editModal.classList.add("hidden"));
window.addEventListener("click", e => {
  if (e.target === editModal) editModal.classList.add("hidden");
});

document.getElementById("editProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const product = {
    productName: document.getElementById("edit-productName").value,
    price: document.getElementById("edit-price").value,
    quantity: document.getElementById("edit-quantity").value,
    description: document.getElementById("edit-description").value,
    image: document.getElementById("edit-image").value
  };

  try {
    const res = await fetch(`http://localhost:3000/products/${product.productId}`, {
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
}