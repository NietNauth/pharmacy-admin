export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type PaginatedResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type UserRole = 'customer' | 'pharmacist' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'momo' | 'vnpay' | 'zalopay';
export type PrescriptionStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  branch?: { id: string; name: string };
  created_at: string;
}

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  icon_url?: string;
  is_active: boolean;
  is_featured: boolean;
  show_on_home: boolean;
  display_order: number;
}

export interface Brand {
  id: string;
  name: string;
  country_of_origin?: string;
  logo_url?: string;
  is_active: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  lat?: number;
  lng?: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  requires_prescription: boolean;
  status: ProductStatus;
  base_price: number;
  sale_price?: number;
  current_price: number;
  unit: string;
  dosage_form?: string;
  active_ingredient?: string;
  category: { id: string; name: string };
  brand?: { id: string; name: string };
  primary_image?: string;
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface ProductImage {
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductDetail extends Product {
  usage: string;
  notes: string;
  manufacturer: string;
  attributes: ProductAttribute[];
  images: ProductImage[];
  total_stock: number;
}

export interface OrderItem {
  id: string;
  product: { id: string; name: string; slug: string; primary_image?: string };
  quantity: number;
  unit_price: number;
  subtotal: number;
  prescription_id?: string;
}

export interface OrderHistory {
  id: string;
  status: OrderStatus;
  note?: string;
  actor_id?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  status: OrderStatus;
  delivery_type: 'pickup' | 'standard' | 'express';
  total: number;
  items_count: number;
  created_at: string;
  updated_at: string;
  user?: { id: string; full_name: string; email: string };
  payment?: { 
    method: PaymentMethod; 
    status: PaymentStatus;
    transaction_id?: string;
    paid_at?: string;
  };
  branch: { id: string; name: string };
}

export interface OrderDetail extends Order {
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  delivery_address: string;
  recipient_name: string;
  recipient_phone: string;
  note?: string;
  items: OrderItem[];
  histories: OrderHistory[];
  coupon?: string;
}

export interface Inventory {
  id: string;
  product: { id: string; name: string; sku: string; dosage_form?: string };
  branch: { id: string; name: string; city: string };
  quantity_available: number;
  quantity_reserved: number;
  quantity_minimum: number;
  expiry_date?: string;
  is_low_stock: boolean;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  inventory_id: string;
  actor: { id: string; full_name: string };
  action_type: 'restock' | 'sale' | 'adjustment' | 'reserved' | 'released' | 'expired_removal';
  quantity_delta: number;
  quantity_after: number;
  note?: string;
  ref_order_id?: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  user: { id: string; full_name: string; email: string };
  doctor_name?: string;
  hospital?: string;
  issued_date?: string;
  expires_date?: string;
  image_url: string;
  status: PrescriptionStatus;
  reject_reason?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ReviewImage {
  url: string;
}

export interface ProductQa {
  id: string;
  user: { id: string; full_name: string };
  product?: { id: string; name: string; slug: string; primary_image?: string };
  body?: string;
  is_verified_purchase: boolean;
  is_visible: boolean;
  helpful_count: number;
  admin_reply?: string;
  admin_replied_at?: string;
  images: string[];
  created_at: string;
  user_voted?: boolean;
}

export interface DashboardRecentOrder {
  id: string;
  order_code: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  user?: { id: string; full_name: string; email: string };
}

export interface DashboardStats {
  orders: {
    total: number;
    today: number;
    pending: number;
  };
  prescriptions: {
    pending: number;
  };
  products: {
    total_active: number;
    low_stock: number;
  };
  users: {
    total_customers: number;
    new_today: number;
  };
  recent_orders: DashboardRecentOrder[];
}

export interface AnalyticsTopProduct {
  product_id: string;
  total_quantity: number;
  total_revenue: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price: number;
    unit: string;
    primary_image?: string;
  };
}

export interface AnalyticsChartData {
  label: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsStats {
  sales: {
    total_orders: number;
    total_revenue: number;
    total_products_sold: number;
  };
  chart_data: AnalyticsChartData[];
  top_products: AnalyticsTopProduct[];
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface FilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  type: string;
  data: {
    title: string;
    body: string;
    link?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  };
  read_at: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export type ChatMessage = {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'customer' | 'pharmacist' | 'admin'
  body: string
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    full_name: string
    role: string
  }
}

export type Conversation = {
  id: string
  user_id: string
  pharmacist_id: string | null
  status: 'open' | 'closed'
  last_message: string | null
  last_message_at: string | null
  created_at: string
  user?: {
    id: string
    full_name: string
  }
}
