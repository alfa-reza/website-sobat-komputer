/**
 * product-rail.mjs
 * Horizontal scroll rail dengan native CSS Scroll Snap.
 *
 * State update segera pada klik tombol (tidak menunggu IntersectionObserver).
 * IntersectionObserver hanya digunakan untuk rekonsiliasi setelah swipe manual
 * dan setelah snapping selesai.
 */
export function initProductRail(root) {
  if (!root) return null;

  const viewport = root.querySelector('.product-rail-viewport');
  const track = root.querySelector('.product-rail-track');
  const slides = Array.from(root.querySelectorAll('.product-rail-slide'));
  const prevBtn = root.querySelector('.rail-btn.prev');
  const nextBtn = root.querySelector('.rail-btn.next');
  const statusEl = root.querySelector('.rail-status');

  if (!viewport || !track || slides.length === 0) return null;

  const total = slides.length;
  let currentIndex = 0;

  // Flag untuk memblokir observer saat klik programmatic sedang berlangsung
  let programmaticScroll = false;
  let programmaticTimer = null;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- Kalkulasi visible range ---

  function calcVisibleCount() {
    // Hitung berapa kartu yang muat di viewport berdasarkan lebar slide pertama
    if (slides.length === 0) return 1;
    const slideWidth = slides[0].getBoundingClientRect().width;
    const vpWidth = viewport.clientWidth;
    if (slideWidth <= 0) return 1;
    return Math.max(1, Math.round(vpWidth / slideWidth));
  }

  function buildStatusText(firstIdx, visibleCount) {
    const lastIdx = Math.min(firstIdx + visibleCount - 1, total - 1);
    if (visibleCount <= 1) {
      return `${firstIdx + 1} / ${total}`;
    }
    return `${firstIdx + 1}\u2013${lastIdx + 1} dari ${total}`;
  }

  // --- Update UI ---

  function updateControls(idx) {
    const visibleCount = calcVisibleCount();
    const clampedIdx = Math.max(0, Math.min(idx, total - 1));

    if (prevBtn) prevBtn.disabled = clampedIdx === 0;
    if (nextBtn) nextBtn.disabled = clampedIdx + visibleCount >= total;
    if (statusEl) statusEl.textContent = buildStatusText(clampedIdx, visibleCount);

    currentIndex = clampedIdx;
  }

  // --- Scroll programmatic ---

  function goTo(index) {
    const visibleCount = calcVisibleCount();
    const clamped = Math.max(0, Math.min(index, total - 1));

    // Update state & UI segera, sebelum scroll
    updateControls(clamped);

    // Blokir observer selama scroll programmatic berlangsung
    programmaticScroll = true;
    clearTimeout(programmaticTimer);
    programmaticTimer = setTimeout(() => {
      programmaticScroll = false;
    }, 800);

    const slide = slides[clamped];
    const behavior = motionQuery.matches ? 'auto' : 'smooth';
    const vpRect = viewport.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const scrollTarget = viewport.scrollLeft + (slideRect.left - vpRect.left);

    viewport.scrollTo({ left: scrollTarget, behavior });
  }

  // --- IntersectionObserver untuk rekonsiliasi swipe manual ---

  const slideRatios = new Map();

  const observer = new IntersectionObserver((entries) => {
    // Abaikan callback selama scroll programmatic berlangsung
    if (programmaticScroll) return;

    entries.forEach(entry => {
      slideRatios.set(entry.target, entry.intersectionRatio);
    });

    let maxRatio = -1;
    let dominantIdx = currentIndex;

    slides.forEach((slide, idx) => {
      const ratio = slideRatios.get(slide) ?? 0;
      // Bias kecil ke currentIndex untuk mencegah flicker saat dua kartu sama-sama terlihat
      const adjusted = idx === currentIndex ? ratio + 0.05 : ratio;
      if (adjusted > maxRatio) {
        maxRatio = adjusted;
        dominantIdx = idx;
      }
    });

    if (maxRatio > 0 && dominantIdx !== currentIndex) {
      updateControls(dominantIdx);
    }
  }, {
    root: viewport,
    threshold: [0, 0.25, 0.5, 0.75, 1.0],
  });

  slides.forEach(slide => observer.observe(slide));

  // --- Resize: perbarui indikator setelah layout berubah ---

  let resizeTimer = null;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateControls(currentIndex);
    }, 150);
  });
  resizeObserver.observe(viewport);

  // --- Tombol navigasi ---

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goTo(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goTo(currentIndex + 1);
    });
  }

  // --- Keyboard: ArrowLeft/ArrowRight pada viewport ---

  viewport.addEventListener('keydown', (e) => {
    // Abaikan jika modifier ditekan
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
    // Abaikan jika fokus ada di elemen interaktif lain (bukan viewport sendiri)
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(currentIndex + 1);
    }
  });

  // --- Inisialisasi awal ---

  updateControls(0);

  return { goTo, observer };
}
