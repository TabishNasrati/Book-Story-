document.addEventListener("DOMContentLoaded", () => {
    const categoryForm = document.getElementById("categoryForm");
    const categoryTable = document.getElementById("categoryTable");
    const catName = document.getElementById("catName");
    const catDesc = document.getElementById("catDesc");
    const editIndex = document.getElementById("editIndex");
  
    let categories = [];
  
    // ---------------- دریافت Categories از سرور ----------------
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        categories = await res.json();
        renderCategories();
      } catch (err) {
        console.error(err);
      }
    }
  
    // ---------------- رندر جدول ----------------
    function renderCategories() {
      categoryTable.innerHTML = "";
      categories.forEach((cat) => {
        categoryTable.innerHTML += `
          <tr>
            <td>${cat.id}</td>
            <td>${cat.name}</td>
            <td>${cat.description}</td>
            <td>
              <button class="btn btn-sm btn-warning me-1" onclick="editCategory(${cat.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id})">Delete</button>
            </td>
          </tr>
        `;
      });
    }
  
    // ---------------- ویرایش Category ----------------
    window.editCategory = async function(id) {
      const cat = categories.find(c => c.id === id);
      catName.value = cat.name;
      catDesc.value = cat.description;
      editIndex.value = id;
      const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
      modal.show();
    };
  
    // ---------------- حذف Category ----------------
    window.deleteCategory = async function(id) {
      if (!confirm("Are you sure to delete this category?")) return;
      try {
        await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
        fetchCategories();
      } catch (err) {
        console.error(err);
      }
    };
  
    // ---------------- ذخیره / اضافه کردن Category ----------------
    categoryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = catName.value.trim();
      const description = catDesc.value.trim();
      const id = editIndex.value;
  
      try {
        if (id === "") {
          // اضافه کردن
          await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description })
          });
        } else {
          // ویرایش
          await fetch(`/api/admin/categories/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description })
          });
          editIndex.value = "";
        }
  
        categoryForm.reset();
        bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide();
        fetchCategories();
      } catch (err) {
        console.error(err);
      }
    });
  
    // اجرای اولیه
    fetchCategories();
  });
  