const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();

  // اعتبارسنجی‌ها
  if (username.length < 3) {
    alert('Username must be at least 3 characters.');
    return;
  }

  if (!validateEmail(email)) {
    alert('Please enter a valid email.');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (res.ok) {
      alert('Registration successful!');
      window.location.href = '/login';
    } else {
      const msg = await res.text();
      alert('Error: ' + msg);
    }
  } catch (err) {
    console.error('Fetch error:', err);
    alert('Server error. Please try again later.');
  }
});

function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
}
