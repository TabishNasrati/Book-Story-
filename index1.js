require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// اتصال به دیتابیس
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT
});

// تنظیمات Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// مسیر تست
app.get('/', (req, res) => {
  res.send('Server is running');
});

// مسیر ثبت‌نام
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // بررسی اولیه
  if (!username || !email || !password) {
    return res.status(400).send('All fields are required');
  }

  try {
    // بررسی اینکه ایمیل تکراری نباشد
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).send('Email already registered');
    }

    // هش کردن پسورد
    const hashedPassword = await bcrypt.hash(password, 10);

    // ذخیره کاربر جدید
    await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1,$2,$3)',
      [username, email, hashedPassword]
    );

    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// سرور را اجرا کن
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
