export type UserRole = 'guest' | 'customer' | 'admin';

export type ViewTab = 'storefront' | 'admin_dashboard' | 'chapa_gateway_sim';

export type DeviceBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  avatar: string;
  isLoggedIn: boolean;
  isEmailVerified: boolean;
  savedProductIds?: string[];
  savedAddresses?: {
    id: string;
    label: string;
    addressText: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
  }[];
}

export type CategoryId =
  | 'dates_sweets'
  | 'dairy'
  | 'juices'
  | 'rice_grains'
  | 'oils_cooking'
  | 'spices_seasoning'
  | 'canned_pantry'
  | 'sauces_condiments'
  | 'beverages_coffee'
  | 'frozen_foods'
  | 'snacks'
  | 'noodles'
  | (string & {});

export interface Category {
  id: CategoryId;
  name: string;
  arabicName?: string;
  description: string;
  iconName: string;
  image: string;
  sortOrder?: number;
}

export interface Product {
  id: string;
  name: string;
  arabicName?: string;
  categoryId: CategoryId;
  priceETB: number;
  unit: string;
  image: string;
  stockCount: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  description: string;
  origin: string;
  rating: number;
  reviewCount: number;
  isPopular?: boolean;
  isImported: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedAtPrice: number;
  isUnavailableInCart?: boolean;
}

export interface NamedShoppingList {
  id: string;
  name: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  createdAt: string;
}

export type FulfillmentType = 'delivery' | 'pickup';

export type PaymentMethod = 'chapa' | 'cash';

export type PaymentStatus =
  | 'unpaid'
  | 'payment_pending'
  | 'pending_cash'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  currency: 'ETB';
  provider: 'chapa' | 'cash';
  providerTransactionId?: string;
  internalTransactionReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  priceETB: number;
  quantity: number;
  unit: string;
  subtotalETB: number;
}

export interface DeliveryLocation {
  addressText: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: FulfillmentType;
  deliveryLocation?: DeliveryLocation;
  subtotalETB: number;
  deliveryFeeETB: number;
  totalETB: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  chapaTxRef?: string;
  chapaCheckoutUrl?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  notes?: string;
  cancellationReason?: string;
  emailConfirmationToken?: string;
  emailConfirmed?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  orderNumber?: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  photoUrl?: string;
}

export interface ReturnReport {
  id: string;
  orderId?: string;
  orderNumber: string;
  userId?: string;
  userName: string;
  userPhone: string;
  customerEmail?: string;
  reason:
    | 'wrong_item'
    | 'damaged_item'
    | 'spoiled_item'
    | 'missing_item'
    | 'expired_item'
    | 'delivery_delay'
    | 'billing_issue'
    | 'app_feedback'
    | 'other_defect';
  photoUrl?: string;
  notes: string;
  createdAt: string;
  status: 'pending_review' | 'investigating' | 'approved' | 'rejected' | 'resolved';
  adminResolution?: 'refund' | 'replacement' | 'credit' | 'denied' | 'resolved';
  adminResponseNotes?: string;
  requestedResolution?: 'refund' | 'replacement' | 'credit' | 'contact_support';
  affectedItemNames?: string[];
  refundAmountETB?: number;
}

export interface ContactSubmission {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'delivery' | 'payment' | 'products' | 'orders';
}
