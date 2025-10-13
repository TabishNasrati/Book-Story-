
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');


showRegister.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.classList.remove('active');
  registerForm.classList.add('active');
});


showLogin.addEventListener('click', (e) => {
  // e.preventDefault();
  registerForm.classList.remove('active');
  loginForm.classList.add('active');
});


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

  
  alert(`Login Successful!\nEmail: ${email}`);
  loginForm.reset();
});


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

  
  alert(`Registration Successful!\nUsername: ${username}\nEmail: ${email}`);
  registerForm.reset();
  registerForm.classList.remove('active');
  loginForm.classList.add('active');
});


function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
}
