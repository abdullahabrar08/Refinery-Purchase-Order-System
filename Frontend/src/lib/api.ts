import type {
  AddOrderItemPayload,
  ApiEnvelope,
  AuthSession,
  CatalogListResponse,
  CreateOrderPayload,
  LoginPayload,
  OrderDetail,
  OrderListResponse,
  OrderStatus,
  OrderSummary,
  TransitionOrderPayload,
  UpdateOrderItemPayload,
} from "../types/domain";

const API_BASE_URLS = {
  auth: import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:4001/users",
  catalog: import.meta.env.VITE_CATALOG_API_URL ?? "http://localhost:4002/catalog",
  procurement:
    import.meta.env.VITE_PROCUREMENT_API_URL ?? "http://localhost:4003/procurement",
} as const;

interface RequestOptions extends Omit<RequestInit, "body"> {
  token?: string;
  body?: unknown;
}

export interface CatalogFilters {
  search?: string;
  category?: string;
  inStock?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { token, body, headers, ...rest } = options;
  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { message?: string; error?: string }
    | null;

  if (!response.ok) {
    const message =
      payload && "message" in payload && payload.message
        ? payload.message
        : "Request failed";
    throw new Error(message);
  }

  if (payload && "data" in payload) {
    return payload.data;
  }

  return payload as T;
}

export const ApiClient = {
  login(payload: LoginPayload) {
    return request<AuthSession>(`${API_BASE_URLS.auth}/login`, {
      method: "POST",
      body: payload,
    });
  },

  getUsers(token: string) {
    return request<{ id: number; username: string; email: string; role: string; roleId: number }[]>(
      `${API_BASE_URLS.auth}`,
      { 
        method: "GET",
        token 
      }
    );
  },

  getUser(token: string, userId: number) {
    return request<{ id: number; username: string; email: string; role: string; roleId: number }>(
      `${API_BASE_URLS.auth}/${userId}`,
      { 
        method: "GET",
        token 
      }
    );
  },

  getCatalogItems(token: string, filters: CatalogFilters) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });

    return request<CatalogListResponse>(
      `${API_BASE_URLS.catalog}/items?${params.toString()}`,
      {
        token,
      },
    );
  },

  getOrders(token: string, status?: OrderStatus, excludeStatus?: OrderStatus, page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (excludeStatus) params.set("excludeStatus", excludeStatus);
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));

    const url = `${API_BASE_URLS.procurement}/orders?${params.toString()}`;

    return request<OrderListResponse>(url, { token });
  },

  getOrder(token: string, orderId: number) {
    return request<OrderDetail>(`${API_BASE_URLS.procurement}/orders/${orderId}`, {
      token,
    });
  },

  createOrder(token: string, payload: CreateOrderPayload) {
    return request<OrderSummary>(`${API_BASE_URLS.procurement}/orders`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  deleteOrder(token: string, orderId: number) {
    return request<{ deleted: true }>(
      `${API_BASE_URLS.procurement}/orders/${orderId}`,
      {
        method: "DELETE",
        token,
      },
    );
  },

  addOrderItem(token: string, orderId: number, payload: AddOrderItemPayload) {
    return request(`${API_BASE_URLS.procurement}/orders/${orderId}/items`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateOrderItem(
    token: string,
    orderId: number,
    orderItemId: number,
    payload: UpdateOrderItemPayload,
  ) {
    return request(
      `${API_BASE_URLS.procurement}/orders/${orderId}/items/${orderItemId}`,
      {
        method: "PATCH",
        token,
        body: payload,
      },
    );
  },

  removeOrderItem(token: string, orderId: number, orderItemId: number) {
    return request(
      `${API_BASE_URLS.procurement}/orders/${orderId}/items/${orderItemId}`,
      {
        method: "DELETE",
        token,
      },
    );
  },

  submitOrder(token: string, orderId: number) {
    return request<OrderDetail>(
      `${API_BASE_URLS.procurement}/orders/${orderId}/submit`,
      {
        method: "POST",
        token,
      },
    );
  },

  transitionOrder(
    token: string,
    orderId: number,
    payload: TransitionOrderPayload,
  ) {
    return request<OrderSummary>(
      `${API_BASE_URLS.procurement}/orders/${orderId}/status`,
      {
        method: "POST",
        token,
        body: payload,
      },
    );
  },
};
