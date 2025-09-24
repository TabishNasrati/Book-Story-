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
app.get("/auther", (req, res) => res.render("Auther"));


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



app.get('/api/admin/authors', requireLogin, requireAdmin, async (req, res) => {
  try {
   

    res.render("auther", {

    })
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching authors" });
  }
});


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

app.get("/api/book/:id", async (req, res) => {
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

app.post("/api/book/:id/review", async (req, res) => {
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




// ---------------- Authors API ----------------
// گرفتن همه Authors


// اضافه کردن Author جدید
app.post('/api/admin/authors', requireLogin, requireAdmin, async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO authors (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error adding author" });
  }
});

// ویرایش Author
app.put('/api/admin/authors/:id', requireLogin, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      "UPDATE authors SET name=$1, email=$2 WHERE id=$3 RETURNING *",
      [name, email, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating author" });
  }
});

// حذف Author
app.delete('/api/admin/authors/:id', requireLogin, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM authors WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting author" });
  }
});





app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

















