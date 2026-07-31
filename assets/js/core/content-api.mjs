import { mockContentAdapter } from "../data/mock-content-adapter.mjs";

export const getHero = (...args) => mockContentAdapter.getHero(...args);
export const getPromotions = (...args) =>
  mockContentAdapter.getPromotions(...args);
export const getProducts = (...args) => mockContentAdapter.getProducts(...args);
