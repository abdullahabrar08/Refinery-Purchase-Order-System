import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../hooks/useAuth";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { ApiClient } from "../lib/api";
import {
  CATALOG_CATEGORIES,
  CATALOG_SORT_OPTIONS,
  SUPPLIER_OPTIONS,
} from "../lib/constants";
import type { CreateOrderPayload } from "../types/domain";

function formatCurrency(value: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export function BuyerPortalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.token ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSearchTransitionPending] = useTransition();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Auto-hide feedback message after 10 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);
  
  // View toggle: 'catalog' | 'create' | 'review' | 'orders'
  const [activeView, setActiveView] = useState<'catalog' | 'create' | 'review' | 'orders'>('catalog');

  const [orderForm, setOrderForm] = useState<CreateOrderPayload>({
    orderStatusId: 1,
    supplierId: 1,
    cost_center: "",
    needed_by: "",
    payment_terms: "",
  });
  
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const selectedCategory = searchParams.get("category") ?? "";
  const selectedStock = searchParams.get("inStock") ?? "";
  const selectedSort = searchParams.get("sort") ?? "id";
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);

  useEffect(() => {
    if ((searchParams.get("search") ?? "") === debouncedSearch) return;
    const nextParams = new URLSearchParams(searchParams);
    if (debouncedSearch) nextParams.set("search", debouncedSearch);
    else nextParams.delete("search");
    nextParams.set("page", "1");
    setSearchParams(nextParams, { replace: true });
  }, [debouncedSearch, searchParams, setSearchParams]);

  const catalogQuery = useQuery({
    queryKey: ["catalog", token, searchParams.toString()],
    enabled: Boolean(token),
    queryFn: async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      return ApiClient.getCatalogItems(token, {
        search: searchParams.get("search") ?? undefined,
        category: selectedCategory || undefined,
        inStock: selectedStock || undefined,
        sort: selectedSort,
        page: currentPage,
        limit: 10,
      });
    },
  });

  const [currentOrdersPage, setCurrentOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 10;

  const ordersQuery = useQuery({
    queryKey: ["buyer-orders", token, currentOrdersPage],
    enabled: Boolean(token),
    queryFn: () => ApiClient.getOrders(token, undefined, "Draft", currentOrdersPage, ORDERS_PER_PAGE),
  });

  const draftOrderQuery = useQuery({
    queryKey: ["buyer-draft", token],
    enabled: Boolean(token),
    queryFn: () => ApiClient.getOrders(token, "Draft", undefined, 1, 1),
  });

  const submittedOrders = useMemo(
    () => ordersQuery.data?.data ?? [],
    [ordersQuery.data]
  );

  const paginatedOrders = submittedOrders;
  const totalOrdersPages = ordersQuery.data?.pagination.totalPages ?? 1;

  const draftOrder = useMemo(
    () => draftOrderQuery.data?.data?.[0] ?? null,
    [draftOrderQuery.data],
  );

  const draftOrderDetailQuery = useQuery({
    queryKey: ["buyer-draft-order", token, draftOrder?.id],
    enabled: Boolean(token && draftOrder?.id),
    queryFn: () => ApiClient.getOrder(token, draftOrder!.id),
  });

  const createOrderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => ApiClient.createOrder(token, payload),
    onSuccess: async () => {
      setFeedbackMessage(`Draft order created successfully.`);
      await queryClient.invalidateQueries({ queryKey: ["buyer-orders", token] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft", token] });
      setActiveView('catalog');
    },
    onError: (error) => {
      setFeedbackMessage(error instanceof Error ? error.message : "Unable to create order.");
    },
  });

  const addOrderItemMutation = useMutation({
    mutationFn: ({ orderId, catalogItemId }: { orderId: number; catalogItemId: string }) =>
      ApiClient.addOrderItem(token, orderId, { catalogItemId, quantity: 1 }),
    onSuccess: async () => {
      setFeedbackMessage("Order item added.");
      await queryClient.invalidateQueries({ queryKey: ["buyer-orders", token] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft", token] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft-order", token, draftOrder?.id] });
    },
    onError: (error) => {
      setFeedbackMessage(error instanceof Error ? error.message : "Unable to add item.");
    },
  });

  const updateOrderItemMutation = useMutation({
    mutationFn: ({ orderId, orderItemId, quantity }: { orderId: number; orderItemId: number; quantity: number; }) => 
      ApiClient.updateOrderItem(token, orderId, orderItemId, { quantity }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft-order", token, draftOrder?.id] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-orders", token] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft", token] });
    },
  });

  const removeOrderItemMutation = useMutation({
    mutationFn: ({ orderId, orderItemId }: { orderId: number; orderItemId: number }) =>
      ApiClient.removeOrderItem(token, orderId, orderItemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft-order", token, draftOrder?.id] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-orders", token] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft", token] });
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: (orderId: number) => ApiClient.deleteOrder(token, orderId),
    onSuccess: async () => {
      setFeedbackMessage("Draft deleted.");
      await queryClient.invalidateQueries({ queryKey: ["buyer-orders", token] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft", token] });
      setActiveView('catalog');
    },
  });

  const submitOrderMutation = useMutation({
    mutationFn: (orderId: number) => ApiClient.submitOrder(token, orderId),
    onSuccess: async (order) => {
      setFeedbackMessage(`Order ${order.poNumber ?? order.id} submitted successfully.`);
      await queryClient.invalidateQueries({ queryKey: ["buyer-orders", token] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft", token] });
      await queryClient.invalidateQueries({ queryKey: ["buyer-draft-order", token, draftOrder?.id] });
      setActiveView('orders');
    },
    onError: (error) => {
      setFeedbackMessage(error instanceof Error ? error.message : "Unable to submit order.");
    },
  });

  const activeOrder = draftOrderDetailQuery.data;

  const handleFilterChange = (key: "category" | "inStock" | "sort", value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    nextParams.set("page", "1");
    setSearchParams(nextParams, { replace: true });
  };

  const handleCreateOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackMessage(null);
    createOrderMutation.mutate(orderForm);
  };

  const getItemActionState = (itemSupplier: string, itemId: string) => {
    if (!activeOrder) return { disabled: true, label: "Create Draft First", reason: "no_draft" };
    if (activeOrder.supplier !== itemSupplier) return { disabled: true, label: "Supplier Mismatch", reason: "mismatch" };
    
    const isAlreadyAdded = activeOrder.items.some(i => i.catalogItemId === itemId);
    if (isAlreadyAdded) return { disabled: true, label: "Added to PO", reason: "added" };
    
    return { disabled: false, label: "Add to PO", reason: "ok" };
  };

  return (
    <AppShell>
      {/* Sub-navigation */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-primary/20 mb-6">
        <button 
          className={`pb-2 text-sm font-bold transition-colors ${activeView === 'catalog' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          onClick={() => setActiveView('catalog')}
        >
          Catalog
        </button>
        <button 
          className={`pb-2 text-sm font-bold transition-colors ${activeView === 'create' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          onClick={() => setActiveView('create')}
        >
          Create Draft
        </button>
        {draftOrder && (
          <button 
            className={`pb-2 text-sm font-bold transition-colors ${activeView === 'review' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            onClick={() => setActiveView('review')}
          >
            Review Draft
          </button>
        )}
        <button 
          className={`pb-2 text-sm font-bold transition-colors ${activeView === 'orders' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          onClick={() => setActiveView('orders')}
        >
          My Orders
        </button>
      </div>

      {feedbackMessage && (
        <div className="p-4 mb-6 bg-primary/10 border border-primary/30 rounded-xl text-primary font-medium flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          {feedbackMessage}
        </div>
      )}

      {/* CATALOG VIEW */}
      {activeView === 'catalog' && (
        <div className="flex flex-col gap-6">
          {draftOrder && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex gap-4 items-center">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-3xl">lock</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-slate-900 dark:text-slate-100 text-base font-bold leading-tight">Locked to Supplier: {draftOrder.supplier}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal mt-1">
                    Your draft purchase order restricts items to <strong>{draftOrder.supplier}</strong> to ensure compliance.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setActiveView('review')}
                  className="flex-1 md:flex-none px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  View Draft PO <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                <button 
                  onClick={() => deleteDraftMutation.mutate(draftOrder.id)}
                  className="flex-1 md:flex-none px-4 py-2 text-sm font-bold border border-primary text-primary rounded-lg hover:bg-primary/10 transition-all"
                >
                  Clear Draft
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input 
                  className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm" 
                  placeholder="Search by name, item ID, supplier, manufacturer..." 
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-4 flex gap-2">
              <div className="relative flex-1">
                <select 
                  className="appearance-none w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-primary/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  value={selectedSort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                >
                  {CATALOG_SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select 
              className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary appearance-none pr-8"
              value={selectedCategory}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="">Category: All</option>
              {CATALOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-primary/10 rounded-full">
              <span className="text-xs font-semibold">In-Stock Only</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={selectedStock === "true"}
                  onChange={(e) => handleFilterChange("inStock", e.target.checked ? "true" : "")}
                />
                <div className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
            <span className="text-xs text-slate-500 ml-auto">
              Showing {catalogQuery.data?.items.length || 0} of {catalogQuery.data?.pagination.total || 0} items
            </span>
          </div>

          {catalogQuery.isLoading || isSearchTransitionPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-primary/10 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden h-64">
                  <div className="loading-shimmer absolute inset-0 pointer-events-none"></div>
                </div>
              ))}
            </div>
          ) : catalogQuery.data?.items.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogQuery.data.items.map((item) => {
                const action = getItemActionState(item.supplier, item.id);
                const isMismatch = action.reason === "mismatch";
                const noDraft = action.reason === "no_draft";
                const isAdded = action.reason === "added";

                return (
                  <div key={item.id} className={`bg-white dark:bg-slate-800/40 border-2 ${isMismatch ? 'border-slate-200 dark:border-slate-800 opacity-75 grayscale-[0.5]' : 'border-primary/40'} rounded-xl p-5 flex flex-col gap-4 relative`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${item.inStock ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {item.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                        <h3 className="text-base font-bold mt-2 leading-tight">{item.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ID: {item.id}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isMismatch ? 'text-slate-400' : 'text-primary'}`}>{formatCurrency(item.priceUsd)}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Per Unit</p>
                      </div>
                    </div>
                    <div className={`grid grid-cols-2 gap-y-2 border-y ${isMismatch ? 'border-slate-100 dark:border-slate-800' : 'border-slate-100 dark:border-primary/10'} py-3`}>
                      <div className="text-[11px]">
                        <p className="text-slate-400 uppercase font-medium">Manufacturer</p>
                        <p className="font-semibold">{item.manufacturer}</p>
                      </div>
                      <div className="text-[11px]">
                        <p className="text-slate-400 uppercase font-medium">Model</p>
                        <p className="font-semibold">{item.model}</p>
                      </div>
                      <div className="text-[11px]">
                        <p className="text-slate-400 uppercase font-medium">Lead Time</p>
                        <p className="font-semibold">{item.leadTimeDays} Days</p>
                      </div>
                      <div className="text-[11px]">
                        <p className="text-slate-400 uppercase font-medium">Supplier</p>
                        <p className="font-semibold">{item.supplier}</p>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      {noDraft ? (
                        <button 
                          onClick={() => setActiveView('create')}
                          className="w-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          Create Draft First
                        </button>
                      ) : isMismatch ? (
                        <div className="relative group/tooltip">
                          <button className="w-full bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold py-2 rounded-lg text-sm cursor-not-allowed flex items-center justify-center gap-2" disabled>
                            <span className="material-symbols-outlined text-sm">lock_reset</span>
                            Supplier Mismatch
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl text-center z-10 border border-primary/30">
                            <span className="text-primary font-bold">Supplier Mismatch</span><br/>
                            Item from different supplier than draft.
                          </div>
                        </div>
                      ) : isAdded ? (
                        <button 
                          disabled
                          className="w-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Added to PO
                        </button>
                      ) : (
                        <button 
                          onClick={() => draftOrder && addOrderItemMutation.mutate({ orderId: draftOrder.id, catalogItemId: item.id })}
                          disabled={addOrderItemMutation.isPending}
                          className="w-full bg-primary text-white font-bold py-2 rounded-lg text-sm hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                          Add to PO
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">No items found matching your criteria.</div>
          )}

          {catalogQuery.data?.pagination && catalogQuery.data.pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 pb-12">
              <button 
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set("page", String(Math.max(1, currentPage - 1)));
                  setSearchParams(nextParams);
                }}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-primary/20 text-slate-500 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {Array.from({ length: catalogQuery.data.pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button 
                  key={p}
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set("page", String(p));
                    setSearchParams(nextParams);
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg ${p === currentPage ? 'bg-primary text-white font-bold' : 'border border-slate-200 dark:border-primary/20 text-slate-500 hover:border-primary hover:text-primary transition-all'}`}
                >
                  {p}
                </button>
              ))}

              <button 
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set("page", String(Math.min(catalogQuery.data.pagination.totalPages, currentPage + 1)));
                  setSearchParams(nextParams);
                }}
                disabled={currentPage === catalogQuery.data.pagination.totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-primary/20 text-slate-500 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREATE DRAFT VIEW */}
      {activeView === 'create' && (
        <div className="max-w-3xl mx-auto w-full">
          {draftOrder ? (
             <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
                 <span className="material-symbols-outlined text-3xl">warning</span>
               </div>
               <h2 className="text-xl font-bold mb-2">Draft Already Exists</h2>
               <p className="text-slate-500 mb-6">You already have an open draft order. You can only have one draft at a time.</p>
               <div className="flex justify-center gap-4">
                 <button onClick={() => setActiveView('review')} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                   View Current Draft
                 </button>
                 <button onClick={() => deleteDraftMutation.mutate(draftOrder.id)} className="px-6 py-2 border border-red-200 text-red-500 font-bold rounded-lg hover:bg-red-50 transition-colors">
                   Delete Draft
                 </button>
               </div>
             </div>
          ) : (
            <section className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-slate-900 dark:text-white text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings_applications</span>
                Order Configuration
              </h2>
              <form className="space-y-6" onSubmit={handleCreateOrder}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Supplier</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <span className="material-symbols-outlined text-sm">factory</span>
                    </span>
                    <select 
                      className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary appearance-none"
                      value={orderForm.supplierId}
                      onChange={(e) => setOrderForm(c => ({ ...c, supplierId: Number(e.target.value) }))}
                    >
                      {SUPPLIER_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <p className="text-xs text-slate-500">Note: Once created, the draft will be locked to this supplier.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cost Center</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                      </span>
                      <input 
                        className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
                        placeholder="e.g. CC-1234"
                        value={orderForm.cost_center ?? ""}
                        onChange={(e) => setOrderForm(c => ({ ...c, cost_center: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Terms</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <span className="material-symbols-outlined text-sm">payments</span>
                      </span>
                      <input 
                        className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
                        placeholder="e.g. Net 30"
                        value={orderForm.payment_terms ?? ""}
                        onChange={(e) => setOrderForm(c => ({ ...c, payment_terms: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Needed-by Date</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                    </span>
                    <input 
                      className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={orderForm.needed_by ?? ""}
                      onChange={(e) => setOrderForm(c => ({ ...c, needed_by: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                  >
                    {createOrderMutation.isPending ? "Creating..." : "Create Draft"}
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      )}

      {/* REVIEW DRAFT VIEW */}
      {activeView === 'review' && activeOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-primary/20 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Line Items</h3>
                <button onClick={() => setActiveView('catalog')} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Add Item
                </button>
              </div>
              
              {activeOrder.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-primary/5">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Qty</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Unit Price</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Total</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-primary/10">
                      {activeOrder.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-5">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{item.itemName || item.catalogItemId}</p>
                            <p className="text-xs text-slate-400">ID: {item.catalogItemId}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <input 
                              type="number" 
                              min={1} 
                              defaultValue={item.quantity}
                              onBlur={(e) => updateOrderItemMutation.mutate({ orderId: activeOrder.id, orderItemId: item.id, quantity: Number(e.target.value) })}
                              className="w-16 text-center bg-transparent border border-slate-300 dark:border-slate-700 rounded-md py-1 text-sm focus:ring-primary focus:border-primary"
                            />
                          </td>
                          <td className="px-6 py-5 text-right text-slate-700 dark:text-slate-300">{formatCurrency(item.itemPriceUsd)}</td>
                          <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">{formatCurrency((item.itemPriceUsd ?? 0) * item.quantity)}</td>
                          <td className="px-6 py-5 text-center">
                            <button 
                              onClick={() => removeOrderItemMutation.mutate({ orderId: activeOrder.id, orderItemId: item.id })}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors" 
                              title="Remove"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No items in draft. Go to the catalog to add items.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl p-6 shadow-sm">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Order Details</h4>
                <div className="text-slate-800 dark:text-slate-200 space-y-2 text-sm">
                  <p><span className="text-slate-500 inline-block w-24">Supplier:</span> <span className="font-bold">{activeOrder.supplier}</span></p>
                  <p><span className="text-slate-500 inline-block w-24">Cost Center:</span> <span className="font-bold">{activeOrder.costCenter}</span></p>
                  <p><span className="text-slate-500 inline-block w-24">Terms:</span> <span className="font-bold">{activeOrder.paymentTerms}</span></p>
                  <p><span className="text-slate-500 inline-block w-24">Needed By:</span> <span className="font-bold">{formatDate(activeOrder.neededBy)}</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-background-dark border-2 border-primary/20 rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Items</span>
                    <span className="font-medium">{activeOrder.items.length}</span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-primary/20">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">Total Amount</span>
                      <span className="text-2xl font-black text-primary">
                        {formatCurrency(activeOrder.items.reduce((sum, item) => sum + ((item.itemPriceUsd ?? 0) * item.quantity), 0))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <button 
                    onClick={() => submitOrderMutation.mutate(activeOrder.id)}
                    disabled={activeOrder.items.length === 0 || submitOrderMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">send</span>
                    {submitOrderMutation.isPending ? "Submitting..." : "Submit Purchase Order"}
                  </button>
                  <button 
                    onClick={() => deleteDraftMutation.mutate(activeOrder.id)}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-bold py-3 rounded-xl transition-colors"
                  >
                    Delete Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS VIEW */}
      {activeView === 'orders' && (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-primary/20">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order History</h3>
          </div>
          {submittedOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-primary/5">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Supplier</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Needed By</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-primary/10">
                  {paginatedOrders.map((order) => {
                    let statusColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
                    if (order.status === "Draft") statusColor = "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
                    if (order.status === "Submitted") statusColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                    if (order.status === "Approved") statusColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                    if (order.status === "Fulfilled") statusColor = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
                    if (order.status === "Rejected") statusColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{order.poNumber ?? `Draft #${order.id}`}</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{order.supplier}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{formatDate(order.neededBy)}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => navigate(`/buyer/orders/${order.id}`)}
                            className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {totalOrdersPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-primary/20 bg-slate-50/50 dark:bg-primary/5">
                  <span className="text-xs text-slate-500">
                    Showing {(currentOrdersPage - 1) * ORDERS_PER_PAGE + 1} to {Math.min(currentOrdersPage * ORDERS_PER_PAGE, ordersQuery.data?.pagination.total ?? 0)} of {ordersQuery.data?.pagination.total ?? 0} orders
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentOrdersPage(p => Math.max(1, p - 1))}
                      disabled={currentOrdersPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-primary/20 text-slate-500 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    {Array.from({ length: totalOrdersPages }, (_, i) => i + 1).map(p => (
                      <button 
                        key={p}
                        onClick={() => setCurrentOrdersPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${p === currentOrdersPage ? 'bg-primary text-white font-bold' : 'border border-slate-200 dark:border-primary/20 text-slate-500 hover:border-primary hover:text-primary transition-all'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentOrdersPage(p => Math.min(totalOrdersPages, p + 1))}
                      disabled={currentOrdersPage === totalOrdersPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-primary/20 text-slate-500 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No orders found.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
