// Select form elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');

// Switch to Register Form
showRegister.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.classList.remove('active');
  registerForm.classList.add('active');
});

// Switch to Login Form
showLogin.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.classList.remove('active');
  loginForm.classList.add('active');
});

// Login Form Submission
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!validateEmail(email)) {
    alert('Please enter a valid email.');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  // Here you can add backend authentication later
  alert(`Login Successful!\nEmail: ${email}`);
  loginForm.reset();
});

// Register Form Submission
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();

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

  // Here you can send data to backend or save in localStorage
  alert(`Registration Successful!\nUsername: ${username}\nEmail: ${email}`);
  registerForm.reset();
  registerForm.classList.remove('active');
  loginForm.classList.add('active');
});

// Email validation function
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
}
