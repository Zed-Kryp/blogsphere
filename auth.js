document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI elements
  const form = document.querySelector("form");
  console.log("Form:", form);
  if (!form) return;

  const formId = form.id;
  const loader = form.querySelector(".btn-loader");
  const buttonText = form.querySelector(".btn-text");

  // Form Submission Handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoader(loader, buttonText);

    try {
      // First verify network connectivity
      if (!navigator.onLine) {
        throw new Error(
          "You are offline. Please check your internet connection."
        );
      }

      let result;
      const formData = new FormData(form);

      switch (formId) {
        case "registerForm":
          // Validate inputs
          if (formData.get("password") !== formData.get("confirmPassword")) {
            document.getElementById("confirm-error").innerText =
              "Passwords do not match";
            throw new Error("Passwords do not match");
          }
          if (formData.get("terms") === null) {
            document.getElementById("terms-error").innerText =
              "You must agree to the terms of service";
            throw new Error("You must agree to the terms of service");
          } else {
            result = await callAPI("/users", "POST", {
              name: formData.get("name"),
              username: formData.get("username"),
              email: formData.get("email"),
              password: formData.get("password"),
            });

            setTimeout(() => (window.location.href = "login.html"), 1500);
          }
          break;

        case "loginForm":
          result = await callAPI("/login", "POST", {
            email: formData.get("email"),
            password: formData.get("password"),
          });

          if (result.token) {
            localStorage.setItem("authToken", result.token);
          }
          setTimeout(() => (window.location.href = "dashboard.html"), 1500);
          break;

        // Add other form cases here...

        default:
          throw new Error("Unsupported form type");
      }
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      hideLoader(loader, buttonText);
    }
  });
});
