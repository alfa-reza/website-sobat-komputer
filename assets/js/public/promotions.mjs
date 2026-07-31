import { getPromotions } from "../core/content-api.mjs";
import { initCarousel } from "./carousel.mjs";

export function normalizePromotionCandidates(value) {
  if (!Array.isArray(value)) return null;

  const candidates = value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    if (
      typeof item.id !== "string" ||
      typeof item.src !== "string" ||
      typeof item.alt !== "string"
    )
      return null;
    const id = item.id.trim();
    const src = item.src.trim();
    const alt = item.alt.trim();
    return id && src && alt ? Object.freeze({ id, src, alt }) : null;
  });

  return candidates.every(Boolean) ? Object.freeze(candidates) : null;
}

export function buildPromotionSlides(promotions) {
  return promotions.map((promotion, index) =>
    Object.freeze({
      ...promotion,
      position: index + 1,
      total: promotions.length,
      hidden: index !== 0,
      loading: index === 0 ? "eager" : "lazy",
    }),
  );
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = reject;
    image.src = src;
  });
}

export async function preloadPromotionCandidates(
  value,
  loadImage = preloadImage,
) {
  const promotions = normalizePromotionCandidates(value);
  if (promotions === null) throw new Error("Invalid promotion media.");

  if (promotions.length > 0) {
    await loadImage(promotions[0].src);
  }

  const remaining = promotions.slice(1);
  if (remaining.length > 0) {
    const scheduleIdle = typeof requestIdleCallback === "function"
      ? requestIdleCallback
      : (cb) => setTimeout(cb, 50);
    scheduleIdle(() => {
      remaining.forEach(({ src }) => loadImage(src).catch(() => {}));
    });
  }

  return promotions;
}

function createSlide(view) {
  const slide = document.createElement("div");
  slide.className = "carousel-slide";
  slide.setAttribute("role", "group");
  slide.setAttribute("aria-roledescription", "slide");
  slide.setAttribute(
    "aria-label",
    `Poster ${view.position} dari ${view.total}`,
  );
  slide.setAttribute("aria-hidden", String(view.hidden));
  slide.dataset.promotionId = view.id;

  const image = document.createElement("img");
  image.src = view.src;
  image.alt = view.alt;
  image.loading = view.loading;
  image.decoding = "async";
  slide.append(image);
  return slide;
}

function createCarouselCandidate(root, promotions) {
  const candidate = root.cloneNode(true);
  const track = candidate.querySelector(".carousel-track");
  const indicators = candidate.querySelector(".carousel-indicators");
  const status = candidate.querySelector(".carousel-status");
  if (!track || !indicators || !status)
    throw new Error("Invalid carousel markup.");

  const slides = buildPromotionSlides(promotions);
  track.replaceChildren(...slides.map(createSlide));
  indicators.replaceChildren();
  status.textContent = `1 / ${slides.length}`;
  candidate.classList.remove("is-initialized", "is-interactive");
  return candidate;
}

function createEmptyCandidate() {
  const empty = document.createElement("div");
  empty.className = "promo-empty";
  empty.setAttribute("role", "status");

  const message = document.createElement("p");
  message.textContent = "Belum ada promo aktif saat ini.";

  const link = document.createElement("a");
  link.className = "btn btn-wa";
  link.href =
    "https://wa.me/6288980042670?text=Halo%20New%20Sobat%20Komputer%2C%20saya%20mau%20tanya%20detail%20promo%20terbaru.";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Tanya Promo via WhatsApp";

  const catalogLink = document.createElement("a");
  catalogLink.className = "btn btn-catalog mt-1";
  catalogLink.href = "https://wa.me/c/6288980042670";
  catalogLink.target = "_blank";
  catalogLink.rel = "noopener noreferrer";
  catalogLink.textContent = "Lihat Katalog WhatsApp";

  empty.append(message, link, catalogLink);
  return empty;
}

export async function initPromotions(root) {
  if (!root || typeof root.querySelector !== "function") return false;
  const fallbackController = initCarousel(root);

  try {
    const promotions = await preloadPromotionCandidates(await getPromotions());
    const candidate =
      promotions.length === 0
        ? createEmptyCandidate()
        : createCarouselCandidate(root, promotions);

    fallbackController?.destroy();
    root.replaceWith(candidate);
    if (promotions.length > 0 && !initCarousel(candidate)) {
      candidate.replaceWith(root);
      initCarousel(root);
      throw new Error("Carousel initialization failed.");
    }
    return true;
  } catch {
    return false;
  }
}
