let movements = [];

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

document.addEventListener('DOMContentLoaded', function() {
  // Initialize page
  checkPageAccess();
  initializeProfile();
  loadMovements();
  setupEventListeners();
  setupStockIdListener();
});

function setupEventListeners() {
  const addBtn = document.getElementById('addMovementBtn');
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const addForm = document.getElementById('addMovementForm');
  const editForm = document.getElementById('editMovementForm');

  // Check if elements exist before adding listeners
  if (!addBtn || !searchBtn || !searchInput || !addForm || !editForm) {
    console.error('One or more required elements are missing from the DOM');
    return;
  }

  // Modal close buttons
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      this.closest('.modal').classList.add('hidden');
    });
  });

  // Click outside modal to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.add('hidden');
      }
    });
  });

  // Add button
  addBtn.addEventListener('click', function() {
    document.getElementById('addMovementModal').classList.remove('hidden');
    addForm.reset();
  });

  // Movement type filter
  const movementTypeFilter = document.getElementById('movementTypeFilter');
  if (movementTypeFilter) {
    movementTypeFilter.addEventListener('change', applyFilters);
  }

  // Search functionality
  searchBtn.addEventListener('click', applyFilters);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      applyFilters();
    }
  });

  // Add form submission
  addForm.addEventListener('submit', handleAddMovement);

  // Edit form submission
  editForm.addEventListener('submit', handleEditMovement);

  // Delete button in edit modal
  const deleteBtn = document.getElementById('deleteMovementBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleDeleteMovement);
  }
}

function setupStockIdListener() {
  const addStockInput = document.getElementById('add-stockId');
  const editStockInput = document.getElementById('edit-stockId');

  if (addStockInput) {
    addStockInput.addEventListener('change', function() {
      checkStockAvailability(this.value, 'add');
    });
  }

  if (editStockInput) {
    editStockInput.addEventListener('change', function() {
      checkStockAvailability(this.value, 'edit');
    });
  }
}

async function checkStockAvailability(stockId, formType) {
  if (!stockId) return;

  try {
    const response = await fetch(`/stocks`);
    const stocks = await response.json();
    const stock = stocks.find(s => s.stockId === stockId);

    const infoElement = document.getElementById(`${formType}-stock-availability`);
    
    if (!infoElement) {
      console.error(`Element ${formType}-stock-availability not found`);
      return;
    }
    
    if (stock) {
      infoElement.textContent = `Available: ${stock.quantity} units in ${stock.warehouseLocation}`;
      infoElement.classList.remove('error');
      infoElement.classList.add('success');
    } else {
      infoElement.textContent = 'Stock ID not found';
      infoElement.classList.remove('success');
      infoElement.classList.add('error');
    }
  } catch (error) {
    console.error('Error checking stock availability:', error);
  }
}

async function loadMovements() {
  try {
    const response = await fetch('/movements');
    movements = await response.json();
    displayMovements(movements);
  } catch (error) {
    console.error('Error loading movements:', error);
  }
}

function displayMovements(movementList) {
  const tbody = document.querySelector('.movement-table tbody');
  tbody.innerHTML = '';

  if (movementList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No movements found</td></tr>';
    return;
  }

  movementList.forEach(movement => {
    const dateUpdated = new Date(movement.dateUpdated).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${movement.stockId}</td>
      <td>${movement.movementType}</td>
      <td>${movement.from}</td>
      <td>${movement.to}</td>
      <td>${movement.quantity}</td>
      <td>${dateUpdated}</td>
      <td>
        <button class="edit-btn" onclick="editMovement('${movement._id}')"><i class="bi bi-pencil-fill"></i></button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function handleAddMovement(e) {
  e.preventDefault();

  const stockId = document.getElementById('add-stockId').value;
  const movementType = document.getElementById('add-movementType').value;
  const category = document.getElementById('add-category').value;
  const from = document.getElementById('add-from').value;
  const to = document.getElementById('add-to').value;
  const quantity = parseInt(document.getElementById('add-quantity').value);

  try {
    const response = await fetch('/movements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stockId,
        movementType,
        category,
        from,
        to,
        quantity
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`Error: ${data.message || data.error}`);
      return;
    }

    alert('Movement recorded successfully!');
    document.getElementById('addMovementModal').classList.add('hidden');
    loadMovements();
  } catch (error) {
    console.error('Error adding movement:', error);
    alert(`Error recording movement: ${error.message || 'Please check your connection and try again'}`);
  }
}

async function editMovement(movementId) {
  try {
    const response = await fetch(`/movements/${movementId}`);
    const movement = await response.json();

    document.getElementById('edit-movementId').value = movement._id;
    document.getElementById('edit-stockId').value = movement.stockId;
    document.getElementById('edit-movementType').value = movement.movementType;
    document.getElementById('edit-category').value = movement.category || '';
    document.getElementById('edit-from').value = movement.from;
    document.getElementById('edit-to').value = movement.to;
    document.getElementById('edit-quantity').value = movement.quantity;

    checkStockAvailability(movement.stockId, 'edit');

    document.getElementById('editMovementModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading movement:', error);
    alert('Error loading movement details');
  }
}

async function handleEditMovement(e) {
  e.preventDefault();

  const movementId = document.getElementById('edit-movementId').value;
  const stockId = document.getElementById('edit-stockId').value;
  const movementType = document.getElementById('edit-movementType').value;
  const category = document.getElementById('edit-category').value;
  const from = document.getElementById('edit-from').value;
  const to = document.getElementById('edit-to').value;
  const quantity = parseInt(document.getElementById('edit-quantity').value);

  try {
    const response = await fetch(`/movements/${movementId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stockId,
        movementType,
        category,
        from,
        to,
        quantity
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`Error: ${data.message || data.error}`);
      return;
    }

    alert('Movement updated successfully!');
    document.getElementById('editMovementModal').classList.add('hidden');
    loadMovements();
  } catch (error) {
    console.error('Error updating movement:', error);
    alert('Error updating movement');
  }
}

async function handleDeleteMovement() {
  if (!confirm('Are you sure you want to delete this movement?')) {
    return;
  }

  const movementId = document.getElementById('edit-movementId').value;

  try {
    const response = await fetch(`/movements/${movementId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const data = await response.json();
      alert(`Error: ${data.message || data.error}`);
      return;
    }

    alert('Movement deleted successfully!');
    document.getElementById('editMovementModal').classList.add('hidden');
    loadMovements();
  } catch (error) {
    console.error('Error deleting movement:', error);
    alert('Error deleting movement');
  }
}

async function applyFilters() {
  const searchValue = document.getElementById('searchInput').value.trim();
  const movementType = document.getElementById('movementTypeFilter').value;

  let filteredMovements = movements;

  // Filter by stock ID if search value exists
  if (searchValue) {
    filteredMovements = filteredMovements.filter(m => 
      m.stockId.toLowerCase().includes(searchValue.toLowerCase())
    );
  }

  // Filter by movement type 
  if (movementType !== 'All') {
    filteredMovements = filteredMovements.filter(m => m.movementType === movementType);
  }

  displayMovements(filteredMovements);
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('collapsed');
  document.querySelector('.main-content').classList.toggle('expanded');
}
