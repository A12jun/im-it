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

(async function init() {
  initTheme();

  await loadPartial("headerMount", "/im-it/partials/header.html");
  await loadPartial("footerMount", "/im-it/partials/footer.html");

  setActiveNav();
  initMobileMenu();

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
