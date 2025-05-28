const API = "https://dr7kat5az5.execute-api.us-east-1.amazonaws.com/prod";
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 8000; // 8 seconds

// UI Helpers
const showLoader = (loader, buttonText) => {
  loader.style.display = "inline-block";
  buttonText.style.display = "none";
};

const hideLoader = (loader, buttonText) => {
  loader.style.display = "none";
  buttonText.style.display = "inline";
};

const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3500);
};

// Enhanced API Client
async function callAPI(endpoint, method = "GET", payload = null, attempt = 0) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      mode: "cors",
      credentials: "omit",
    };

    if (payload) options.body = JSON.stringify(payload);

    console.debug(`API Call [${attempt}]:`, {
      url: API + endpoint,
      options: { ...options, body: payload },
    });

    const response = await fetch(API + endpoint, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await parseErrorResponse(response);
      console.error("API Error:", errorData);
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }

    return await parseResponse(response);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`API Attempt ${attempt} failed:`, error);

    if (shouldRetry(error) && attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callAPI(endpoint, method, payload, attempt + 1);
    }

    throw transformError(error);
  }
}

// Response handlers
async function parseResponse(response) {
  const text = await response.text();
  try {
    const data = text ? JSON.parse(text) : {};
    // Handle both AWS Lambda proxy and direct responses
    return data.body
      ? { ...data.body, message: data.body.message || data.message }
      : data;
  } catch (e) {
    console.error("Failed to parse response:", e);
    return { message: text };
  }
}

async function parseErrorResponse(response) {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : { message: `HTTP ${response.status}` };
  } catch {
    return { message: `HTTP ${response.status}` };
  }
}

function shouldRetry(error) {
  // Retry on network errors or 5xx server errors
  return (
    error.name === "AbortError" ||
    error.message.includes("Failed to fetch") ||
    (error.message.match(/HTTP (\d+)/) && parseInt(RegExp.$1) >= 500)
  );
}

function transformError(error) {
  if (error.name === "AbortError") {
    return new Error("Request timeout - server took too long to respond");
  }
  if (error.message.includes("Failed to fetch")) {
    return new Error(
      "Cannot connect to server. Please check your internet connection."
    );
  }
  return error;
}

/**
 * Save bookmark state (mock implementation)
 */
function saveBookmarkState(articleId, isBookmarked) {
  // In a real implementation, this would make an API call
  console.log(`Article ${articleId} bookmark state: ${isBookmarked}`);

  // For demo purposes, we'll store in localStorage
  const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");

  if (isBookmarked && !bookmarks.includes(articleId)) {
    bookmarks.push(articleId);
  } else if (!isBookmarked && bookmarks.includes(articleId)) {
    const index = bookmarks.indexOf(articleId);
    bookmarks.splice(index, 1);
  }

  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
}

/**
 * Authentication state management
 */
function initializeAuthState() {
  const authButtons = document.querySelector(".auth-buttons");
  const userMenu = document.querySelector(".user-menu");
  const userNameEl = document.getElementById("userName");

  // Check if user is logged in (from localStorage in this demo)
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userName = localStorage.getItem("userName") || "User";

  if (isLoggedIn && authButtons && userMenu) {
    // Show user menu, hide auth buttons
    authButtons.style.display = "none";
    userMenu.style.display = "flex";

    // Set user name
    if (userNameEl) {
      userNameEl.textContent = userName;
    }
  } else if (authButtons && userMenu) {
    // Show auth buttons, hide user menu
    authButtons.style.display = "flex";
    userMenu.style.display = "none";
  }
}

/**
 * Logout functionality
 */
function logout() {
  // Clear authentication state
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userName");

  // Show toast notification
  showToast("You have been logged out", "info");

  // Update UI
  initializeAuthState();

  // In a real app, you would redirect to home or login page
  // For demo, we'll just refresh the page after a short delay
  setTimeout(() => {
    window.location.href = "/";
  }, 1500);
}
