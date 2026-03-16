export type UserRole = "Admin" | "Buyer";

export type OrderStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Rejected"
  | "Fulfilled";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface ApiEnvelope<T> {
  responseCode: number;
  message: string;
  data: T;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  supplier: string;
  manufacturer: string;
  model: string;
  description?: string;
  priceUsd: number;
  leadTimeDays: number;
  inStock: boolean;
  specs?: Record<string, string>;
  compatibleWith?: string[];
}

export interface CatalogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CatalogListResponse {
  items: CatalogItem[];
  pagination: CatalogPagination;
}

export interface OrderItem {
  id: number;
  poId: number;
  catalogItemId: string;
  quantity: number;
  itemName: string | null;
  itemPriceUsd: number | null;
  itemLeadTimeDays: number | null;
  createdAt: string;
}

export interface OrderTimelineEntry {
  id: number;
  poId: number;
  status: OrderStatus;
  createdAt: string;
  createdBy: number | null;
}

export interface OrderSummary {
  id: number;
  poNumber: string | null;
  costCenter: string | null;
  neededBy: string | null;
  paymentTerms: string | null;
  supplier: string | null;
  status: OrderStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number | null;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderListResponse {
  data: OrderSummary[];
  pagination: OrderPagination;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[];
  timeline: OrderTimelineEntry[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateOrderPayload {
  orderStatusId: 1;
  supplierId: number;
  cost_center?: string;
  needed_by?: string | null;
  payment_terms?: string;
}

export interface AddOrderItemPayload {
  catalogItemId: string;
  quantity: number;
}

export interface UpdateOrderItemPayload {
  quantity: number;
}

export interface TransitionOrderPayload {
  status: Extract<OrderStatus, "Approved" | "Rejected" | "Fulfilled">;
}
