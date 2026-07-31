const instances = new WeakMap();

export function normalizeCarouselIndex(index, count) {
  if (!Number.isInteger(count) || count <= 1 || !Number.isFinite(index))
    return 0;
  return ((Math.trunc(index) % count) + count) % count;
}

export function getCarouselRules(count) {
  const total = Number.isInteger(count) && count > 0 ? count : 0;
  return Object.freeze({
    count: total,
    hasSlides: total > 0,
    isInteractive: total > 1,
  });
}

export function initCarousel(root) {
  if (!root || typeof root.querySelector !== "function") return null;
  if (instances.has(root)) return instances.get(root);

  const viewport = root.querySelector(".carousel-viewport");
  const track = root.querySelector(".carousel-track");
  const slides = [...root.querySelectorAll(".carousel-slide")];
  if (!viewport || !track || slides.length === 0) return null;

  const rules = getCarouselRules(slides.length);
  const noun = root.dataset.carouselNoun || "Poster";
  const nounLower = noun.toLowerCase();
  const previousButton = root.querySelector(".carousel-btn.prev");
  const nextButton = root.querySelector(".carousel-btn.next");
  const playPauseButton = root.querySelector(".play-pause");
  const indicators = root.querySelector(".carousel-indicators");
  const status = root.querySelector(".carousel-status");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const abortController = new AbortController();
  const listenerOptions = { signal: abortController.signal };
  let currentIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.getAttribute("aria-hidden") === "false"),
  );
  let autoplayTimer = null;
  let userPaused = false;
  let pointerPaused = false;
  let focusPaused = false;
  let touchStartX = 0;

  const autoplayEnabled = root.dataset.carouselAutoplay !== "false";

  if (playPauseButton && !autoplayEnabled) playPauseButton.hidden = true;

  function canAutoplay() {
    return (
      autoplayEnabled &&
      rules.isInteractive &&
      !userPaused &&
      !pointerPaused &&
      !focusPaused &&
      !document.hidden &&
      !motionQuery.matches
    );
  }

  function stopAutoplay() {
    if (autoplayTimer !== null) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function syncAutoplay() {
    stopAutoplay();
    if (canAutoplay())
      autoplayTimer = window.setInterval(() => goTo(currentIndex + 1), 5000);
  }

  function update(announce = false) {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    slides.forEach((slide, index) => {
      const inactive = index !== currentIndex;
      slide.setAttribute("aria-hidden", String(inactive));
      slide.setAttribute(
        "aria-label",
        `${noun} ${index + 1} dari ${rules.count}`,
      );
      slide.inert = inactive;
    });

    if (indicators) {
      indicators.querySelectorAll(".indicator-dot").forEach((dot, index) => {
        const active = index === currentIndex;
        dot.classList.toggle("active", active);
        dot.setAttribute("aria-current", String(active));
      });
    }

    if (status) {
      status.setAttribute("aria-live", announce ? "polite" : "off");
      status.textContent = `${currentIndex + 1} / ${rules.count}`;
    }
  }

  function goTo(index, { announce = false } = {}) {
    currentIndex = normalizeCarouselIndex(index, rules.count);
    update(announce);
    syncAutoplay();
  }

  function next(options) {
    goTo(currentIndex + 1, options);
  }

  function previous(options) {
    goTo(currentIndex - 1, options);
  }

  function setUserPaused(paused) {
    userPaused = paused;
    if (playPauseButton) {
      playPauseButton.classList.toggle("is-paused", paused);
      playPauseButton.setAttribute(
        "aria-label",
        paused ? "Putar carousel" : "Jeda carousel",
      );
      playPauseButton.setAttribute("aria-pressed", String(paused));
    }
    syncAutoplay();
  }

  if (indicators) {
    indicators.replaceChildren(
      ...slides.map((_, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "indicator-dot";
        button.dataset.carouselIndex = String(index);
        button.setAttribute("aria-label", `Buka ${nounLower} ${index + 1}`);
        return button;
      }),
    );
    indicators.addEventListener(
      "click",
      (event) => {
        const button = event.target.closest("[data-carousel-index]");
        if (button && indicators.contains(button))
          goTo(Number(button.dataset.carouselIndex), { announce: true });
      },
      listenerOptions,
    );
  }

  if (rules.isInteractive) {
    previousButton?.addEventListener(
      "click",
      () => previous({ announce: true }),
      listenerOptions,
    );
    nextButton?.addEventListener(
      "click",
      () => next({ announce: true }),
      listenerOptions,
    );
    playPauseButton?.addEventListener(
      "click",
      () => setUserPaused(!userPaused),
      listenerOptions,
    );

    viewport.addEventListener(
      "mouseenter",
      () => {
        pointerPaused = true;
        syncAutoplay();
      },
      listenerOptions,
    );
    viewport.addEventListener(
      "mouseleave",
      () => {
        pointerPaused = false;
        syncAutoplay();
      },
      listenerOptions,
    );
    viewport.addEventListener(
      "focusin",
      () => {
        focusPaused = true;
        syncAutoplay();
      },
      listenerOptions,
    );
    viewport.addEventListener(
      "focusout",
      (event) => {
        if (viewport.contains(event.relatedTarget)) return;
        focusPaused = false;
        syncAutoplay();
      },
      listenerOptions,
    );
    root.addEventListener(
      "keydown",
      (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
          return;
        const actions = {
          ArrowLeft: () => previous({ announce: true }),
          ArrowRight: () => next({ announce: true }),
          Home: () => goTo(0, { announce: true }),
          End: () => goTo(rules.count - 1, { announce: true }),
        };
        if (!actions[event.key]) return;
        event.preventDefault();
        actions[event.key]();
      },
      listenerOptions,
    );
    viewport.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
      },
      { ...listenerOptions, passive: true },
    );
    viewport.addEventListener(
      "touchend",
      (event) => {
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) <= 50) return;
        if (distance > 0) previous({ announce: true });
        else next({ announce: true });
      },
      { ...listenerOptions, passive: true },
    );
    document.addEventListener(
      "visibilitychange",
      syncAutoplay,
      listenerOptions,
    );
    motionQuery.addEventListener("change", syncAutoplay, listenerOptions);
  }

  const controller = {
    goTo,
    next,
    previous,
    destroy() {
      stopAutoplay();
      abortController.abort();
      root.classList.remove("is-initialized", "is-interactive");
      track.style.removeProperty("transform");
      slides.forEach((slide) => {
        slide.inert = false;
      });
      instances.delete(root);
    },
  };

  root.classList.add("is-initialized");
  root.classList.toggle("is-interactive", rules.isInteractive);
  update(false);
  syncAutoplay();
  instances.set(root, controller);
  return controller;
}
