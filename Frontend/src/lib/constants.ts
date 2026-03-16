import type { LoginPayload, OrderStatus } from "../types/domain";

export const AUTH_STORAGE_KEY = "refinery-portal-session";

export const DEFAULT_CREDENTIALS: Record<"buyer" | "admin", LoginPayload> = {
  buyer: {
    email: "buyer@gmail.com",
    password: "Password123!",
  },
  admin: {
    email: "admin@gmail.com",
    password: "Password123!",
  },
};

// Procurement currently uses seeded suppliers and does not expose a supplier
// lookup endpoint, so the portal maps the known seeded rows directly.
export const SUPPLIER_OPTIONS = [
  { id: 1, name: "Flexitallic" },
  { id: 2, name: "Flowserve" },
  { id: 3, name: "Emerson" },
  { id: 4, name: "Alfa Laval" },
  { id: 5, name: "DeWalt" },
] as const;

export const CATALOG_CATEGORIES = [
  "Gasket",
  "Valve",
  "Pump",
  "Instrumentation",
  "Heat Exchanger",
  "Hand Tool",
].sort();

export const CATALOG_SORT_OPTIONS = [
  { value: "id", label: "Default" },
  { value: "price_asc", label: "Price Low to High" },
  { value: "price_desc", label: "Price High to Low" },
  { value: "leadTime_asc", label: "Lead Time Low to High" },
  { value: "leadTime_desc", label: "Lead Time High to Low" },
  { value: "supplier_asc", label: "Supplier A to Z" },
] as const;

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "Draft",
  "Submitted",
  "Approved",
  "Rejected",
  "Fulfilled",
];

export const ADMIN_ACTIONS_BY_STATUS: Record<
  OrderStatus,
  Array<"Approved" | "Rejected" | "Fulfilled">
> = {
  Draft: [],
  Submitted: ["Approved", "Rejected"],
  Approved: ["Fulfilled"],
  Rejected: [],
  Fulfilled: [],
};
