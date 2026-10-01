export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  colors: string[];
  image_url: string;
  /** Pieces left. 0 = sold out */
  stock: number;
};

export type CartItem = {
  /** DB row id for signed-in users, or a local key for guests */
  key: string;
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string;
  size: string;
  color: string;
  quantity: number;
  /** Pieces left (known for signed-in carts) */
  stock?: number;
};

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_reference: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  state: string;
  paid_at: string | null;
  email_sent_at: string | null;
  created_at: string;
  order_items: OrderItem[];
};
