import { mockContent } from "./mock-content.mjs";

const SAFE_MESSAGES = {
  VALIDATION_ERROR: "Invalid content request.",
  FETCH_FAILED: "Content is temporarily unavailable.",
};

class ContentApiError extends Error {
  constructor(code) {
    super(SAFE_MESSAGES[code]);
    this.name = "ContentApiError";
    this.code = code;
  }
}

function fail(code) {
  throw new ContentApiError(code);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSafePath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.split("/").includes("..") &&
    !/^[a-z][a-z\d+.-]*:/i.test(value)
  );
}

function isValidText(value) {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    value.length >= 5 &&
    value.length <= 160
  );
}

function timestamp(value) {
  const parsed = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareRows(left, right) {
  const order = Number(left.sort_order) - Number(right.sort_order);
  if (order !== 0) return order;

  const created = timestamp(left.created_at) - timestamp(right.created_at);
  if (created !== 0) return created;

  return String(left.id).localeCompare(String(right.id));
}

function parseNow(value) {
  if (value === undefined) return Date.now();
  if (
    !(value instanceof Date) &&
    typeof value !== "string" &&
    typeof value !== "number"
  )
    fail("VALIDATION_ERROR");
  const parsed = value instanceof Date ? value.getTime() : timestamp(value);
  if (!Number.isFinite(parsed)) fail("VALIDATION_ERROR");
  return parsed;
}

function parseLimit(value) {
  if (value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value))
    fail("VALIDATION_ERROR");
  return Math.max(0, Math.trunc(value));
}

function validBaseRow(row) {
  return (
    isRecord(row) &&
    typeof row.id === "string" &&
    Number.isFinite(Number(row.sort_order)) &&
    timestamp(row.created_at) !== null
  );
}

function normalizeHero(hero) {
  if (
    !isRecord(hero) ||
    !isSafePath(hero.desktop_path) ||
    !isSafePath(hero.mobile_path) ||
    !isValidText(hero.alt_text)
  ) {
    fail("FETCH_FAILED");
  }
  return {
    desktopSrc: hero.desktop_path,
    mobileSrc: hero.mobile_path,
    alt: hero.alt_text,
  };
}

function normalizePromotion(row, now) {
  if (
    !validBaseRow(row) ||
    row.status !== "published" ||
    !isSafePath(row.storage_path) ||
    !isValidText(row.alt_text)
  )
    return null;
  const startsAt = row.starts_at === null ? null : timestamp(row.starts_at);
  const endsAt = row.ends_at === null ? null : timestamp(row.ends_at);
  if (
    (row.starts_at !== null && startsAt === null) ||
    (row.ends_at !== null && endsAt === null)
  )
    return null;
  if (
    (startsAt !== null && startsAt > now) ||
    (endsAt !== null && now >= endsAt)
  )
    return null;
  return { id: row.id, src: row.storage_path, alt: row.alt_text };
}

function normalizeProduct(row) {
  if (!validBaseRow(row) || row.status !== "published" || !isRecord(row.image))
    return null;

  const image = row.image;
  if (!isSafePath(image.storage_path) || !isValidText(image.alt_text))
    return null;

  return {
    id: row.id,
    image: { src: image.storage_path, alt: image.alt_text },
  };
}

export function createMockContentAdapter(content) {
  return {
    async getHero() {
      if (!isRecord(content)) fail("FETCH_FAILED");
      return normalizeHero(content.hero);
    },

    async getPromotions({ now } = {}) {
      if (!isRecord(content) || !Array.isArray(content.promotions))
        fail("FETCH_FAILED");
      const currentTime = parseNow(now);
      return [...content.promotions]
        .sort(compareRows)
        .map((row) => normalizePromotion(row, currentTime))
        .filter(Boolean);
    },

    async getProducts({ limit } = {}) {
      if (!isRecord(content) || !Array.isArray(content.products))
        fail("FETCH_FAILED");
      const count = parseLimit(limit);
      const products = [...content.products]
        .sort(compareRows)
        .map(normalizeProduct)
        .filter(Boolean);
      return count === null ? products : products.slice(0, count);
    },
  };
}

export const mockContentAdapter = createMockContentAdapter(mockContent);
