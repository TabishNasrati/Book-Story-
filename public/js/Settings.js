document.addEventListener("DOMContentLoaded", () => {
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const avatar = document.getElementById("avatar");
    const theme = document.getElementById("theme");
    const message = document.getElementById("message");
    const form = document.getElementById("settingsForm");
  
    // Toggle Password visibility
    document.getElementById("togglePassword").addEventListener("click", () => {
      password.type = password.type === "password" ? "text" : "password";
    });
  
    // Load saved settings from server
    async function loadSettings() {
      try {
        const res = await fetch("/api/Settings");
        const data = await res.json();
        username.value = data.username || "";
        email.value = data.email || "";
        theme.value = data.theme || "light";
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    }
  
    // Submit settings form
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      message.textContent = "";
  
      if (password.value !== confirmPassword.value) {
        message.style.color = "red";
        message.textContent = "Passwords do not match!";
        return;
      }
  
      if (password.value && password.value.length < 6) {
        message.style.color = "red";
        message.textContent = "Password must be at least 6 characters!";
        return;
      }
  
      const formData = new FormData();
      formData.append("username", username.value);
      formData.append("email", email.value);
      formData.append("password", password.value);
      formData.append("theme", theme.value);
  
      if (avatar.files[0]) {
        formData.append("avatar", avatar.files[0]);
      }
  
      try {
        const res = await fetch("/api/Settings", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.error) {
          message.style.color = "red";
          message.textContent = data.error;
        } else {
          message.style.color = "green";
          message.textContent = data.message || "Settings saved successfully!";
          // Clear password fields after save
          password.value = "";
          confirmPassword.value = "";
        }
      } catch (err) {
        console.error("Error saving settings:", err);
        message.style.color = "red";
        message.textContent = "Server error saving settings!";
      }
    });
  
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
  