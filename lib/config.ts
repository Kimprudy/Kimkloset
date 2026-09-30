export const STORE_NAME = 'Kimkloset';
export const STORE_TAGLINE = 'Online Fashion Store';
export const INSTAGRAM_URL = 'https://www.instagram.com/kimklosetng';
export const INSTAGRAM_HANDLE = '@kimklosetng';

// Flat delivery fee in Naira. Change this to whatever you charge.
export const SHIPPING_FEE = 3000;
export const CURRENCY = 'NGN';
export const MAX_QTY = 10;

export const CATEGORIES = ['Dresses', 'Tops', 'Outerwear', 'Shapewear'] as const;

export const NIGERIAN_STATES = [
  'Abia', 'Abuja (FCT)', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
  'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}
