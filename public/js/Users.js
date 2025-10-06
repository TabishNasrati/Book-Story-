document.addEventListener("DOMContentLoaded", () => {
  const userTable = document.getElementById("userTable");
  const userCount = document.getElementById("userCount");
  const userForm = document.getElementById("userForm");
  const editForm = document.getElementById("editUserForm");

  let users = [];

  // دریافت لیست کاربران
  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      users = await res.json();
      renderTable();
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }

  // رندر جدول کاربران
  function renderTable() {
    userTable.innerHTML = "";
    users.forEach((user, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>••••••••</td> <!-- Password نمایش داده نمی‌شود -->
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="openEditModal(${user.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
        </td>
      `;
      userTable.appendChild(tr);
    });
    userCount.textContent = `${users.length} Users`;
  }

  // اضافه کردن کاربر جدید
  userForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("userName").value.trim();
    const email = document.getElementById("userEmail").value.trim();
    const password = document.getElementById("userPassword").value.trim();

    if (!username || !email || !password) return;

    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      userForm.reset();
      bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
      fetchUsers();
    } catch (err) {
      console.error("Error adding user:", err);
    }
  });

  // باز کردن مودال ویرایش
  window.openEditModal = function (id) {
    const user = users.find(u => u.id === id);
    if (!user) return;

    document.getElementById("editUserIndex").value = user.id;
    document.getElementById("editUserName").value = user.username;
    document.getElementById("editUserEmail").value = user.email;
    document.getElementById("editUserPassword").value = ""; // خالی برای حفظ رمز قبلی
    const editModal = new bootstrap.Modal(document.getElementById("editUserModal"));
    editModal.show();
  };

  // ذخیره تغییرات کاربر
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editUserIndex").value;
    const username = document.getElementById("editUserName").value.trim();
    const email = document.getElementById("editUserEmail").value.trim();
    const password = document.getElementById("editUserPassword").value.trim();

    const bodyData = password ? { username, email, password } : { username, email };

    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide();
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
    }
  });

  // حذف کاربر
  window.deleteUser = async function (id) {
    if (!confirm("Are you sure to delete this user?")) return;
    try {
      await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // اجرای اولیه
  fetchUsers();
});



// document.addEventListener("DOMContentLoaded", () => {
//     const links = document.querySelectorAll(".sidebar .nav-link");
//     links.forEach(link => {
//       if (link.href === window.location.href) link.classList.add("active");
//     });
  
//     let users = [
//       { name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
//       { name: "Bob Smith", email: "bob@example.com", role: "Editor" }
//     ];
  
//     const userTable = document.getElementById("userTable");
//     const userCount = document.getElementById("userCount");
  
//     function renderTable() {
//       userTable.innerHTML = "";
//       users.forEach((user, index) => {
//         const tr = document.createElement("tr");
//         tr.innerHTML = `
//           <td>${index + 1}</td>
//           <td>${user.name}</td>
//           <td>${user.email}</td>
//           <td>${user.role}</td>
//           <td>
//             <button class="btn btn-sm btn-edit me-1" onclick="openEditModal(${index})">Edit</button>
//             <button class="btn btn-sm btn-delete" onclick="deleteUser(${index})">Delete</button>
//           </td>
//         `;
//         userTable.appendChild(tr);
//       });
//       userCount.textContent = `${users.length} Users`;
//     }
  
//     renderTable();
  
//     // Add User
//     const userForm = document.getElementById("userForm");
//     userForm.addEventListener("submit", (e) => {
//       e.preventDefault();
//       const name = document.getElementById("userName").value.trim();
//       const email = document.getElementById("userEmail").value.trim();
//       const role = document.getElementById("userRole").value;
  
//       if (!name || !email || !role) return;
  
//       users.push({ name, email, role });
//       renderTable();
//       userForm.reset();
//       const addModal = bootstrap.Modal.getInstance(document.getElementById("addUserModal"));
//       addModal.hide();
//     });
  
//     // Edit User
//     window.openEditModal = function(index) {
//       const user = users[index];
//       document.getElementById("editUserIndex").value = index;
//       document.getElementById("editUserName").value = user.name;
//       document.getElementById("editUserEmail").value = user.email;
//       document.getElementById("editUserRole").value = user.role;
  
//       const editModal = new bootstrap.Modal(document.getElementById("editUserModal"));
//       editModal.show();
//     };
  
//     const editForm = document.getElementById("editUserForm");
//     editForm.addEventListener("submit", (e) => {
//       e.preventDefault();
//       const index = document.getElementById("editUserIndex").value;
//       users[index] = {
//         name: document.getElementById("editUserName").value.trim(),
//         email: document.getElementById("editUserEmail").value.trim(),
//         role: document.getElementById("editUserRole").value
//       };
//       renderTable();
//       const editModal = bootstrap.Modal.getInstance(document.getElementById("editUserModal"));
//       editModal.hide();
//     });
  
//     // Delete User
//     window.deleteUser = function(index) {
//       if (!confirm(`Delete user ${users[index].name}?`)) return;
//       users.splice(index, 1);
//       renderTable();
//     };
//   });
  