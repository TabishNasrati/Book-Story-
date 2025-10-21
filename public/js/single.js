
// -----------------------------
//  گرفتن ID کتاب از URL
// -----------------------------
function getBookIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}
const bookId = getBookIdFromURL();
if (!bookId) console.warn("⚠️ Book ID not found in URL.");

// -----------------------------
//  عناصر صفحه
// -----------------------------
const elements = {
  title: document.getElementById("bookTitle"),
  author: document.getElementById("bookAuthor"),
  category: document.getElementById("bookCategory"),
  pages: document.getElementById("bookPages"),
  description: document.getElementById("description"),
  image: document.getElementById("booksImage"),
  startReading: document.getElementById("startReading"),
  downloadBtn: document.getElementById("downloadBtn"),
  toggleDesc: document.getElementById("toggleDesc"),
  reviewForm: document.getElementById("reviewForm"),
  reviewText: document.getElementById("reviewText"),
  clearReview: document.getElementById("clearReview"),
  reviewsContainer: document.getElementById("reviewsList"),
};

// -----------------------------
//  استخراج نام فایل از لینک
// -----------------------------
function filenameFrom(path) {
  if (!path) return null;
  const parts = path.split("/");
  return parts.pop();
}

// -----------------------------
//  گرفتن ارتفاع خط برای محاسبه خطوط
// -----------------------------
function getLineHeightPx(el) {
  const style = window.getComputedStyle(el);
  const lh = style.lineHeight;
  const parsed = parseFloat(lh);
  if (!Number.isNaN(parsed)) return parsed;

  const span = document.createElement("span");
  span.style.visibility = "hidden";
  span.style.position = "absolute";
  span.style.whiteSpace = "nowrap";
  span.textContent = "A";
  el.appendChild(span);
  const h = span.getBoundingClientRect().height;
  el.removeChild(span);
  return h || parseFloat(style.fontSize);
}

// -----------------------------
//  بررسی طول توضیحات (برای Show More)
// -----------------------------
function checkDescriptionHeight() {
  const desc = elements.description;
  const btn = elements.toggleDesc;
  if (!desc || !btn) return;

  const fullHeight = desc.scrollHeight;
  const lineHeight = getLineHeightPx(desc);
  const lines = Math.round(fullHeight / lineHeight);

  if (lines <= 3) {
    btn.style.display = "none";
    desc.classList.remove("clamped", "expanded");
  } else {
    btn.style.display = "inline-block";
    desc.classList.add("clamped");
    desc.classList.remove("expanded");
    btn.textContent = "Show More";
  }
}

// -----------------------------
//  بارگذاری اطلاعات کتاب
// -----------------------------
async function loadBook(id) {
  try {
    const res = await fetch(`/api/books/${id}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();

    // --- اطلاعات پایه
    elements.title.textContent = data.title || "Untitled";
    elements.author.textContent = data.author || "Unknown";
    elements.category.textContent = data.category || "—";
    elements.image.src = data.image || "/images/placeholder.jpg";
    elements.description.innerHTML = `<p>${data.description || ""}</p>`;

    // --- لینک‌ها
    const filename = filenameFrom(data.download_link);
    if (filename) {
      const openPath = `/downloads/${encodeURIComponent(filename)}`;
      const downloadPath = `/download/${encodeURIComponent(filename)}`;
      elements.startReading.href = openPath;
      elements.startReading.target = "_blank";
      elements.downloadBtn.href = downloadPath;
      elements.downloadBtn.setAttribute("download", filename);
    } else {
      elements.startReading.removeAttribute("href");
      elements.downloadBtn.removeAttribute("href");
    }

    // --- تعداد صفحات
    if (data.pages) {
      elements.pages.textContent = data.pages;
    } else if (data.download_link && window.pdfjsLib) {
      const pdfUrl = `/downloads/${filename}`;
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      loadingTask.promise
        .then((pdf) => {
          elements.pages.textContent = pdf.numPages;
        })
        .catch((err) => {
          console.error(" Error reading PDF:", err);
          elements.pages.textContent = "N/A";
        });
    } else {
      elements.pages.textContent = "N/A";
    }

    // بررسی طول توضیحات
    setTimeout(checkDescriptionHeight, 50);

    // نظرات
    loadReviews(id);
  } catch (err) {
    console.error("Error loading book:", err);
  }
}

// -----------------------------
//  بارگذاری نظرات
// -----------------------------
async function loadReviews(id) {
  try {
    const res = await fetch(`/api/books/${id}/review`);
    if (!res.ok) throw new Error(`Failed to load reviews: ${res.status}`);
    const reviews = await res.json();

    elements.reviewsContainer.innerHTML = "";
    reviews.forEach((r) => {
      const div = document.createElement("div");
      div.className = "review";
      div.textContent = `"${r.text}" — ${r.username || "Guest"}`;
      elements.reviewsContainer.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading reviews:", err);
  }
}

// -----------------------------
//  ارسال نظر
// -----------------------------
elements.reviewForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = elements.reviewText.value.trim();
  if (!text) return;

  try {
    const res = await fetch(`/api/books/${bookId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      credentials: "include",
    });

    if (!res.ok) throw new Error(`Failed to submit review: ${res.status}`);
    const newReview = await res.json();

    const div = document.createElement("div");
    div.className = "review";
    div.textContent = `"${newReview.text}" — ${newReview.username || "Guest"}`;
    elements.reviewsContainer.appendChild(div);
    elements.reviewText.value = "";
    elements.reviewsContainer.scrollTop = elements.reviewsContainer.scrollHeight;
  } catch (err) {
    console.error("Error submitting review:", err);
  }
});

