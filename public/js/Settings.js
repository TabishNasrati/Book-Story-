document.addEventListener("DOMContentLoaded", () => {
  const username = document.getElementById("username");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const message = document.getElementById("message");
  const form = document.getElementById("settingsForm");

  // Toggle Password visibility
  document.getElementById("togglePassword").addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
  });

  // Load saved admin/user data from server
  async function loadSettings() {
    try {
      const res = await fetch("/api/Settings"); // توجه: مسیر حساس به حروف
      const data = await res.json();
      username.value = data.username || "";
      email.value = data.email || "";
    } catch (err) {
      console.error("Error loading settings:", err);
      message.style.color = "red";
      message.textContent = "Error loading settings!";
    }
  }

  // Submit settings form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.textContent = "";

    // Validation: password length
    if (password.value && password.value.length < 6) {
      message.style.color = "red";
      message.textContent = "Password must be at least 6 characters!";
      return;
    }

    try {
      const res = await fetch("/api/Settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.value,
          email: email.value,
          password: password.value
        })
      });

      const data = await res.json();

      if (data.error) {
        message.style.color = "red";
        message.textContent = data.error;
      } else {
        message.style.color = "green";
        message.textContent = data.message || "Settings saved successfully!";
        password.value = ""; // Clear password field
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      message.style.color = "red";
      message.textContent = "Server error saving settings!";
    }
  });

  // Initialize: load settings on page load
  loadSettings();
});


// document.addEventListener("DOMContentLoaded", () => {
//     const username = document.getElementById("username");
//     const email = document.getElementById("email");
//     const password = document.getElementById("password");
//     const confirmPassword = document.getElementById("confirmPassword");
//     const avatar = document.getElementById("avatar");
//     const theme = document.getElementById("theme");
//     const message = document.getElementById("message");
//     const form = document.getElementById("settingsForm");
  
//     // Toggle Password visibility
//     document.getElementById("togglePassword").addEventListener("click", () => {
//       if(password.type === "password") { password.type = "text"; } 
//       else { password.type = "password"; }
//     });
  
//     // Load saved settings from localStorage
//     if(localStorage.getItem("settings")) {
//       const saved = JSON.parse(localStorage.getItem("settings"));
//       username.value = saved.username || "";
//       email.value = saved.email || "";
//       theme.value = saved.theme || "light";
//     }
  
//     form.addEventListener("submit", (e) => {
//       e.preventDefault();
//       message.textContent = "";
  
//       if(password.value !== confirmPassword.value) {
//         message.style.color = "red";
//         message.textContent = "Passwords do not match!";
//         return;
//       }
  
//       if(password.value.length > 0 && password.value.length < 6) {
//         message.style.color = "red";
//         message.textContent = "Password must be at least 6 characters!";
//         return;
//       }
  
//       // Save settings
//       const settings = {
//         username: username.value || "User",
//         email: email.value || "user@example.com",
//         theme: theme.value,
//       };
//       localStorage.setItem("settings", JSON.stringify(settings));
  
//       message.style.color = "green";
//       message.textContent = "Settings saved successfully!";
//     });
//   });
  