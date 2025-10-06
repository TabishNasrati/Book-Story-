document.addEventListener("DOMContentLoaded", () => {
  // Sidebar active link
  const links = document.querySelectorAll(".sidebar .nav-link");
  links.forEach(link => {
    if (link.href === window.location.href) link.classList.add("active");
  });

  fetchBooks();
});

let books = [];
let editBookId = null;

// ------------------ FETCH BOOKS ------------------
async function fetchBooks() {
  try {
    const res = await fetch("/api/books");
    if (!res.ok) throw new Error("Failed to fetch books");
    books = await res.json();
    renderTable();
  } catch (err) {
    console.error("Error loading books:", err);
  }
}

// ------------------ RENDER TABLE ------------------
function renderTable() {
  const tbody = document.getElementById("bookTable");
  tbody.innerHTML = "";

  books.forEach((book, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.description}</td>
      <td>${book.category}</td>
      <td><img src="${book.image}" alt="${book.title}" width="50"></td>
      <td>${book.download ? `<a href="${book.download}" target="_blank">Download</a>` : "-"}</td>
      <td>${book.viewQA ? `<a href="${book.viewQA}" target="_blank" class="btn btn-sm btn-primary">View QA</a>` : "-"}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="openEditModal(${book.id})">Edit</button>
        <button class="btn btn-sm btn-danger me-1" onclick="deleteBook(${book.id})">Delete</button>
        <button class="btn btn-sm btn-info" onclick="openViewModal(${book.id})">View</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("bookCount").textContent = `${books.length} Books`;
}

// ------------------ ADD BOOK ------------------
document.getElementById("bookForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const bookData = {
    title: document.getElementById("bookTitle").value,
    author: document.getElementById("bookAuthor").value,
    description: document.getElementById("bookDescription").value,
    category: document.getElementById("bookCategory").value,
    image: document.getElementById("bookImage").value,
    download: document.getElementById("bookDownload").value,
    viewQA: document.getElementById("bookViewQA").value,
  };

  try {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
    if (!res.ok) throw new Error("Failed to add book");

    this.reset();
    fetchBooks();

    // Hide Add Modal
    const addModalEl = document.getElementById("addBookModal");
    const addModal = bootstrap.Modal.getInstance(addModalEl);
    if (addModal) addModal.hide();
  } catch (err) {
    console.error("Error adding book:", err);
  }
});

// ------------------ EDIT BOOK ------------------
function openEditModal(bookId) {
  editBookId = bookId;
  const book = books.find(b => b.id === bookId);

  if (!book) return;

  document.getElementById("editBookTitle").value = book.title;
  document.getElementById("editBookAuthor").value = book.author;
  document.getElementById("editBookCategory").value = book.category;
  document.getElementById("editBookDescription").value = book.description;
  document.getElementById("editBookImage").value = book.image;
  document.getElementById("editBookDownload").value = book.download || "";
  document.getElementById("editBookViewQA").value = book.viewQA || "";

  const editModal = new bootstrap.Modal(document.getElementById("editBookModal"));
  editModal.show();
}

document.getElementById("editBookForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const bookData = {
    title: document.getElementById("editBookTitle").value,
    author: document.getElementById("editBookAuthor").value,
    category: document.getElementById("editBookCategory").value,
    description: document.getElementById("editBookDescription").value,
    image: document.getElementById("editBookImage").value,
    download: document.getElementById("editBookDownload").value,
    viewQA: document.getElementById("editBookViewQA").value,
  };

  try {
    const res = await fetch(`/api/books/${editBookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
    if (!res.ok) throw new Error("Failed to update book");

    fetchBooks();
    editBookId = null;

    // Hide Edit Modal
    const editModalEl = document.getElementById("editBookModal");
    const modal = bootstrap.Modal.getInstance(editModalEl);
    modal.hide();
  } catch (err) {
    console.error("Error updating book:", err);
  }
});

// ------------------ DELETE BOOK ------------------
async function deleteBook(bookId) {
  if (!confirm("Are you sure you want to delete this book?")) return;

  try {
    const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete book");

    fetchBooks();
  } catch (err) {
    console.error("Error deleting book:", err);
  }
}

// ------------------ VIEW BOOK ------------------
function openViewModal(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  const modalBody = document.getElementById("viewBookBody");
  modalBody.innerHTML = `
    <p><strong>Title:</strong> ${book.title}</p>
    <p><strong>Author:</strong> ${book.author}</p>
    <p><strong>Description:</strong> ${book.description}</p>
    <p><strong>Category:</strong> ${book.category}</p>
    <img src="${book.image}" alt="Book Image" class="img-fluid rounded mt-2">
  `;
  const viewModal = new bootstrap.Modal(document.getElementById("viewBookModal"));
  viewModal.show();
}

