const EARTH_RADIUS_MILES = 3958.8;
const toRad = (d) => (d * Math.PI) / 180;

export function distanceMiles(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

export function deliveryFeeCents(miles) {
  if (miles <= 3) return 0;
  if (miles <= 6) return 299;
  return 499;
}
