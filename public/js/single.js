// single.js — نسخه اصلاح شده و مقاوم

// گرفتن ID کتاب از URL
function getBookIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}
const bookId = getBookIdFromURL();
if (!bookId) console.error("Book ID not found in URL!");

// المان‌های صفحه
const bookTitle = document.getElementById("booksTitle");
const bookAuthor = document.getElementById("booksAuthor");
const bookCategory = document.getElementById("booksCategory");
const bookPages = document.getElementById("booksPages");
const description = document.getElementById("description");
const bookImage = document.getElementById("booksImage");
const startReading = document.getElementById("startReading");
const downloadBtn = document.getElementById("downloadBtn");
const toggleDesc = document.getElementById("toggleDesc");
const reviewForm = document.getElementById("reviewForm");
const reviewText = document.getElementById("reviewText");
const reviews = document.getElementById("reviews");
const clearReview = document.getElementById("clearReview");


function filenameFrom(value) {
  if (!value) return null;
  
  const parts = value.split('/');
  return parts[parts.length - 1];
}

// بارگذاری اطلاعات کتاب
async function loadBook(bookId) {
  try {
    const res = await fetch(`/api/books/${bookId}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    console.log("loadBook data:", data);

    // مقداردهی فیلدها
    if (bookTitle) bookTitle.textContent = data.title || "";
    if (bookAuthor) bookAuthor.textContent = data.author || "";
    if (bookCategory) bookCategory.textContent = data.category || "";
    if (bookPages) bookPages.textContent = data.pages || "";
    if (description) description.innerHTML = `<p>${data.description || ""}</p>`;
    if (bookImage) bookImage.src = data.image || "/images/placeholder.jpg";

    // امن‌سازی نام فایل
    const filename = filenameFrom(data.download_link || "");

    if (!filename) {
      console.warn("No download_link / filename found for this book.");
      
      if (startReading) startReading.removeAttribute("href");
      if (downloadBtn) downloadBtn.removeAttribute("href");
      return;
    }

    
    const openPath = `/downloads/${encodeURIComponent(filename)}`;
    
    const downloadPath = `/download/${encodeURIComponent(filename)}`;

    console.log("openPath:", openPath, "downloadPath:", downloadPath);

    if (startReading) {
      startReading.href = openPath;
      startReading.target = "_blank";
      
      startReading.onclick = (e) => {
        
        
      };
    }

    if (downloadBtn) {
      
      downloadBtn.href = downloadPath;
      downloadBtn.setAttribute("download", filename);
      downloadBtn.onclick = (e) => {
        
        console.log("Download click ->", downloadBtn.href);
      };
    }
  } catch (err) {
    console.error("Error loading book:", err);
  }
}

// toggle توضیحات
toggleDesc?.addEventListener("click", () => {
  if (!description) return;
  description.classList.toggle("expanded");
  toggleDesc.textContent = description.classList.contains("expanded") ? "Show Less" : "Show More";
});

// ثبت نظر
reviewForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = reviewText.value.trim();
  if (!text) return;
  try {
    const response = await fetch(`/api/books/${bookId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
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

clearReview?.addEventListener("click", () => {
  if (reviewText) reviewText.value = "";
});

// اجرا
if (bookId) loadBook(bookId);
