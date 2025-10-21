import express from "express"; // فریم‌ورک اصلی برای ساخت سرور HTTP و مدیریت مسیرها (routes).
import path from "path"; // برای کار با مسیر فایل‌ها در سیستم (مثل join و dirname).
import { fileURLToPath } from "url"; //برای تبدیل import.meta.url به مسیر واقعی فایل (در ES Modules لازم است).
import pkg from "pg"; // کتابخانهٔ رسمی Node.js برای اتصال به PostgreSQL.
import bcrypt from "bcrypt"; //برای هش کردن (رمزگذاری) رمزهای عبور کاربران.
import session from "express-session";// برای ایجاد و مدیریت session در Express.
import pgSession from "connect-pg-simple"; //ذخیرهٔ sessionها در دیتابیس PostgreSQL.
import dotenv from "dotenv"; // برای بارگذاری متغیرهای محیطی از فایل .env (مانند پسوردها یا پورت‌ها).
import multer from "multer"; // برای آپلود فایل‌ها (مثل عکس کتاب یا پروفایل کاربر).
import { render } from "ejs";
import * as pdf from "pdf-parse";

// import fs from "fs";
dotenv.config();//فایل ر  env. را می‌خواند تا اطلاعات مخفی مثل رمز دیتابیس را از آن بگیرد. 
const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Connection
const pool = new Pool({    // در اینجا یک Pool ساخته شده که مجموعه‌ای از connection‌ها را به دیتابیس مدیریت می‌کند.
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost", //آدرس سرور دیتابیس
  database: process.env.DB_NAME || "bookstory",
  password: process.env.DB_PASS || "344030",
  port: process.env.DB_PORT || 5432,
});

pool
  .connect() //  تلاش می‌کند به دیتابیس وصل شود.
  .then(() => console.log(" Connected to PostgreSQL")) // اگر موفق شود، پیغام  Connected چاپ می‌شود.
  .catch((err) => console.error(" Database connection error", err)); //  اگر خطا باشد (مثلاً رمز اشتباه باشد یا دیتابیس خاموش باشد) آن را در کنسول چاپ می‌کند.

const __filename = fileURLToPath(import.meta.url); //  __filename: مسیر کامل فایل جاری
const __dirname = path.dirname(__filename);//   __dirname: مسیر پوشهٔ جاری
 
// Session Store
const PGStore = pgSession(session); 
app.use(
  session({
    store: new PGStore({ // می‌گوید که sessionها در PostgreSQL نگهداری شوند، در جدول "session".
      pool: pool,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "change_this_secret", // کلید رمزگذاری session (باید قوی و محرمانه باشد).
    resave: false, // اگر تغییری در session نبود، دوباره ذخیره‌اش نکن.
    saveUninitialized: false, // خالی ذخیره نشود.
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day  // زمان ماندگاری session در مرورگر (اینجا ۱ روز). 
    },
  })
);

// Multer (for uploads if needed)  //  پیکربندی multer برای آپلود فایل‌ها 
const upload = multer({
  dest: path.join(__dirname, "public", "uploads"), // dest: مسیر ذخیره‌ی فایل‌های آپلود شده را مشخص می‌کند.
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB  limits.fileSize: حداکثر حجم مجاز برای هر فایل را تعیین می‌کند.
});

// Middleware
app.use(express.static(path.join(__dirname, "public"))); //   نمایش فایل‌های ثابت (CSS، عکس و...)
app.use(express.urlencoded({ extended: true })); // خواندن داده‌های فرم‌ها
app.use(express.json()); // خواندن داده‌های JSON

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
    req.session.username = user.username || user.email; 
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


// ------------------------- Single page  به خاطر نظر ساخته شده 


// -----------------  مسیرهای کتاب و نظر -----------------

// گرفتن اطلاعات کتاب
app.get("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Book not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// گرفتن نظرات یک کتاب
app.get("/api/books/:id/review", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM reviews WHERE book_id = $1 ORDER BY created_at DESC",
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// افزودن نظر جدید
app.post("/api/books/:id/review", async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  // بررسی ورودی خالی
  if (!text || text.trim() === "")
    return res.status(400).json({ message: "Review text is required" });

  try {
    // اگر کاربر لاگین کرده باشد، نامش را از سشن بگیر
    const username =
      req.session && req.session.username ? req.session.username : "Guest";

    const result = await pool.query(
      "INSERT INTO reviews (book_id, username, text) VALUES ($1, $2, $3) RETURNING *",
      [id, username, text.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting review:", err);
    res.status(500).json({ message: "Server error" });
  }
});







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
// گرفتن تمام دسته‌بندی‌ها از جدول books
app.get("/api/admin/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, category, description FROM books ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(" Error fetching categories:", err.message);
    res.status(500).json({ error: "Error fetching categories" });
  }
});

// ویرایش دسته‌بندی در books
app.put("/api/admin/categories/:id", async (req, res) => {
  try {
    const { category, description } = req.body;
    await pool.query(
      "UPDATE books SET category=$1, description=$2 WHERE id=$3",
      [category, description, req.params.id]
    );
    res.json({ message: "Category updated successfully" });
  } catch (err) {
    console.error(" Error updating category:", err.message);
    res.status(500).json({ error: "Error updating category" });
  }
});

// حذف دسته‌بندی از books
app.delete("/api/admin/categories/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM books WHERE id=$1", [req.params.id]);
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(" Error deleting category:", err.message);
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

//گرفتن همه کاربران
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

//اضافه کردن کاربر جدید
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

// ویرایش کاربر
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

//  حذف کاربر
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
// دریافت تنظیمات کاربر/ادمین
app.get("/api/Settings", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;

    const result = await pool.query(
      "SELECT username, email, theme FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ username: "", email: "", theme: "light" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ error: "Server error fetching settings" });
  }
});

// ذخیره یا آپدیت تنظیمات کاربر/ادمین
app.post("/api/Settings", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { username, email, password, theme } = req.body;

    // هش کردن پسورد در صورت وجود
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const result = await pool.query(
      `UPDATE users 
       SET username = $1,
           email = $2,
           password = COALESCE($3, password),
           theme = $4
       WHERE id = $5
       RETURNING *`,
      [username, email, hashedPassword, theme, userId]
    );

    res.json({ message: "Settings saved successfully", settings: result.rows[0] });
  } catch (err) {
    console.error("Error saving settings:", err);
    res.status(500).json({ error: "Server error saving settings" });
  }
});





app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

















