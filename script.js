/**
 * BlogSphere - Main JavaScript
 * Handles all interactive elements of the website
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize all components
  initializeHeader();
  initializeSearch();
  initializeBackToTop();
  initializeBookmarks();
  initializeScrollAnimations();
  initializeNewsletter();
  initializeMobileMenu();
});

/**
 * Header functionality - sticky header on scroll
 */
function initializeHeader() {
  const header = document.querySelector(".sticky-header");
  const scrollThreshold = 100;

  window.addEventListener("scroll", () => {
    if (window.scrollY > scrollThreshold) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

/**
 * Search overlay functionality
 */
function initializeSearch() {
  const searchBtn = document.querySelector(".search-btn");
  const searchOverlay = document.querySelector(".search-overlay");
  const searchClose = document.querySelector(".search-close");
  const searchInput = document.querySelector(".search-input");

  // If search elements don't exist on this page, return
  if (!searchOverlay) return;

  // Add search button if it doesn't exist
  if (!searchBtn && document.querySelector(".header-actions")) {
    const searchBtnHTML = `<button class="search-btn" aria-label="Search"><i class="fas fa-search"></i></button>`;
    document
      .querySelector(".header-actions")
      .insertAdjacentHTML("afterbegin", searchBtnHTML);
  }

  // Toggle search overlay
  document.addEventListener("click", (e) => {
    if (e.target.closest(".search-btn")) {
      searchOverlay.classList.add("active");
      searchInput.focus();
      document.body.style.overflow = "hidden";
    }

    if (e.target.closest(".search-close")) {
      searchOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Close search on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchOverlay.classList.contains("active")) {
      searchOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Handle search form submission
  const searchForm = document.querySelector(".search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const searchQuery = searchInput.value.trim();

      if (searchQuery) {
        // In a real implementation, redirect to search results page
        window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
      }
    });
  }
}

/**
 * Back to top button functionality
 */
function initializeBackToTop() {
  const backToTopBtn = document.querySelector(".back-to-top");
  const scrollThreshold = 300;

  if (!backToTopBtn) return;

  // Show/hide button based on scroll position
  window.addEventListener("scroll", () => {
    if (window.scrollY > scrollThreshold) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  // Scroll to top when clicked
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

/**
 * Bookmark functionality
 */
function initializeBookmarks() {
  const bookmarkBtns = document.querySelectorAll(".bookmark-btn");

  bookmarkBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      // Toggle bookmark state
      btn.classList.toggle("active");

      // Toggle icon
      const icon = btn.querySelector("i");
      if (icon.classList.contains("far")) {
        icon.classList.remove("far");
        icon.classList.add("fas");
      } else {
        icon.classList.remove("fas");
        icon.classList.add("far");
      }

      // In a real implementation, you would save this state to the user's account
      const articleId = btn.closest("article").dataset.id;
      saveBookmarkState(articleId, btn.classList.contains("active"));
    });
  });
}

/**
 * Scroll animations for elements
 */
function initializeScrollAnimations() {
  // This is a simplified version, consider using a library like AOS for production
  const animateElements = document.querySelectorAll(
    ".featured-card, .post-card, .topic-card"
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animated");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    animateElements.forEach((element) => {
      observer.observe(element);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    animateElements.forEach((element) => {
      element.classList.add("animated");
    });
  }
}

/**
 * Newsletter subscription handling
 */
function initializeNewsletter() {
  const newsletterForms = document.querySelectorAll(
    ".newsletter-form, .inline-newsletter-form, .footer-newsletter-form"
  );

  newsletterForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput.value.trim();

      if (email) {
        // In a real implementation, submit to your newsletter service
        // For demo, we'll just show a success message
        emailInput.value = "";

        // Mock API call
        console.log(`Newsletter subscription: ${email}`);
      }
    });
  });
}

/**
 * Mobile menu functionality
 */
function initializeMobileMenu() {
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mainNav = document.querySelector(".main-nav");

  if (!mobileMenuBtn || !mainNav) return;

  mobileMenuBtn.addEventListener("click", () => {
    mainNav.classList.toggle("active");

    // Toggle icon between bars and times
    const icon = mobileMenuBtn.querySelector("i");
    if (icon.classList.contains("fa-bars")) {
      icon.classList.remove("fa-bars");
      icon.classList.add("fa-times");
    } else {
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      mainNav.classList.contains("active") &&
      !e.target.closest(".mobile-menu-btn") &&
      !e.target.closest(".main-nav")
    ) {
      mainNav.classList.remove("active");

      // Reset icon
      const icon = mobileMenuBtn.querySelector("i");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }
  });

  // Close mobile menu when window is resized to desktop size
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && mainNav.classList.contains("active")) {
      mainNav.classList.remove("active");

      // Reset icon
      const icon = mobileMenuBtn.querySelector("i");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }
  });
}

/**
 * Add animations to CSS
 * This adds the necessary CSS for scroll animations
 */
(function addAnimationStyles() {
  const style = document.createElement("style");
  style.textContent = `
        .featured-card, .post-card, .topic-card {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        
        .featured-card.animated, .post-card.animated, .topic-card.animated {
            opacity: 1;
            transform: translateY(0);
        }
        
        @media (prefers-reduced-motion: reduce) {
            .featured-card, .post-card, .topic-card {
                opacity: 1;
                transform: translateY(0);
                transition: none;
            }
        }
    `;
  document.head.appendChild(style);
})();
