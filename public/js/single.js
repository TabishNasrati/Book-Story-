function getBookIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

const bookId = getBookIdFromURL();
if (!bookId) console.error("Book ID not found in URL!");

// Elements
const bookTitle = document.getElementById("bookTitle");
const bookAuthor = document.getElementById("bookAuthor");
const bookCategory = document.getElementById("bookCategory");
const bookPages = document.getElementById("bookPages");
const description = document.getElementById("description");
const bookImage = document.getElementById("bookImage");
const downloadLink = document.getElementById("downloadLink");
const toggleDesc = document.getElementById("toggleDesc");
const reviewForm = document.getElementById("reviewForm");
const reviewText = document.getElementById("reviewText");
const reviews = document.getElementById("reviews");
const clearReview = document.getElementById("clearReview");

async function loadBook(bookId) {
  try {
    const response = await fetch(`/api/book/${bookId}`);
    const data = await response.json();
    bookTitle.textContent = data.title;
    bookAuthor.textContent = data.author;
    bookCategory.textContent = data.category;
    bookPages.textContent = data.pages;
    description.innerHTML = `<p>${data.description}</p>`;
    bookImage.src = data.image;
    downloadLink.href = data.download_link;
    downloadLink.addEventListener("click", () => window.open(data.download_link, "_blank"));
  } catch (err) {
    console.error("Error loading book:", err);
  }
}

// Toggle description
toggleDesc?.addEventListener("click", () => {
  description.classList.toggle("expanded");
  toggleDesc.textContent = description.classList.contains("expanded") ? "Show Less" : "Show More";
});

// Review handling
reviewForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = reviewText.value.trim();
  if (!text) return;

  try {
    const response = await fetch(`/api/book/${bookId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (response.ok) {
      const newReview = await response.json();
      const div = document.createElement("div");
      div.className = "review";
      div.textContent = `"${newReview.text}" — Guest`;
      reviews.insertBefore(div, reviewForm);
      reviewText.value = "";
    }
  } catch (err) {
    console.error("Error submitting review:", err);
  }
});

clearReview?.addEventListener("click", () => reviewText.value = "");

// Initial load
if (bookId) loadBook(bookId);










