function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("collapsed");
  document.querySelector(".main-content").classList.toggle("expanded");
}

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