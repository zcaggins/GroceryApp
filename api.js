import { API_URL, STORE, DELIVERY_RADIUS_MILES } from './config';
import { FALLBACK_INVENTORY } from './data/inventory';

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** Returns { products, offline } — falls back to bundled sample inventory if the API is down. */
export async function fetchInventory() {
  try {
    return { products: await request('/api/products'), offline: false };
  } catch {
    return { products: FALLBACK_INVENTORY, offline: true };
  }
}

export async function fetchDeliveryZone() {
  try {
    return await request('/api/delivery/zone');
  } catch {
    return { store: STORE, radiusMiles: DELIVERY_RADIUS_MILES };
  }
}

export const placeOrder = (order) =>
  request('/api/orders', { method: 'POST', body: JSON.stringify(order) });

export const submitInvolvement = (signup) =>
  request('/api/involvement', { method: 'POST', body: JSON.stringify(signup) });
