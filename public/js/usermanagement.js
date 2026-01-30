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

document.addEventListener("DOMContentLoaded", () => {
  initializeProfile();
  const userTableBody = document.querySelector("#userTable tbody");

  const addUserModal = document.getElementById("addUserModal");
  const editUserModal = document.getElementById("editUserModal");

  const addBtn = document.getElementById("addUserBtn");
  const addCloseBtn = addUserModal.querySelector(".close");
  const editCloseBtn = editUserModal.querySelector(".close");

  const searchInput = document.getElementById("searchUserInput");
  const searchBtn = document.getElementById("searchUserBtn");


  async function loadUsers() {
    try {
      const res = await fetch("/users");
      const users = await res.json();

      userTableBody.innerHTML = "";

      if (users.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="6">No users found.</td></tr>`;
        return;
      }

      users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.name}</td>
          <td>${user.position || ""}</td>
          <td>${user.role}</td>
          <td>${user.email || ""}</td>
          <td>${user.status || "active"}</td>
          <td class="actions">
            <button class="edit-btn" data-id="${user._id}" title="Edit"><i class="bi bi-pencil-fill"></i></button>
            <button class="delete-btn" data-id="${user._id}" title="Delete"><i class="bi bi-trash-fill"></i></button>
          </td>
        `;
        userTableBody.appendChild(row);

        // Edit button handler
        row.querySelector(".edit-btn").addEventListener("click", () => {
          document.getElementById("editUserId").value = user._id;
          document.getElementById("editUserName").value = user.name;
          document.getElementById("editUserPosition").value = user.position;
          document.getElementById("editUserRole").value = user.role;
          document.getElementById("editUserEmail").value = user.email;
          document.getElementById("editUserStatus").value = user.status;
          document.getElementById("editUserPassword").value = ""; // Clear password field
          editUserModal.classList.remove("hidden");
        });

        // Delete button handler
        row.querySelector(".delete-btn").addEventListener("click", async () => {
          if (confirm(`Delete user ${user.name}?`)) {
            const res = await fetch(`/users/${user._id}`, {
              method: "DELETE"
            });
            if (res.ok) {
              alert("✅ User deleted!");
              loadUsers();
            } else {
              alert("❌ Failed to delete user.");
            }
          }
        });
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      userTableBody.innerHTML = `<tr><td colspan="6">Failed to load users.</td></tr>`;
    }
  }


  loadUsers();

  // Add User Modal 
  addBtn.addEventListener("click", () => addUserModal.classList.remove("hidden"));
  addCloseBtn.addEventListener("click", () => addUserModal.classList.add("hidden"));
  window.addEventListener("click", e => {
    if (e.target === addUserModal) addUserModal.classList.add("hidden");
  });

  // Add User form submit
  document.getElementById("addUserForm").addEventListener("submit", async e => {
    e.preventDefault();
    const user = {
      name: document.getElementById("userName").value,
      position: document.getElementById("userPosition").value,
      role: document.getElementById("userRole").value,
      email: document.getElementById("userEmail").value,
      password: document.getElementById("userPassword").value,
      status: document.getElementById("userStatus").value
    };
    const res = await fetch("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    if (res.ok) {
      alert("✅ User added!");
      document.getElementById("addUserForm").reset();
      addUserModal.classList.add("hidden");
      loadUsers();
    } else {
      const err = await res.json();
      alert("❌ Failed to add user: " + err.error);
    }
  });

  // Edit User Modal 
  editCloseBtn.addEventListener("click", () => editUserModal.classList.add("hidden"));
  window.addEventListener("click", e => {
    if (e.target === editUserModal) editUserModal.classList.add("hidden");
  });

  // Edit User form submit
  document.getElementById("editUserForm").addEventListener("submit", async e => {
    e.preventDefault();
    const userId = document.getElementById("editUserId").value;
    const user = {
      name: document.getElementById("editUserName").value,
      position: document.getElementById("editUserPosition").value,
      role: document.getElementById("editUserRole").value,
      email: document.getElementById("editUserEmail").value,
      status: document.getElementById("editUserStatus").value
    };
    
    // Only include password if it was changed
    const password = document.getElementById("editUserPassword").value;
    if (password.trim() !== "") {
      user.password = password;
    }
    
    const res = await fetch(`/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    if (res.ok) {
      alert("✅ User updated!");
      editUserModal.classList.add("hidden");
      loadUsers();
    } else {
      const err = await res.json();
      alert("❌ Failed to update user: " + err.error);
    }
  });

  // Search 
  searchBtn.addEventListener("click", () => {
    const term = searchInput.value.trim().toLowerCase();
    document.querySelectorAll("#userTable tbody tr").forEach(row => {
      const nameCell = row.querySelector("td:first-child");
      if (nameCell) {
        const name = nameCell.innerText.toLowerCase();
        row.style.display = name.includes(term) ? "" : "none";
      }
    });
  });

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    document.querySelectorAll("#userTable tbody tr").forEach(row => {
      const nameCell = row.querySelector("td:first-child");
      if (nameCell) {
        const name = nameCell.innerText.toLowerCase();
        row.style.display = name.includes(term) ? "" : "none";
      }
    });
  });
});