import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import pgSession from "connect-pg-simple";
import dotenv from "dotenv";
import multer from "multer";
import { render } from "ejs";

dotenv.config();
const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Connection
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "bookstory",
  password: process.env.DB_PASS || "344030",
  port: process.env.DB_PORT || 5432,
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error(" Database connection error", err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session Store
const PGStore = pgSession(session);
app.use(
  session({
    store: new PGStore({
      pool: pool,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Multer (for uploads if needed)
const upload = multer({
  dest: path.join(__dirname, "public", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------------- Routes ----------------
// Pages
app.get("/", (req, res) => res.redirect("/main"));
app.get("/login", (req, res) => res.render("login"));
app.get("/register", (req, res) => res.render("register"));
app.get("/main", (req, res) => res.render("main"));
app.get("/single", (req, res) => res.render("single"));
app.get("/dashboard", (req, res) => res.render("dashboard"));
app.get("/author", (req, res) => res.render("Author"));
app.get("/book", (req, res) => res.render("book"));
app.get("/Categories", (req, res) => res.render("Categories"));
app.get("/users", (req, res) => res.render("users"));
app.get("/Settings", (req, res) => res.render("Settings"));


// ---------------- Authentication ----------------
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).send("All fields are required");

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0)
      return res.status(400).send("Email is already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role",
      [username, email, hashedPassword, "user"]
    );

    console.log("New user added:", result.rows[0]);
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error while registering user");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
    if (!user) return res.status(401).send("Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send("Invalid credentials");

    req.session.userId = user.id;
    req.session.role = user.role;

    if (user.role === "admin") {
      return res.redirect("/admin/dashboard");
    } else {
      return res.redirect("/main");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});

// ---------------- Middleware for Admin ----------------
function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect("/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || req.session.role !== "admin") {
    return res.status(403).send("Access denied. Admins only.");
  }
  next();
}




// ---------------- Admin Routes ----------------
app.get("/admin/dashboard", requireLogin, requireAdmin, async (req, res) => {
  try {
    const books = await pool.query("SELECT COUNT(*) FROM books");
    const authors = await pool.query("SELECT COUNT(DISTINCT author) FROM books");
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const categories = await pool.query("SELECT COUNT(DISTINCT category) FROM books");
    

    res.render("dashboard", {
      stats: {
        books: books.rows[0].count,
        authors: authors.rows[0].count,
        users: users.rows[0].count,
        categories: categories.rows[0]?.count || 0,
        
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});



// app.get('/api/admin/authors', requireLogin, requireAdmin, async (req, res) => {
//   try {
   
//     res.render("auther", {

//     })
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error fetching authors" });
//   }
// });




// app.get('/api/admin/book', requireLogin, requireAdmin, async (req, res) => {
//   try {
   
//     res.render("book", {

//     })
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error fetching authors" });
//   }
// });





// app.get('/api/admin/Categories', requireLogin, requireAdmin, async (req, res) => {
//   try {
   
//     res.render("book", {

//     })
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error fetching authors" });
//   }
// });


// app.get('/api/admin/users', requireLogin, requireAdmin, async (req, res) => {
//   try {
   
//     res.render("book", {

//     })
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error fetching authors" });
//   }
// });







// Admin Stats API
app.get('/api/admin/stats', requireLogin, requireAdmin, async (req, res) => {
  try {
    const books = await pool.query("SELECT COUNT(*) FROM books");
    const authors = await pool.query("SELECT COUNT(DISTINCT author) FROM books");
    const categories = await pool.query("SELECT COUNT(DISTINCT category) FROM books");
    const viewsResult = await pool.query("SELECT SUM(views) AS total_views FROM books");
    const views = viewsResult.rows[0].total_views || 0;

    res.json({
      views: views,
      authors: authors.rows[0].count,
      books: books.rows[0].count,
      categories: categories.rows[0]?.count || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ---------------- Books API ----------------
app.get("/api/books", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM books ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading books");
  }
});

app.get("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [id]);
    if (result.rows.length > 0) return res.json(result.rows[0]);
    res.status(404).send({ message: "Book not found" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

app.post("/api/books/:id/review", async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  res.json({ text });
});

// ---------------- File Download ----------------
app.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "public", "downloads", filename);

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).send("Error downloading file");
    }
  });
});



app.get("/single/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // افزایش تعداد بازدید
    await pool.query("UPDATE books SET views = views + 1 WHERE id = $1", [id]);

    // گرفتن اطلاعات کتاب
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Book not found");

    res.render("single", { book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});




// ---------------- Admin Activity API ----------------
app.get('/api/admin/activity', requireLogin, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') AS month,
             SUM(views) AS total_views
      FROM books
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at)
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching activity data:", err);
    res.status(500).json({ error: "Server error fetching activity" });
  }
});




// ---------------- Middleware (فقط یکبار تعریف شود) ----------------
if (typeof requireLogin === "undefined") {
  global.requireLogin = (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };
}

if (typeof requireAdmin === "undefined") {
  global.requireAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// ---------------- Authors API ----------------

// گرفتن همه Authors
app.get('/api/admin/author', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT author
      FROM books
      WHERE author IS NOT NULL AND author <> ''
      ORDER BY author ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching authors:", err);
    res.status(500).json({ error: "Server error fetching authors" });
  }
});


// اضافه کردن Author جدید
app.post('/api/admin/author', requireLogin, requireAdmin, async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO authors (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error adding author:", err);
    res.status(500).json({ error: "Server error adding author" });
  }
});

// ویرایش Author
app.put('/api/admin/author/:id', requireLogin, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      "UPDATE authors SET name=$1, email=$2 WHERE id=$3 RETURNING *",
      [name, email, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating author:", err);
    res.status(500).json({ error: "Server error updating author" });
  }
});

// حذف Author
app.delete('/api/admin/author/:id', requireLogin, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM authors WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting author:", err);
    res.status(500).json({ error: "Server error deleting author" });
  }
});




// // اضافه کردن Author جدید
// app.post('/api/admin/authors', requireLogin, requireAdmin, async (req, res) => {
//   const { name, email } = req.body;
//   try {
//     const result = await pool.query(
//       "INSERT INTO authors (name, email) VALUES ($1, $2) RETURNING *",
//       [name, email]
//     );
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error adding author" });
//   }
// });

// // ویرایش Author
// app.put('/api/admin/authors/:id', requireLogin, requireAdmin, async (req, res) => {
//   const { id } = req.params;
//   const { name, email } = req.body;
//   try {
//     const result = await pool.query(
//       "UPDATE authors SET name=$1, email=$2 WHERE id=$3 RETURNING *",
//       [name, email, id]
//     );
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error updating author" });
//   }
// });

// // حذف Author
// app.delete('/api/admin/authors/:id', requireLogin, requireAdmin, async (req, res) => {
//   const { id } = req.params;
//   try {
//     await pool.query("DELETE FROM authors WHERE id=$1", [id]);
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error deleting author" });
//   }
// });






// -----------------Book------------گرفتن تمام کتاب‌هازمان
app.get("/api/books", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM books ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching books" });
  }
});

