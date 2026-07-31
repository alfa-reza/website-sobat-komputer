import { getProducts } from "../core/content-api.mjs";
import { buildWhatsAppUrl } from "../core/whatsapp.mjs";

const EMPTY_WHATSAPP_URL =
  "https://wa.me/6288980042670?text=Halo%20New%20Sobat%20Komputer%2C%20saya%20ingin%20menanyakan%20produk%20yang%20tersedia.";

export function normalizeProductCandidates(value) {
  if (!Array.isArray(value)) return null;

  const candidates = value.map((product) => {
    if (!product || typeof product !== "object" || Array.isArray(product))
      return null;
    if (typeof product.id !== "string") return null;
    const id = product.id.trim();
    if (!id) return null;

    const image = product.image;
    if (!image || typeof image !== "object" || Array.isArray(image))
      return null;
    if (typeof image.src !== "string" || typeof image.alt !== "string")
      return null;

    const src = image.src.trim();
    const alt = image.alt.trim();
    if (!src || !alt) return null;

    return Object.freeze({
      id,
      image: Object.freeze({ src, alt }),
    });
  });

  return candidates.every(Boolean) ? Object.freeze(candidates) : null;
}

export function buildProductViews(products) {
  return products.map((product, productIndex) =>
    Object.freeze({
      id: product.id,
      image: Object.freeze({
        ...product.image,
        loading: productIndex === 0 ? "eager" : "lazy",
      }),
      whatsappUrl: EMPTY_WHATSAPP_URL,
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

export async function preloadProductViews(views, loadImage = preloadImage) {
  await Promise.all(views.map(({ image }) => loadImage(image.src)));
  return views;
}

function createEmptyCandidate() {
  const root = document.createElement("div");
  root.className = "product-region";
  root.dataset.products = "";

  const empty = document.createElement("div");
  empty.className = "product-empty";
  empty.setAttribute("role", "status");

  const message = document.createElement("p");
  message.textContent = "Belum ada produk yang ditampilkan saat ini.";

  const link = document.createElement("a");
  link.className = "btn btn-wa";
  link.href = EMPTY_WHATSAPP_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Tanya Produk via WhatsApp";

  const catalogLink = document.createElement("a");
  catalogLink.className = "btn btn-catalog mt-1";
  catalogLink.href = "https://wa.me/c/6288980042670";
  catalogLink.target = "_blank";
  catalogLink.rel = "noopener noreferrer";
  catalogLink.textContent = "Lihat Katalog WhatsApp";

  empty.append(message, link, catalogLink);
  root.append(empty);
  return root;
}

function createProductCarousel(views) {
  const root = document.createElement("div");
  root.className = "product-region";
  root.dataset.products = "";

  const carousel = document.createElement("div");
  carousel.className = "carousel";
  carousel.dataset.carousel = "product";
  carousel.dataset.carouselNoun = "Produk";
  carousel.setAttribute("role", "group");
  carousel.setAttribute("aria-roledescription", "carousel");
  carousel.setAttribute("aria-label", "Produk Tersedia");

  const viewport = document.createElement("div");
  viewport.className = "carousel-viewport";
  viewport.setAttribute("aria-live", "polite");

  const track = document.createElement("div");
  track.className = "carousel-track";

  views.forEach((view, index) => {
    const slide = document.createElement("article");
    slide.className = "carousel-slide";
    slide.dataset.index = String(index);
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute(
      "aria-label",
      `Produk ${index + 1} dari ${views.length}`,
    );
    if (index === 0) slide.dataset.active = "";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "product-photo-wrapper";

    const image = document.createElement("img");
    image.src = view.image.src;
    image.alt = view.image.alt;
    image.loading = view.image.loading;
    image.decoding = "async";
    image.className = "product-photo";

    const action = document.createElement("a");
    action.className = "product-photo-action";
    action.href = view.whatsappUrl;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    action.setAttribute("aria-label", "Tanyakan produk ini melalui WhatsApp");
    action.appendChild(image);

    imageWrapper.appendChild(action);
    slide.appendChild(imageWrapper);
    track.appendChild(slide);
  });

  viewport.appendChild(track);
  carousel.appendChild(viewport);

  if (views.length > 1) {
    const controls = document.createElement("div");
    controls.className = "carousel-controls";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "carousel-btn prev";
    prev.dataset.carouselPrev = "";
    prev.setAttribute("aria-label", "Produk sebelumnya");
    prev.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';

    const status = document.createElement("div");
    status.className = "carousel-status";
    status.dataset.carouselStatus = "";
    status.setAttribute("aria-hidden", "true");
    status.textContent = `1 / ${views.length}`;

    const next = document.createElement("button");
    next.type = "button";
    next.className = "carousel-btn next";
    next.dataset.carouselNext = "";
    next.setAttribute("aria-label", "Produk selanjutnya");
    next.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    controls.append(prev, status, next);
    carousel.appendChild(controls);
  }

  const actions = document.createElement("div");
  actions.className = "product-actions";

  const catalogLink = document.createElement("a");
  catalogLink.className = "btn btn-catalog mt-1";
  catalogLink.href = "https://wa.me/c/6288980042670";
  catalogLink.target = "_blank";
  catalogLink.rel = "noopener noreferrer";
  catalogLink.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> Buka Katalog Resmi';

  actions.appendChild(catalogLink);
  root.append(carousel, actions);

  return root;
}

export async function initProducts(
  root,
  {
    limit,
    pageUrl,
    loadProducts = getProducts,
    loadImage = preloadImage,
    initCarouselFn,
  } = {},
) {
  if (!root || typeof root.replaceWith !== "function") return false;

  try {
    const products = normalizeProductCandidates(await loadProducts({ limit }));
    if (products === null) throw new Error("Invalid product content.");
    const views = buildProductViews(products, { pageUrl });
    const candidate =
      views.length === 0
        ? createEmptyCandidate()
        : createProductCarousel(await preloadProductViews(views, loadImage));
    root.replaceWith(candidate);

    if (views.length > 0 && typeof initCarouselFn === "function") {
      initCarouselFn(candidate.querySelector(".carousel"));
    }
    return true;
  } catch {
    return false;
  }
}
