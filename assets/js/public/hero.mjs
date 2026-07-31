import { getHero } from "../core/content-api.mjs";

export function normalizeHeroCandidate(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (
    typeof value.desktopSrc !== "string" ||
    typeof value.mobileSrc !== "string" ||
    typeof value.alt !== "string"
  )
    return null;

  const desktopSrc = value.desktopSrc.trim();
  const mobileSrc = value.mobileSrc.trim();
  const alt = value.alt.trim();
  if (!desktopSrc || !mobileSrc || !alt) return null;

  return Object.freeze({ desktopSrc, mobileSrc, alt });
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = reject;
    image.src = src;
  });
}

export async function preloadHeroPair(value, loadImage = preloadImage) {
  const hero = normalizeHeroCandidate(value);
  if (!hero) throw new Error("Invalid hero media.");
  await Promise.all([loadImage(hero.desktopSrc), loadImage(hero.mobileSrc)]);
  return hero;
}

export async function initHero(root) {
  if (!root || typeof root.querySelector !== "function") return false;

  const source = root.querySelector("[data-hero-mobile]");
  const image = root.querySelector("[data-hero-desktop]");
  if (!source || !image) return false;

  try {
    const hero = await preloadHeroPair(await getHero());
    source.srcset = hero.mobileSrc;
    image.src = hero.desktopSrc;
    image.alt = hero.alt;
    return true;
  } catch {
    return false;
  }
}
