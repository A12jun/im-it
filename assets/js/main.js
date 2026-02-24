async function loadPartial(targetId, url) {
  const el = document.getElementById(targetId);
  if (!el) return;
  
  console.log('Loading partial:', url);
  
  try {
    const res = await fetch(url, { cache: "no-cache" });
    console.log('Response status:', res.status, 'for URL:', url);
    
    if (!res.ok) {
      console.error('Failed to load', url, '- status:', res.status);
      // Fallback: show error message in the mount point
      el.innerHTML = '<div style="padding: 20px; color: red;">Failed to load content. Please refresh the page.</div>';
      return;
    }
    
    el.innerHTML = await res.text();
    console.log('Successfully loaded:', url);
  } catch (err) {
    console.error('Error loading', url, '-', err.message);
    // Fallback: show error message
    el.innerHTML = '<div style="padding: 20px; color: red;">Error loading content. Please refresh the page or try a different browser.</div>';
  }
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

// ---- Dynamic Testimonials ----
async function loadTestimonials() {
  const track = document.getElementById('testimonial-track');
  if (!track) return;

  try {
    // Load the JSON file with testimonial file names
    const res = await fetch('/assets/testimonials.json', { cache: "no-cache" });
    if (!res.ok) throw new Error('Failed to load testimonials list');
    
    const files = await res.json();
    
    let testimonialsHTML = '';
    
    // Load each testimonial file
    for (const file of files) {
      try {
        const testimonialRes = await fetch(`/assets/Testimonials/${file}`, { cache: "no-cache" });
        if (!testimonialRes.ok) continue;
        
        const content = await testimonialRes.text();
        
        // Parse the testimonial content
        let name = '';
        let text = '';
        
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.startsWith('Name:')) {
            name = line.replace('Name:', '').trim();
          } else if (line.startsWith('Content:')) {
            text = line.replace('Content:', '').trim();
          }
        }
        
        if (name && text) {
          testimonialsHTML += `
            <div class="testimonial-slide">
              <div class="testimonial-card">
                <p class="testimonial-text">"${text}"</p>
                <div class="testimonial-author">— ${name}</div>
              </div>
            </div>
          `;
        }
      } catch (err) {
        console.error('Error loading testimonial:', file, err);
      }
    }
    
    // Duplicate for seamless loop
    track.innerHTML = testimonialsHTML + testimonialsHTML;
    
  } catch (err) {
    console.error('Error loading testimonials:', err);
    track.innerHTML = '<p style="padding: 20px; text-align: center;">Testimonials coming soon...</p>';
  }
}

// ---- Infinite scroll - conveyor belt effect ----
function initInfiniteScroll(trackId, speed = 1) {
  const track = document.getElementById(trackId);
  if (!track) return;

  let position = 0;

  function animate() {
    position -= speed;

    // Get the width of one complete set (first half of the duplicated content)
    const trackWidth = track.scrollWidth / 2;

    // When we've scrolled one complete set, reset to 0 (seamless loop)
    if (Math.abs(position) >= trackWidth) {
      position = 0;
    }

    track.style.transform = `translateX(${position}px)`;
    requestAnimationFrame(animate);
  }

  animate();
}

// ---- Tabs ----
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      // Remove active class from all buttons and contents
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      btn.classList.add('active');
      document.getElementById(tabId)?.classList.add('active');
    });
  });
}

// ---- Book-style page flip ----
function initScrollArrows() {
  const containers = document.querySelectorAll('.scroll-container');
  
  containers.forEach(container => {
    const cards = container.querySelectorAll('.book-card');
    const leftArrow = container.querySelector('.scroll-arrow.left');
    const rightArrow = container.querySelector('.scroll-arrow.right');
    
    if (cards.length === 0) return;
    
    // Track current card index per container
    container.dataset.currentIndex = 0;
    showCard(container, 0);
    
    if (leftArrow) {
      leftArrow.addEventListener('click', () => navigateCard(container, -1));
    }
    
    if (rightArrow) {
      rightArrow.addEventListener('click', () => navigateCard(container, 1));
    }
  });
}

function showCard(container, index) {
  const cards = container.querySelectorAll('.book-card');
  if (cards.length === 0) return;
  
  // Clamp index
  if (index < 0) index = 0;
  if (index >= cards.length) index = cards.length - 1;
  
  container.dataset.currentIndex = index;
  
  cards.forEach((card, i) => {
    card.classList.remove('active', 'flipping-next', 'flipping-prev', 'enter-next', 'enter-prev');
    if (i === index) {
      card.classList.add('active');
    }
  });
  
  // Update page dots if they exist
  updatePageDots(container, index);
}

function navigateCard(container, direction) {
  const cards = container.querySelectorAll('.book-card');
  const tabContent = container.closest('.tab-content');
  const currentIndex = parseInt(container.dataset.currentIndex) || 0;
  let newIndex = currentIndex + direction;
  
  // If going past the last card, move to next tab
  if (newIndex >= cards.length && direction > 0) {
    if (tabContent) {
      goToNextTab(tabContent);
    }
    return;
  }
  
  // If going before first card, move to previous tab
  if (newIndex < 0 && direction < 0) {
    if (tabContent) {
      goToPrevTab(tabContent);
    }
    return;
  }
  
  // Animate the flip
  const currentCard = cards[currentIndex];
  const nextCard = cards[newIndex];
  
  if (direction > 0) {
    currentCard.classList.add('flipping-next');
    nextCard.classList.add('enter-next');
  } else {
    currentCard.classList.add('flipping-prev');
    nextCard.classList.add('enter-prev');
  }
  
  setTimeout(() => {
    showCard(container, newIndex);
  }, 300);
}

function goToNextTab(currentTabContent) {
  const allTabs = document.querySelectorAll('.tab-content');
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  // Find current tab index
  let currentIndex = -1;
  allTabs.forEach((tab, i) => {
    if (tab === currentTabContent) currentIndex = i;
  });
  
  // Go to next tab
  const nextIndex = (currentIndex + 1) % allTabs.length;
  
  // Update tabs
  allTabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === nextIndex);
  });
  
  tabButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === nextIndex);
  });
  
  // Reset card index for new tab
  const nextTab = allTabs[nextIndex];
  const nextContainer = nextTab.querySelector('.scroll-container');
  if (nextContainer) {
    nextContainer.dataset.currentIndex = 0;
    showCard(nextContainer, 0);
  }
}

function goToPrevTab(currentTabContent) {
  const allTabs = document.querySelectorAll('.tab-content');
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  // Find current tab index
  let currentIndex = -1;
  allTabs.forEach((tab, i) => {
    if (tab === currentTabContent) currentIndex = i;
  });
  
  // Go to previous tab (wrap around)
  const prevIndex = currentIndex <= 0 ? allTabs.length - 1 : currentIndex - 1;
  
  // Update tabs
  allTabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === prevIndex);
  });
  
  tabButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === prevIndex);
  });
  
  // Reset card index for new tab
  const prevTab = allTabs[prevIndex];
  const prevContainer = prevTab.querySelector('.scroll-container');
  if (prevContainer) {
    const cards = prevContainer.querySelectorAll('.book-card');
    prevContainer.dataset.currentIndex = cards.length - 1;
    showCard(prevContainer, cards.length - 1);
  }
}

function updatePageDots(container, index) {
  const dots = container.querySelectorAll('.page-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
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
  
  // Load testimonials - CSS handles the scrolling now
  loadTestimonials();

  document
    .getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);
  document
    .getElementById("themeToggleMobile")
    ?.addEventListener("click", toggleTheme);

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initReveal();
  initTabs();
  initScrollArrows();
})();
