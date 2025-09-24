document.addEventListener("DOMContentLoaded", () => {
    // ---------------- فعال کردن لینک Sidebar ----------------
    const links = document.querySelectorAll(".sidebar .nav-link");
    links.forEach(link => {
      if (link.href === window.location.href) link.classList.add("active");
    });
  
    // ---------------- انتخاب عناصر ----------------
    const authorForm = document.getElementById("authorForm");
    const editAuthorForm = document.getElementById("editAuthorForm");
    const authorTable = document.getElementById("authorTable");
    const authorCount = document.getElementById("authorCount");
  
    // ---------------- داده‌های نمونه Authors ----------------
    let authors = [
      { name: "J.K. Rowling", email: "jk.rowling@example.com" },
      { name: "George R.R. Martin", email: "grrm@example.com" }
    ];
  
    // ---------------- بروزرسانی شمارنده Authors ----------------
    function updateCount() {
      authorCount.textContent = `${authors.length} Authors`;
    }
  
    // ---------------- رندر جدول Authors ----------------
    function renderTable() {
      authorTable.innerHTML = ""; // خالی کردن جدول قبلی
      authors.forEach((author, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${author.name}</td>
          <td>${author.email}</td>
          <td>
            <button class="btn btn-sm btn-edit me-1" onclick="openEditAuthor(${index})">Edit</button>
            <button class="btn btn-sm btn-delete" onclick="deleteAuthor(${index})">Delete</button>
          </td>
        `;
        authorTable.appendChild(tr);
      });
      updateCount();
    }
  
    // اجرای اولیه رندر جدول
    renderTable();
  
    // ---------------- اضافه کردن Author جدید ----------------
    authorForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("authorName").value.trim();
      const email = document.getElementById("authorEmail").value.trim();
      if (!name || !email) return;
  
      authors.push({ name, email });
      renderTable();
      authorForm.reset();
  
      // بستن Modal
      const addModalEl = document.getElementById("addAuthorModal");
      const addModal = bootstrap.Modal.getInstance(addModalEl);
      if (addModal) addModal.hide();
    });
  
    // ---------------- باز کردن Modal و پر کردن اطلاعات برای ویرایش ----------------
    window.openEditAuthor = function(index) {
      const author = authors[index];
      document.getElementById("editAuthorIndex").value = index;
      document.getElementById("editAuthorName").value = author.name;
      document.getElementById("editAuthorEmail").value = author.email;
  
      const editModal = new bootstrap.Modal(document.getElementById("editAuthorModal"));
      editModal.show();
    }
  
    // ---------------- ذخیره تغییرات Author ----------------
    editAuthorForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const index = document.getElementById("editAuthorIndex").value;
      authors[index] = {
        name: document.getElementById("editAuthorName").value.trim(),
        email: document.getElementById("editAuthorEmail").value.trim()
      };
      renderTable();
  
      // بستن Modal
      const editModalEl = document.getElementById("editAuthorModal");
      const modal = bootstrap.Modal.getInstance(editModalEl);
      if (modal) modal.hide();
    });
  
    // ---------------- حذف Author ----------------
    window.deleteAuthor = function(index) {
      if (!confirm(`Are you sure you want to delete ${authors[index].name}?`)) return;
      authors.splice(index, 1);
      renderTable();
    }
  });
  