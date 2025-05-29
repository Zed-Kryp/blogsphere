document.addEventListener("DOMContentLoaded", function () {
  // Toggle sidebar on mobile
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", function (e) {
    if (window.innerWidth <= 992) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove("active");
      }
    }
  });

  // Simulate loading data
  function simulateLoading() {
    const loadingElements = document.querySelectorAll(".loading");
    loadingElements.forEach((el) => {
      el.classList.add("loading-active");
      setTimeout(() => {
        el.classList.remove("loading-active");
      }, 1500);
    });
  }

  // Initialize any charts (you would use a library like Chart.js in a real implementation)
  function initCharts() {
    // This is where you would initialize your charts
    console.log("Charts would be initialized here");
  }

  // Form submission handling
  const quickDraftForm = document.getElementById("quickDraftForm");
  if (quickDraftForm) {
    quickDraftForm.addEventListener("submit", function (e) {
      e.preventDefault();
      simulateLoading();

      // In a real app, you would send this data to your server
      const formData = new FormData(quickDraftForm);
      const data = Object.fromEntries(formData);
      console.log("Form data:", data);

      // Show success message
      setTimeout(() => {
        alert("Draft saved successfully!");
        quickDraftForm.reset();
      }, 1500);
    });
  }

  // Mark all notifications as read
  const markAllReadBtn = document.querySelector(".mark-all-read");
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", function () {
      const unreadNotifications = document.querySelectorAll(
        ".notification-item.unread"
      );
      unreadNotifications.forEach((notification) => {
        notification.classList.remove("unread");
      });

      // Update badge count
      const badge = document.querySelector(".notification-btn .badge");
      if (badge) {
        badge.style.display = "none";
      }
    });
  }

  // Initialize everything
  initCharts();

  // Logout function
  window.logout = function () {
    // In a real app, this would call your logout API here
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    window.location.href = "index.html";
  };
});

function filterUsers(users, selectedRole, selectedStatus) {
  let filteredUsers = users.filter((user) => {
    if (selectedRole !== "all" && user.role !== selectedRole) {
      return false;
    }
    if (selectedStatus !== "all" && user.status !== selectedStatus) {
      return false;
    }
    return true;
  });
  return filteredUsers;
}

function updateUserStats(users) {
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const pendingUsers = users.filter((user) => user.status === "pending").length;
  const inactiveUsers = users.filter(
    (user) => user.status === "inactive"
  ).length;

  document.querySelector(
    ".user-statistics .stat-card:nth-child(1) h3"
  ).textContent = totalUsers;
  document.querySelector(
    ".user-statistics .stat-card:nth-child(2) h3"
  ).textContent = activeUsers;
  document.querySelector(
    ".user-statistics .stat-card:nth-child(3) h3"
  ).textContent = pendingUsers;
  document.querySelector(
    ".user-statistics .stat-card:nth-child(4) h3"
  ).textContent = inactiveUsers;
}

// User Management Functionality
document.addEventListener("DOMContentLoaded", function () {
  const createUserBtn = document.getElementById("createUserBtn");
  const createUserModal = document.getElementById("createUserModal");
  const closeModal = document.querySelector(".close-modal");
  const userTable = document.querySelector(".user-table tbody");
  const roleFilter = document.getElementById("roleFilter");
  const statusFilter = document.getElementById("statusFilter");
  const applyFiltersBtn = document.querySelector(
    ".filter-controls .btn-secondary"
  );

  // Dummy user data
  let users = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      role: "admin",
      status: "active",
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "editor",
      status: "active",
      lastActive: "1 day ago",
    },
    {
      id: 3,
      name: "Robert Johnson",
      email: "robert.j@example.com",
      role: "author",
      status: "inactive",
      lastActive: "1 week ago",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.d@example.com",
      role: "subscriber",
      status: "active",
      lastActive: "3 days ago",
    },
    {
      id: 5,
      name: "Michael Brown",
      email: "michael.b@example.com",
      role: "editor",
      status: "pending",
      lastActive: "Just now",
    },
  ];

  // Function to render user table
  function renderUserTable(filteredUsers = users) {
    userTable.innerHTML = "";
    filteredUsers.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td><input type="checkbox"></td>
                <td>
                    <div class="user-info">
                        <img src="https://randomuser.me/api/portraits/men/${
                          user.id + 30
                        }.jpg" alt="${user.name}" class="user-avatar">
                        <div>
                            <strong>${user.name}</strong>
                            <small>@${user.name
                              .replace(" ", "")
                              .toLowerCase()}</small>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge badge-${
                  user.role === "admin"
                    ? "primary"
                    : user.role === "editor"
                    ? "info"
                    : user.role === "author"
                    ? "warning"
                    : "secondary"
                }">${user.role}</span></td>
                <td><span class="badge badge-${
                  user.status === "active"
                    ? "success"
                    : user.status === "inactive"
                    ? "danger"
                    : "warning"
                }">${user.status}</span></td>
                <td>${user.lastActive}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-sm" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-icon btn-sm" title="View"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-icon btn-sm" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
      userTable.appendChild(row);
    });
  }

  // Function to filter users
  function filterUsers() {
    const selectedRole = roleFilter.value;
    const selectedStatus = statusFilter.value;

    let filteredUsers = users.filter((user) => {
      if (selectedRole !== "all" && user.role !== selectedRole) {
        return false;
      }
      if (selectedStatus !== "all" && user.status !== selectedStatus) {
        return false;
      }
      return true;
    });

    renderUserTable(filteredUsers);
  }

  // Event listeners
  if (createUserBtn && createUserModal && closeModal) {
    createUserBtn.addEventListener("click", () => {
      createUserModal.style.display = "block";
    });

    closeModal.addEventListener("click", () => {
      createUserModal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
      if (event.target === createUserModal) {
        createUserModal.style.display = "none";
      }
    });
  }

  if (applyFiltersBtn && roleFilter && statusFilter) {
    applyFiltersBtn.addEventListener("click", filterUsers);
    roleFilter.addEventListener("change", filterUsers);
    statusFilter.addEventListener("change", filterUsers);
  }

  // Initial render
  renderUserTable();
});

document.addEventListener("DOMContentLoaded", function () {
  const roleFilter = document.getElementById("roleFilter");
  const statusFilter = document.getElementById("statusFilter");
  const applyFiltersBtn = document.querySelector(
    ".filter-controls .btn-secondary"
  );

  if (applyFiltersBtn && roleFilter && statusFilter) {
    applyFiltersBtn.addEventListener("click", function () {
      // Get the selected values from the filter dropdowns
      const selectedRole = roleFilter.value;
      const selectedStatus = statusFilter.value;

      // Filter the users based on the selected role and status
      const filteredUsers = filterUsers(users, selectedRole, selectedStatus);

      // Update the user statistics
      updateUserStats(filteredUsers);
    });
  }
});
