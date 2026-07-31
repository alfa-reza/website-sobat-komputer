document.documentElement.classList.add("js-ready");

// Mobile menu toggle
const menuBtn = document.getElementById("menuBtn");
const navList = document.getElementById("navList");

if (menuBtn && navList) {
  menuBtn.addEventListener("click", () => {
    const isOpen = menuBtn.classList.toggle("open");
    navList.classList.toggle("show");
    menuBtn.setAttribute("aria-expanded", isOpen);
    menuBtn.setAttribute(
      "aria-label",
      isOpen ? "Tutup menu navigasi" : "Buka menu navigasi",
    );
  });

  // Close menu when a nav link is clicked
  navList.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      menuBtn.classList.remove("open");
      navList.classList.remove("show");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Buka menu navigasi");
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      navList.classList.contains("show") &&
      !menuBtn.contains(e.target) &&
      !navList.contains(e.target)
    ) {
      menuBtn.classList.remove("open");
      navList.classList.remove("show");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Buka menu navigasi");
    }
  });

  // Close menu with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navList.classList.contains("show")) {
      menuBtn.classList.remove("open");
      navList.classList.remove("show");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Buka menu navigasi");
      menuBtn.focus();
    }
  });
}

// Back to top button
const backTop = document.getElementById("backTop");
if (backTop) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      backTop.classList.add("visible");
    } else {
      backTop.classList.remove("visible");
    }
  }, { passive: true });

  backTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  });
}

// Header scroll state
const header = document.querySelector(".header");
if (header) {
  const scrollThreshold = 32;
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle("is-scrolled", window.scrollY > scrollThreshold);
        ticking = false;
      });
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// Reveal on scroll (IntersectionObserver)
const motionOk =
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (motionOk && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  document.querySelectorAll("[data-reveal]").forEach((el) => {
    revealObserver.observe(el);
  });
} else {
  // No animation: make everything visible immediately
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    el.classList.add("is-revealed");
  });
}
