document.addEventListener("DOMContentLoaded", () => {
  // ---------------- فعال کردن لینک Sidebar ----------------
  const links = document.querySelectorAll(".sidebar .nav-link");
  links.forEach(link => {
    if (link.href === window.location.href) link.classList.add("active");
  });

  fetchAuthors(); // بارگذاری لیست نویسنده‌ها از دیتابیس
});

let authors = [];
let editAuthorId = null;

// ---------------- دریافت Authors از سرور ----------------
async function fetchAuthors() {
  try {
    const res = await fetch("/api/admin/author"); // ✅ مسیر درست
    if (!res.ok) throw new Error("Failed to fetch authors");
    authors = await res.json();
    renderTable();
  } catch (err) {
    console.error("Error loading author:", err);
  }
}

// ---------------- بروزرسانی شمارنده ----------------
function updateCount() {
  document.getElementById("authorCount").textContent = `${authors.length} Author`;
}

// ---------------- رندر جدول Authors ----------------
function renderTable() {
  const tbody = document.getElementById("authorTable");
  tbody.innerHTML = "";

  authors.forEach((author, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${author.author}</td>
    `;
    tbody.appendChild(tr);
  });

  updateCount();
}

function updateCount() {
  document.getElementById("authorCount").textContent = `${authors.length} Authors`;
}


// ---------------- اضافه کردن Author جدید ----------------
document.getElementById("authorForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const authorData = {
    name: document.getElementById("authorName").value.trim(),
    email: document.getElementById("authorEmail").value.trim(),
  };

  if (!authorData.name || !authorData.email) return;

  try {
    const res = await fetch("/api/admin/author", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authorData),
    });
    if (!res.ok) throw new Error("Failed to add author");

    e.target.reset();
    fetchAuthors();

    // بستن Modal
    const addModalEl = document.getElementById("addAuthorModal");
    const addModal = bootstrap.Modal.getInstance(addModalEl);
    if (addModal) addModal.hide();
  } catch (err) {
    console.error("Error adding author:", err);
  }
});

// ---------------- باز کردن Modal برای ویرایش ----------------
function openEditAuthor(authorId) {
  editAuthorId = authorId;
  const author = authors.find(a => a.id === authorId);
  if (!author) return;

  document.getElementById("editAuthorName").value = author.name;
  document.getElementById("editAuthorEmail").value = author.email;

  const editModal = new bootstrap.Modal(document.getElementById("editAuthorModal"));
  editModal.show();
}

// ---------------- ذخیره تغییرات ----------------
document.getElementById("editAuthorForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const authorData = {
    name: document.getElementById("editAuthorName").value.trim(),
    email: document.getElementById("editAuthorEmail").value.trim(),
  };

  try {
    const res = await fetch(`/api/admin/author/${editAuthorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authorData),
    });
    if (!res.ok) throw new Error("Failed to update author");

    fetchAuthors();
    editAuthorId = null;

    // بستن Modal
    const editModalEl = document.getElementById("editAuthorModal");
    const modal = bootstrap.Modal.getInstance(editModalEl);
    if (modal) modal.hide();
  } catch (err) {
    console.error("Error updating author:", err);
  }
});

// ---------------- حذف Author ----------------
async function deleteAuthor(authorId) {
  const author = authors.find(a => a.id === authorId);
  if (!author) return;

  if (!confirm(`Are you sure you want to delete ${author.name}?`)) return;

  try {
    const res = await fetch(`/api/admin/author/${authorId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete author");

    fetchAuthors();
  } catch (err) {
    console.error("Error deleting author:", err);
  }
}
