async function loadPartial(targetId, url) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const res = await fetch(url, { cache: "no-cache" });
  el.innerHTML = await res.text();
}

function setActiveNav() {
  const path = window.location.pathname;
  const links = document.querySelectorAll(".nav-links a");
  links.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;

    if (path === href || (href !== "/im-it/" && path.startsWith(href))) {
      a.classList.add("active");
    }
  });
}

// ---- Dark Mode ----
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) applyTheme(saved);
  else applyTheme("dark"); // default dark mode day 1
}

// ---- Mobile menu ----
function initMobileMenu() {
  const btn = document.getElementById("mobileMenuBtn");
  const drawer = document.getElementById("mobileDrawer");
  if (!btn || !drawer) return;

  btn.addEventListener("click", () => {
    drawer.classList.toggle("open");
  });

  drawer.addEventListener("click", (e) => {
    if (e.target.tagName === "A") drawer.classList.remove("open");
  });
}

// ---- Scroll reveal ----
function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("revealed");
      });
    },
    { threshold: 0.12 },
  );

  items.forEach((el) => io.observe(el));
}

// Contact form handling
function initContactForm() {
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  const messageEl = document.getElementById("formMessage");
  
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Basic validation
    if (!data.name || !data.email || !data.message) {
      showMessage("Please fill in all required fields.", "error");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }

    // Disable submit button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    submitBtn.classList.add("btn-loading");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json"
        }
      });

      if (response.ok) {
        showMessage("Thank you! Your message has been sent successfully.", "success");
        form.reset();
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      showMessage("Sorry, there was an error sending your message. Please try again or use the email below.", "error");
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = "Send";
      submitBtn.classList.remove("btn-loading");
    }
  });

  function showMessage(text, type) {
    if (!messageEl) return;
    
    messageEl.textContent = text;
    messageEl.style.display = "block";
    messageEl.style.color = type === "success" ? "#4ade80" : "#f87171";
    messageEl.style.fontWeight = "600";
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      messageEl.style.display = "none";
    }, 5000);
  }
}

// Email obfuscation for security
function obfuscateEmail() {
  const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
  emailLinks.forEach(link => {
    const email = link.getAttribute('href').replace('mailto:', '');
    const obfuscated = email.replace(/./g, char => {
      return '&#' + char.charCodeAt(0) + ';';
    });
    link.setAttribute('mailto:' + obfuscated);
    link.innerHTML = obfuscated;
  });
}

// ---- Auto-scrolling ticker with pause ----
function initTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  // Add scrolling class to start animation
  track.classList.add('scrolling');

  // Calculate when to pause - check every 100ms
  let lastScrollPosition = 0;
  const pauseDuration = 2000; // 2 seconds

  function checkPosition() {
    const container = track.closest('.auto-scroll-wrapper');
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const trackWidth = track.scrollWidth / 2; // Width of one set (we have 2 sets)
    
    // Get current transform position
    const style = window.getComputedStyle(track);
    const transform = style.transform;
    let currentX = 0;
    
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      currentX = matrix.m41;
    }

    // Check if first set has scrolled out of view
    // We want to pause when the second set starts entering
    const scrollProgress = Math.abs(currentX);
    
    // When we've scrolled past the first set (50% of track), pause
    if (scrollProgress >= trackWidth - 100) {
      // Pause the animation
      track.style.animationPlayState = 'paused';
      
      // Wait 2 seconds then restart
      setTimeout(() => {
        // Reset position to start (creates seamless loop effect)
        track.style.transform = 'translateX(0)';
        
        // Force reflow to reset animation
        void track.offsetWidth;
        
        // Resume animation
        track.style.animationPlayState = 'running';
      }, pauseDuration);
    }
  }

  // Check position periodically
  setInterval(checkPosition, 100);

  // Pause on hover
  track.addEventListener('mouseenter', () => {
    track.style.animationPlayState = 'paused';
  });

  track.addEventListener('mouseleave', () => {
    track.style.animationPlayState = 'running';
  });
}

(async function init() {
  initTheme();

  await loadPartial("headerMount", "/partials/header.html");
  await loadPartial("footerMount", "/partials/footer.html");

  setActiveNav();
  initMobileMenu();
  initContactForm();
  obfuscateEmail();
  initTicker();

  document
    .getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);
  document
    .getElementById("themeToggleMobile")
    ?.addEventListener("click", toggleTheme);

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initReveal();
})();
