document.addEventListener("DOMContentLoaded", () => {
  const baseURL = "https://dr7kat5az5.execute-api.us-east-1.amazonaws.com/prod";

  // Check if user is logged in and redirect
  function isLoggedIn() {
    return localStorage.getItem("username") !== null;
  }

  function redirectToDashboard() {
    if (isLoggedIn()) {
      window.location.href = "dashboard.html";
    }
  }

  // Redirect to dashboard if logged in on auth pages
  if (
    window.location.pathname.includes("login.html") ||
    window.location.pathname.includes("register.html") ||
    window.location.pathname.includes("forgot-password.html") ||
    window.location.pathname.includes("reset-password.html")
  ) {
    redirectToDashboard();
  }

  // Form elements
  const forms = {
    register: document.getElementById("registerForm"),
    login: document.getElementById("loginForm"),
    forgotPassword: document.getElementById("forgotPasswordForm"),
    resetPassword: document.getElementById("resetPasswordForm"),
  };

  // Password visibility toggles
  const setupPasswordToggles = () => {
    document
      .querySelectorAll('input[type="checkbox"][id^="show"]')
      .forEach((checkbox) => {
        const inputId = checkbox.id.replace("show", "").toLowerCase();
        const input = document.getElementById(inputId);

        if (input) {
          checkbox.addEventListener("change", () => {
            input.type = checkbox.checked ? "text" : "password";
          });
        }
      });
  };

  // Password strength meter
  const setupPasswordStrengthMeter = (passwordInputId, meterContainerId) => {
    const passwordInput = document.getElementById(passwordInputId);
    const meterContainer = document.getElementById(meterContainerId);

    if (!passwordInput || !meterContainer) return;

    const strengthBars = meterContainer.querySelectorAll(".strength-bar");
    const strengthText = meterContainer.querySelector(".strength-text");

    passwordInput.addEventListener("input", () => {
      const password = passwordInput.value;
      const strength = calculatePasswordStrength(password);

      // Reset all bars
      strengthBars.forEach((bar) => {
        bar.style.backgroundColor = "#ddd";
      });

      // Update bars based on strength
      for (let i = 0; i < strength.score; i++) {
        let color;
        if (strength.score <= 2) color = "#e74c3c"; // Weak (red)
        else if (strength.score === 3) color = "#f39c12"; // Medium (orange)
        else color = "#2ecc71"; // Strong (green)

        strengthBars[i].style.backgroundColor = color;
      }

      // Update text
      strengthText.textContent = strength.message;
      strengthText.style.color =
        strength.score <= 2
          ? "#e74c3c"
          : strength.score === 3
          ? "#f39c12"
          : "#2ecc71";
    });
  };

  // Calculate password strength
  function calculatePasswordStrength(password) {
    let score = 0;
    let messages = [];

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Complexity checks
    if (/[A-Z]/.test(password)) score++; // Has uppercase
    if (/[0-9]/.test(password)) score++; // Has numbers
    if (/[^A-Za-z0-9]/.test(password)) score++; // Has special chars

    // Cap score at 4 (for our 4-bar display)
    score = Math.min(score, 4);

    // Determine message
    let message;
    if (password.length === 0) message = "";
    else if (score <= 2) message = "Weak password";
    else if (score === 3) message = "Medium strength";
    else message = "Strong password";

    return { score, message };
  }

  // Form validation
  const setupFormValidation = (form) => {
    if (!form) return;

    const inputs = form.querySelectorAll("input[required]");

    inputs.forEach((input) => {
      input.addEventListener("blur", () => validateInput(input));
      input.addEventListener("input", () => validateInput(input, true));
    });

    // Special validation for password confirmation
    const passwordInput = form.querySelector(
      'input[type="password"][id="password"]'
    );
    const confirmInput = form.querySelector(
      'input[type="password"][id^="confirm"]'
    );

    if (passwordInput && confirmInput) {
      confirmInput.addEventListener("input", () => {
        if (passwordInput.value !== confirmInput.value) {
          showError(confirmInput, "Passwords do not match");
        } else {
          clearError(confirmInput);
        }
      });
    }
  };

  function validateInput(input, isTyping = false) {
    if (!input.required && input.value === "") return true;

    // Skip validation if typing (only validate on blur or submit)
    if (isTyping && input.type !== "email") return true;

    // Email validation
    if (input.type === "email" && !isValidEmail(input.value)) {
      showError(input, "Please enter a valid email address");
      return false;
    }

    // Password validation
    if (
      input.type === "password" &&
      input.id === "password" &&
      input.value.length > 0 &&
      input.value.length < 8
    ) {
      showError(input, "Password must be at least 8 characters");
      return false;
    }

    // Terms checkbox validation
    if (input.type === "checkbox" && !input.checked) {
      showError(input, "You must accept the terms");
      return false;
    }

    // Clear any existing errors if valid
    clearError(input);
    return true;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(input, message) {
    const errorElement = input.parentElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains("error-message")) {
      errorElement.textContent = message;
      errorElement.classList.add("show");
      input.style.borderColor = "#e74c3c";
    }
  }

  function clearError(input) {
    const errorElement = input.parentElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains("error-message")) {
      errorElement.classList.remove("show");
      input.style.borderColor = "";
    }
  }

  // API request helper
  const sendRequest = async (method, endpoint, data = {}, pathParam = "") => {
    const url = pathParam ? `${baseURL}/${pathParam}` : `${baseURL}${endpoint}`;
    const config = {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(data),
    };

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Request failed");
      }

      return result;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  // Generate random user ID
  const generateUserId = () => {
    return "u_" + Math.random().toString(36).substr(2, 9);
  };

  // Form submission handler
  const attachFormHandler = (
    form,
    endpoint,
    method = "POST",
    pathParam = ""
  ) => {
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Validate all inputs
      let isValid = true;
      const inputs = form.querySelectorAll("input[required]");

      inputs.forEach((input) => {
        if (!validateInput(input)) {
          isValid = false;
        }
      });

      if (!isValid) return;

      const btn = form.querySelector('button[type="submit"]');
      btn.classList.add("loading");
      btn.disabled = true;

      const formData = {};
      inputs.forEach((input) => {
        if (input.id && input.value) {
          formData[input.id] =
            input.type === "checkbox" ? input.checked : input.value;
        }
      });

      try {
        // Special handling for registration
        if (form === forms.register && !formData.userId) {
          formData.userId = generateUserId();
        }

        // Special handling for login
        if (form === forms.login) {
          const result = await sendRequest(
            method,
            endpoint,
            formData,
            pathParam
          );
          localStorage.setItem("username", formData.username || formData.email);
          localStorage.setItem("email", formData.email);
          showSuccessMessage("Login successful! Redirecting...");
          setTimeout(() => (window.location.href = "index.html"), 1500);
          return;
        }

        // Special handling for forgot password
        if (form === forms.forgotPassword) {
          const result = await sendRequest(
            method,
            endpoint,
            formData,
            pathParam
          );
          showSuccessMessage(
            result.message || "Check your email for the reset token."
          );
          form.reset();
          return;
        }

        // Special handling for reset password
        if (form === forms.resetPassword) {
          if (formData.newPassword !== formData.confirmNewPassword) {
            throw new Error("Passwords do not match");
          }

          const payload = {
            email: formData.email,
            resetToken: formData.resetToken,
            newPassword: formData.newPassword,
          };

          const result = await sendRequest(
            method,
            endpoint,
            payload,
            pathParam
          );
          showSuccessMessage(
            result.message || "Password has been reset successfully."
          );
          setTimeout(() => (window.location.href = "login.html"), 1500);
          return;
        }

        // Default handling for other forms
        const result = await sendRequest(method, endpoint, formData, pathParam);
        showSuccessMessage(result.message || "Success!");
        form.reset();

        // Redirect after registration
        if (form === forms.register) {
          setTimeout(() => (window.location.href = "login.html"), 1500);
        }
      } catch (err) {
        showErrorMessage("Error: " + err.message);
      } finally {
        btn.classList.remove("loading");
        btn.disabled = false;
      }
    });
  };

  // Show success message
  function showSuccessMessage(message) {
    // You could replace this with a more sophisticated notification system
    alert(message);
  }

  // Show error message
  function showErrorMessage(message) {
    // You could replace this with a more sophisticated notification system
    alert(message);
  }

  // Initialize all functionality
  const init = () => {
    setupPasswordToggles();

    // Setup password strength meters
    setupPasswordStrengthMeter("password", "password-strength");
    setupPasswordStrengthMeter("newPassword", "password-strength");

    // Setup form validation
    if (forms.register) setupFormValidation(forms.register);
    if (forms.login) setupFormValidation(forms.login);
    if (forms.forgotPassword) setupFormValidation(forms.forgotPassword);
    if (forms.resetPassword) setupFormValidation(forms.resetPassword);

    // Attach form handlers
    attachFormHandler(forms.register, "/users", "POST");
    attachFormHandler(forms.login, "/login", "POST");
    attachFormHandler(forms.forgotPassword, "/forgot-password", "POST");
    attachFormHandler(forms.resetPassword, "/reset-password", "POST");
  };

  init();

  // Global logout function
  window.logout = function () {
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    window.location.href = "index.html";
  };
});
