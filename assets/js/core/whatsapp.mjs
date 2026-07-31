import { CONTACTS } from "./contacts.mjs";

const INTENTS = Object.freeze({
  GENERAL: Object.freeze({
    contact: CONTACTS.OWNER,
    template:
      "Halo New Sobat Komputer, saya mendapatkan informasi dari website.",
  }),
  SERVICE: Object.freeze({
    contact: CONTACTS.OWNER,
    template: "Halo New Sobat Komputer, saya ingin menanyakan layanan servis.",
  }),
  PRODUCT: Object.freeze({
    contact: CONTACTS.ADMIN_2,
    template:
      "Halo New Sobat Komputer, saya ingin menanyakan produk yang tersedia.",
  }),
  PROMO: Object.freeze({
    contact: CONTACTS.ADMIN_2,
    template: "Halo New Sobat Komputer, saya mau tanya detail promo terbaru.",
  }),
  LOCATION: Object.freeze({
    contact: CONTACTS.OWNER,
    template: "Halo New Sobat Komputer, saya ingin menanyakan lokasi toko.",
  }),
});

function validationError() {
  const error = new Error("Invalid WhatsApp request.");
  error.name = "WhatsAppUrlError";
  error.code = "VALIDATION_ERROR";
  return error;
}

export function buildWhatsAppUrl({ intent } = {}) {
  if (typeof intent !== "string") throw validationError();
  const key = intent.toUpperCase();
  if (!INTENTS[key]) throw validationError();

  const config = INTENTS[key];
  return `https://wa.me/${config.contact}?text=${encodeURIComponent(config.template)}`;
}
