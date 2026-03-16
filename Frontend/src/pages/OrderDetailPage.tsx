import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "../components/layout/AppShell";
import { OrderTimeline } from "../components/orders/OrderTimeline";
import { useAuth } from "../hooks/useAuth";
import { ApiClient } from "../lib/api";
import { ADMIN_ACTIONS_BY_STATUS } from "../lib/constants";

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

export function OrderDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { orderId } = useParams();
  const token = session?.token ?? "";
  const role = session?.user.role ?? "Buyer";
  const numericOrderId = Number(orderId);

  const orderQuery = useQuery({
    queryKey: ["order-detail", token, numericOrderId],
    enabled: Boolean(token && numericOrderId),
    queryFn: () => ApiClient.getOrder(token, numericOrderId),
  });

  const userQueries = useQuery({
    queryKey: ["users-details", token, orderQuery.data?.createdBy, ...(orderQuery.data?.timeline.map(t => t.createdBy) || [])],
    enabled: Boolean(token && orderQuery.data),
    queryFn: async () => {
      if (!orderQuery.data) return [];
      
      // Get unique user IDs from order creator and timeline
      const userIds = new Set<number>();
      if (orderQuery.data.createdBy) userIds.add(orderQuery.data.createdBy);
      orderQuery.data.timeline.forEach(t => {
        if (t.createdBy) userIds.add(t.createdBy);
      });

      // Fetch details for each unique user
      const promises = Array.from(userIds).map(id => ApiClient.getUser(token, id));
      return Promise.all(promises);
    },
  });

  const getUserName = (userId: number | null | undefined) => {
    if (!userId) return "-";
    const user = userQueries.data?.find(u => u.id === userId);
    return user ? user.username : `User #${userId}`;
  };

  const statusTransitionMutation = useMutation({
    mutationFn: (status: "Approved" | "Rejected" | "Fulfilled") =>
      ApiClient.transitionOrder(token, numericOrderId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["order-detail", token, numericOrderId] });
      await queryClient.invalidateQueries({
        queryKey: [role === "Admin" ? "admin-orders" : "buyer-orders", token],
      });
    },
  });

  const availableActions = useMemo(() => {
    if (!orderQuery.data) return [];
    return ADMIN_ACTIONS_BY_STATUS[orderQuery.data.status] || [];
  }, [orderQuery.data]);

  if (orderQuery.isLoading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-slate-500">Loading order details...</div>
      </AppShell>
    );
  }

  if (!orderQuery.data) {
    return (
      <AppShell>
        <div className="p-12 text-center text-slate-500">Order not found.</div>
      </AppShell>
    );
  }

  const order = orderQuery.data;
  let statusColor = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  if (order.status === "Draft") statusColor = "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600";
  if (order.status === "Submitted") statusColor = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50";
  if (order.status === "Approved") statusColor = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50";
  if (order.status === "Fulfilled") statusColor = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50";
  if (order.status === "Rejected") statusColor = "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50";

  const totalAmount = order.items.reduce((sum, item) => sum + ((item.itemPriceUsd ?? 0) * item.quantity), 0);

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-2 text-sm">
        <button onClick={() => navigate(role === "Admin" ? "/admin" : "/buyer")} className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
          Orders
        </button>
        <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
        <span className="text-primary font-semibold">Order Details</span>
      </div>

      <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 dark:border-primary/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-100">
                {order.poNumber ?? `Draft #${order.id}`}
              </h2>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded border ${statusColor}`}>
                {order.status}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              Needed by {formatDate(order.neededBy)}
            </p>
          </div>
          <div className="flex gap-3">
            {role === "Admin" && availableActions.map((action) => (
              <button
                key={action}
                onClick={() => statusTransitionMutation.mutate(action)}
                disabled={statusTransitionMutation.isPending}
                className={`px-6 py-2 rounded-xl font-bold text-sm shadow-sm transition-all ${
                  action === 'Approved' || action === 'Fulfilled' ? 'bg-primary text-white hover:bg-primary/90' : 
                  action === 'Rejected' ? 'bg-red-500 text-white hover:bg-red-600' : 
                  'bg-slate-200 text-slate-800 hover:bg-slate-300'
                }`}
              >
                {statusTransitionMutation.isPending ? "Processing..." : action}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
          {/* Left Column: Timeline & Details */}
          <div className="lg:w-2/3 flex flex-col gap-8">
            {/* Status Timeline */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-primary/10 overflow-x-auto">
              <OrderTimeline timeline={order.timeline ?? []} />
            </div>

            {/* Items Table */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  Submission Snapshot
                </h3>
              </div>
              
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-primary/10">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-primary/5">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Item Details</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Qty</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Unit Price</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Lead Time</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-primary/10">
                    {order.items.map((item) => (
                      <tr key={item.id} className="dark:bg-background-dark">
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.itemName ?? item.catalogItemId}</div>
                          <div className="text-xs text-slate-500">ID: {item.catalogItemId}</div>
                        </td>
                        <td className="px-6 py-5 text-center font-medium">{item.quantity}</td>
                        <td className="px-6 py-5 text-right text-sm">{formatCurrency(item.itemPriceUsd)}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-primary rounded-full text-[10px] font-bold">
                            {item.itemLeadTimeDays != null ? `${item.itemLeadTimeDays} DAYS` : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency((item.itemPriceUsd ?? 0) * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-primary/5 border-t border-slate-200 dark:border-primary/20">
                    <tr>
                      <td className="px-6 py-4 text-right font-bold text-slate-500" colSpan={4}>Grand Total</td>
                      <td className="px-6 py-4 text-right font-black text-xl text-primary">{formatCurrency(totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-primary/10">
                <h4 className="text-xs font-bold text-primary uppercase mb-4">Vendor Snapshot</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Company</span>
                    <span className="text-sm font-bold">{order.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Payment Terms</span>
                    <span className="text-sm font-bold">{order.paymentTerms || "-"}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-primary/10">
                <h4 className="text-xs font-bold text-primary uppercase mb-4">Internal Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Cost Center</span>
                    <span className="text-sm font-bold">{order.costCenter || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Created By</span>
                    <span className="text-sm font-bold">{getUserName(order.createdBy)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status History */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Status History
            </h3>
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-primary/10">
              <div className="space-y-6">
                {[...order.timeline].reverse().map((entry, idx) => (
                  <div key={entry.id} className="relative pl-6">
                    {/* Vertical line connecting items */}
                    {idx !== order.timeline.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-[-24px] w-0.5 bg-primary/30 dark:bg-primary/50"></div>
                    )}
                    {/* Dot */}
                    <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 bg-primary"></div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {entry.status}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        {new Date(entry.createdAt).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                      <span className="text-xs text-slate-400 mt-0.5">
                        By {getUserName(entry.createdBy)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
