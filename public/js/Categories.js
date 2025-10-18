document.addEventListener("DOMContentLoaded", () => {
  const categoryTable = document.getElementById("categoryTable");
  const categoryForm = document.getElementById("categoryForm");
  const catName = document.getElementById("catName");
  const catDesc = document.getElementById("catDesc");
  const editIndex = document.getElementById("editIndex");

  let categories = [];

  // دریافت داده‌ها از سرور
  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("❌ Data is not an array:", data);
        return;
      }

      categories = data;
      renderCategories();
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
    }
  }

  // رندر جدول
  function renderCategories() {
    categoryTable.innerHTML = "";
    categories.forEach(cat => {
      categoryTable.innerHTML += `
        <tr>
          <td>${cat.id}</td>
          <td>${cat.category}</td>
          <td>${cat.description}</td>
          <td>
            <button class="btn btn-sm btn-warning me-1" onclick="editCategory(${cat.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id})">Delete</button>
          </td>
        </tr>
      `;
    });
  }

  // ویرایش
  window.editCategory = function(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    catName.value = cat.category;
    catDesc.value = cat.description;
    editIndex.value = id;

    const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
    modal.show();
  };

  // حذف
  window.deleteCategory = async function(id) {
    if (!confirm("Are you sure to delete this category?")) return;

    try {
      await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (err) {
      console.error(" Error deleting category:", err);
    }
  };

  // ذخیره تغییرات
  categoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const category = catName.value.trim();
    const description = catDesc.value.trim();
    const id = editIndex.value;

    if (id === "") return;

    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, description })
      });

      bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide();
      fetchCategories();
      editIndex.value = "";
    } catch (err) {
      console.error(" Error updating category:", err);
    }
  });

  fetchCategories();
});
