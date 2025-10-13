const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  // بررسی ایمیل
  if (!validateEmail(email)) {
    alert('Please enter a valid email.');
    return;
  }

  // بررسی طول رمز عبور
  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  try {
    // ارسال درخواست به سرور
    const res = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.redirected) {
      // اگر سرور redirect داد (admin یا main)
      window.location.href = res.url;
      return;
    }

    const text = await res.text();
    if (res.ok) {
      alert('Login successful!');
      window.location.href = '/main';
    } else {
      alert(text || 'Invalid credentials');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Server connection error. Please try again later.');
  }
});

// تابع بررسی ایمیل معتبر
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
}
