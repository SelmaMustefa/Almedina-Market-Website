import { ALMADINA_SHOP_LOCATION } from '../data/mockData';

/**
 * Calculates straight-line distance in kilometres using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number = ALMADINA_SHOP_LOCATION.latitude,
  lon2: number = ALMADINA_SHOP_LOCATION.longitude
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place
}

/**
 * Delivery cost formula:
 * 50 ETB base fee + distance in km * 15 ETB
 */
export function calculateDeliveryFeeETB(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  const fee = ALMADINA_SHOP_LOCATION.baseDeliveryFeeETB + distanceKm * ALMADINA_SHOP_LOCATION.perKmFeeETB;
  return Math.round(fee);
}

/**
 * Formats price in Ethiopian Birr (Br) currency
 */
export function formatETB(amount: number): string {
  return `${(amount || 0).toLocaleString('en-US')} Br`;
}

export function formatBr(amount: number): string {
  return `${(amount || 0).toLocaleString('en-US')} Br`;
}

/**
 * Formats ISO date string to user friendly local display
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Checks if order is from today's calendar date
 */
export function isSameCalendarDay(isoString: string): boolean {
  try {
    const orderDate = new Date(isoString);
    const today = new Date();
    return (
      orderDate.getFullYear() === today.getFullYear() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

/**
 * Checks if order is within the allowed return policy window (defaults to 48 hours for customer convenience)
 */
export function isWithinReturnWindow(isoString: string, maxHours: number = 48): boolean {
  try {
    const orderDate = new Date(isoString).getTime();
    if (isNaN(orderDate)) return true;
    const now = Date.now();
    const diffHours = (now - orderDate) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= maxHours;
  } catch {
    return true;
  }
}
