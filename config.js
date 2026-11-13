// Point this at your running server. On a physical phone, use your computer's LAN IP
// (e.g. http://192.168.1.20:4000) instead of localhost.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

// Fallback values used when the API is unreachable (keeps the app usable offline / in demos).
// Placeholder coordinates near West Broadway, Louisville — replace with the store's real location.
export const STORE = {
  name: 'Louisville Community Grocery',
  lat: 38.2467,
  lng: -85.787,
};
export const DELIVERY_RADIUS_MILES = 10;
