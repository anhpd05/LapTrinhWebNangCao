import { GENERATOR_VERSION } from '../data/generateProducts';
import type { Product } from '../types/product';

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const encoder = new TextEncoder();

export interface ChecksumMeta {
  n: number;
  seed: number;
}

/**
 */
export function checksum(products: readonly Product[], meta: ChecksumMeta): string {
  let hash = FNV_OFFSET_BASIS;

  const feed = (text: string) => {
    const bytes = encoder.encode(text);
    for (let i = 0; i < bytes.length; i++) {
      hash ^= bytes[i];
      hash = Math.imul(hash, FNV_PRIME);
    }
  };

  feed(`${meta.n}|${meta.seed}|${GENERATOR_VERSION}\n`);
  for (const p of products) {
    feed(`${p.id}|${p.name}|${p.category}|${p.price}|${p.stock}|${p.createdAt}\n`);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}
