import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../hooks/useAuth";
import { ApiClient } from "../lib/api";
import { ORDER_STATUS_OPTIONS } from "../lib/constants";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export function AdminPortalPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.token ?? "";

  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 10;

  const ordersQuery = useQuery({
    queryKey: ["admin-orders", token, currentPage],
    enabled: Boolean(token),
    queryFn: () => ApiClient.getOrders(token, undefined, "Draft", currentPage, ORDERS_PER_PAGE),
  });

  const allOrdersStatsQuery = useQuery({
    queryKey: ["admin-orders-stats", token],
    enabled: Boolean(token),
    queryFn: () => ApiClient.getOrders(token, undefined, "Draft", 1, 10000), // Get all for stats
  });

  const submittedOrders = useMemo(
    () => allOrdersStatsQuery.data?.data ?? [],
    [allOrdersStatsQuery.data]
  );

  const paginatedOrders = useMemo(
    () => ordersQuery.data?.data ?? [],
    [ordersQuery.data]
  );

  const totalPages = ordersQuery.data?.pagination.totalPages ?? 1;
  const totalOrdersCount = ordersQuery.data?.pagination.total ?? 0;

  const orderCounts = ORDER_STATUS_OPTIONS.reduce<Record<string, number>>((acc, status) => {
    if (status === "Draft") return acc;
    acc[status] = submittedOrders.filter((order) => order.status === status).length;
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary uppercase tracking-wider">
              Management
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">Admin Workspace</h1>
            <p className="text-slate-500 dark:text-slate-400">Review all buyer orders, inspect details, and process lifecycle transitions.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ORDER_STATUS_OPTIONS.filter(s => s !== "Draft").map((status) => {
            let statusColor = "text-slate-600 dark:text-slate-300";
            if (status === "Submitted") statusColor = "text-amber-500";
            if (status === "Approved") statusColor = "text-blue-500";
            if (status === "Fulfilled") statusColor = "text-green-500";
            if (status === "Rejected") statusColor = "text-red-500";

            return (
              <div key={status} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{status}</span>
                <span className={`text-3xl font-black ${statusColor}`}>{orderCounts[status] ?? 0}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden shadow-sm mt-4">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-primary/20">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Orders</h3>
          </div>
          
          {ordersQuery.isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading orders...</div>
          ) : submittedOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-primary/5">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Supplier</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Buyer ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Needed By</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-primary/10">
                  {paginatedOrders.map((order: any) => {
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
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">#{order.createdBy ?? "-"}</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{formatDate(order.neededBy)}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-primary/20 bg-slate-50/50 dark:bg-primary/5">
                  <span className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * ORDERS_PER_PAGE + 1} to {Math.min(currentPage * ORDERS_PER_PAGE, totalOrdersCount)} of {totalOrdersCount} orders
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-primary/20 text-slate-500 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button 
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${p === currentPage ? 'bg-primary text-white font-bold' : 'border border-slate-200 dark:border-primary/20 text-slate-500 hover:border-primary hover:text-primary transition-all'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
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
              No orders available yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
