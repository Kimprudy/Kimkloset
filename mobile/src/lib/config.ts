// Same values as the website's lib/config.ts
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://kimkloset.vercel.app').replace(/\/$/, '');

export const SHIPPING_FEE = 3000;
export const MAX_QTY = 10;
export const LOW_STOCK = 5;

export const CATEGORIES = ['Dresses', 'Tops', 'Sets', 'Jumpsuits', 'Outerwear', 'Shapewear'] as const;

export const NIGERIAN_STATES = [
  'Abia', 'Abuja (FCT)', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
  'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

/** Product images are stored as /products/x.jpg on the website. */
export function imageUrl(path: string | null | undefined) {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}