// اضافه کردن کتاب جدید
// اضافه کردن کتاب
app.post("/api/books", async (req, res) => {
  try {
    const { title, author, description, category, image, download_link } = req.body;

    const query = `
      INSERT INTO books (title, author, description, category, image, download_link)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const values = [title, author, description, category, image, download_link || null];

    const result = await pool.query(query, values);

    res.json({ message: "Book added successfully", id: result.rows[0].id });
  } catch (err) {
    console.error("Error in POST /api/books:", err);
    res.status(500).json({ error: "Error adding book" });
  }
});



// ویرایش کتاب
app.put("/api/books/:id", async (req, res) => {
  try {
    const { title, author, description, category, image, download_link } = req.body;

    const query = `
      UPDATE books
      SET title = $1,
          author = $2,
          description = $3,
          category = $4,
          image = $5,
          download_link = $6
      WHERE id = $7
    `;

    const values = [
      title,
      author,
      description,
      category,
      image,
      download_link || null,
      req.params.id
    ];

    await pool.query(query, values);

    res.json({ message: "Book updated successfully" });
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ error: "Error updating book" });
  }
});


// حذف کتاب
app.delete("/api/books/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM books WHERE id=?", [req.params.id]);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting book" });
  }
});







// // ---------------- Middleware ----------------
// const requireLogin = (req, res, next) => {
//   if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
//   next();
// };

// const requireAdmin = (req, res, next) => {
//   if (!req.session.isAdmin) return res.status(403).json({ error: "Forbidden" });
//   next();
// };

// ---------------- Categories API ----------------

// گرفتن همه Categories و رندر صفحه
app.get('/admin/Categories', requireLogin, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Categories ORDER BY id ASC");
    res.render("categories", { categories: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching categories" });
  }
});

// ======================= Categories API =======================

// 📌 گرفتن تمام دسته‌بندی‌ها
app.get("/api/admin/Categories", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM categories ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching Categories:", err);
    res.status(500).json({ error: "Error fetching categories" });
  }
});

// 📌 اضافه کردن دسته‌بندی جدید
app.post("/api/admin/Categories", async (req, res) => {
  try {
    const { name, description } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO Categories (name, description) VALUES ($1, $2) RETURNING id",
      [name, description]
    );
    res.json({ message: "Category added successfully", id: rows[0].id });
  } catch (err) {
    console.error("❌ Error adding category:", err);
    res.status(500).json({ error: "Error adding category" });
  }
});

// 📌 ویرایش دسته‌بندی
app.put("/api/admin/Categories/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query(
      "UPDATE categories SET name = $1, description = $2 WHERE id = $3",
      [name, description, req.params.id]
    );
    res.json({ message: "Category updated successfully" });
  } catch (err) {
    console.error("❌ Error updating category:", err);
    res.status(500).json({ error: "Error updating category" });
  }
});

// 📌 حذف دسته‌بندی
app.delete("/api/admin/Categories/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM Categories WHERE id = $1", [req.params.id]);
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting category:", err);
    res.status(500).json({ error: "Error deleting category" });
  }
});


// ---------------- Users API ----------------
// Middleware برای چک کردن لاگین
// function requireLogin(req, res, next) {
//   if (req.session && req.session.userId) {
//     return next();
//   } else {
//     res.status(401).json({ error: "Unauthorized: Please login" });
//   }
// }

// // Middleware برای چک کردن ادمین
// function requireAdmin(req, res, next) {
//   if (req.session && req.session.role === "Admin") {
//     return next();
//   } else {
//     res.status(403).json({ error: "Forbidden: Admins only" });
//   }
// }

// 📌 گرفتن همه کاربران
app.get('/api/admin/users', requireLogin, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error fetching users" });
  }
});

// 📌 اضافه کردن کاربر جدید
app.post('/api/admin/users', requireLogin, requireAdmin, async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ error: "Server error adding user" });
  }
});

// 📌 ویرایش کاربر
app.put('/api/admin/users/:id', requireLogin, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  try {
    let query, params;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = "UPDATE users SET username=$1, email=$2, password=$3 WHERE id=$4 RETURNING id, username, email";
      params = [username, email, hashedPassword, id];
    } else {
      query = "UPDATE users SET username=$1, email=$2 WHERE id=$3 RETURNING id, username, email";
      params = [username, email, id];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Server error updating user" });
  }
});

// 📌 حذف کاربر
app.delete('/api/admin/users/:id', requireLogin, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Server error deleting user" });
  }
});

//----------------Settings-----------------

// دریافت تنظیمات کاربر
app.get("/api/Settings", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await pool.query("SELECT username, email, theme FROM user_Settings WHERE user_id=$1", [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ username: "", email: "", theme: "light" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching settings" });
  }
});

// ذخیره یا آپدیت تنظیمات کاربر
app.post("/api/Settings", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { username, email, password, theme } = req.body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const result = await pool.query(
      `INSERT INTO user_Settings (user_id, username, email, password, theme)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE 
       SET username = EXCLUDED.username,
           email = EXCLUDED.email,
           password = COALESCE(EXCLUDED.password, user_settings.password),
           theme = EXCLUDED.theme
       RETURNING *`,
      [userId, username, email, hashedPassword, theme]
    );

    res.json({ message: "Settings saved successfully", settings: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error saving settings" });
  }
});







app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

















