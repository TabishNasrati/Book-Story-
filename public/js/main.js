document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".allidcards");
  const searchInput = document.querySelector('.search-bar input');
  let books = [];

  try {
    const response = await fetch("/api/books");
    books = await response.json();
    renderBooks(books);
  } catch (err) {
    console.error("Error loading books:", err);
  }

  function renderBooks(bookArray) {
    container.innerHTML = "";
    bookArray.forEach(book => {
      const card = document.createElement("div");
      card.className = "id-card";
      card.innerHTML = `
        <img src="${book.image}" alt="${book.title}">
        <h2>${book.title}</h2>
        <p>${book.author}</p>
        <p>${book.category}</p>
        <a href="/single?id=${book.id}" target="_self">View Details</a>
      `;
      container.appendChild(card);
    });
  }

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filteredBooks = books.filter(book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query)
    );
    renderBooks(filteredBooks);
  });
});