// -----------------------------
// 🧹 پاک‌کردن متن نظر
// -----------------------------
elements.clearReview?.addEventListener("click", () => {
  elements.reviewText.value = "";
});

// -----------------------------
// 🔽 Show More / Show Less
// -----------------------------
elements.toggleDesc?.addEventListener("click", () => {
  const desc = elements.description;
  const btn = elements.toggleDesc;
  if (!desc || !btn) return;

  const expanded = desc.classList.toggle("expanded");
  if (expanded) {
    desc.classList.remove("clamped");
    btn.textContent = "Show Less";
  } else {
    desc.classList.add("clamped");
    btn.textContent = "Show More";
  }
});

// -----------------------------
// ⚡ رویدادهای عمومی
// -----------------------------
function debounce(fn, ms = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

document.addEventListener("DOMContentLoaded", checkDescriptionHeight);
window.addEventListener("resize", debounce(checkDescriptionHeight, 120));

// -----------------------------
// 🚀 شروع برنامه
// -----------------------------
if (bookId) {
  loadBook(bookId);
} else {
  setTimeout(checkDescriptionHeight, 50);
}


// // single.js — نسخه مرتب و مقاوم

// // گرفتن ID کتاب از URL
// function getBookIdFromURL() {
//   const params = new URLSearchParams(window.location.search);
//   return params.get("id");
// }

// const bookId = getBookIdFromURL();
// if (!bookId) console.error("Book ID not found in URL!");

// // المان‌های صفحه
// const bookTitle = document.getElementById("booksTitle");
// const bookAuthor = document.getElementById("booksAuthor");
// const bookCategory = document.getElementById("booksCategory");
// const bookPages = document.getElementById("booksPages");
// const description = document.getElementById("description");
// const bookImage = document.getElementById("booksImage");
// const startReading = document.getElementById("startReading");
// const downloadBtn = document.getElementById("downloadBtn");
// const toggleDesc = document.getElementById("toggleDesc");
// const reviewForm = document.getElementById("reviewForm");
// const reviewText = document.getElementById("reviewText");
// const reviewsContainer = document.getElementById("reviewsList");
// const clearReview = document.getElementById("clearReview");

// // استخراج نام فایل از لینک دانلود
// function filenameFrom(value) {
//   if (!value) return null;
//   const parts = value.split("/");
//   return parts[parts.length - 1];
// }

// // بارگذاری اطلاعات کتاب
// async function loadBook(bookId) {
//   try {
//     const res = await fetch(`/api/books/${bookId}`);
//     if (!res.ok) throw new Error(`API error: ${res.status}`);
//     const data = await res.json();

//     // مقداردهی فیلدهای کتاب
//     if (bookTitle) bookTitle.textContent = data.title || "";
//     if (bookAuthor) bookAuthor.textContent = data.author || "";
//     if (bookCategory) bookCategory.textContent = data.category || "";
//     if (bookPages) bookPages.textContent = data.pages || "";
//     if (description) description.innerHTML = `<p>${data.description || ""}</p>`;
//     if (bookImage) bookImage.src = data.image || "/images/placeholder.jpg";

//     // لینک‌های باز و دانلود
//     const filename = filenameFrom(data.download_link || "");
//     if (!filename) {
//       console.warn("No download link found.");
//       if (startReading) startReading.removeAttribute("href");
//       if (downloadBtn) downloadBtn.removeAttribute("href");
//       return;
//     }

//     const openPath = `/downloads/${encodeURIComponent(filename)}`;
//     const downloadPath = `/download/${encodeURIComponent(filename)}`;

//     if (startReading) {
//       startReading.href = openPath;
//       startReading.target = "_blank";
//     }

//     if (downloadBtn) {
//       downloadBtn.href = downloadPath;
//       downloadBtn.setAttribute("download", filename);
//     }

//     // بارگذاری نظرات از سرور
//     loadReviews(bookId);
//   } catch (err) {
//     console.error("Error loading book:", err);
//   }
// }

// // بارگذاری نظرات
// async function loadReviews(bookId) {
//   try {
//     const res = await fetch(`/api/books/${bookId}/review`);
//     if (!res.ok) throw new Error(`Failed to load reviews: ${res.status}`);
//     const reviews = await res.json();

//     // پاک کردن نظرات قبلی
//     reviewsContainer.querySelectorAll(".review").forEach(r => r.remove());

//     reviews.forEach(r => {
//       const div = document.createElement("div");
//       div.className = "review";
//       div.textContent = `"${r.text}" — ${r.username || "Guest"}`;
//       reviewsContainer.insertBefore(div, reviewForm);
//     });
//   } catch (err) {
//     console.error("Error loading reviews:", err);
//   }
// }

// // toggle توضیحات
// toggleDesc?.addEventListener("click", () => {
//   if (!description) return;
//   description.classList.toggle("expanded");
//   toggleDesc.textContent = description.classList.contains("expanded") ? "Show Less" : "Show More";
// });

// // ثبت نظر جدید
// reviewForm?.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const text = reviewText.value.trim();
//   if (!text) return;

//   try {
//     const res = await fetch(`/api/books/${bookId}/review`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text, username: "Guest" }),
//     });

//     if (!res.ok) throw new Error(`Failed to submit review: ${res.status}`);
//     const newReview = await res.json();

//     const div = document.createElement("div");
//     div.className = "review";
//     div.textContent = `"${newReview.text}" — ${newReview.username || "Guest"}`;
//     reviewsContainer.insertBefore(div, reviewForm);

//     reviewText.value = "";
//   } catch (err) {
//     console.error("Error submitting review:", err);
//   }
// });

// // پاک کردن متن نظر
// clearReview?.addEventListener("click", () => {
//   if (reviewText) reviewText.value = "";
// });

// // اجرا
// if (bookId) loadBook(bookId);
