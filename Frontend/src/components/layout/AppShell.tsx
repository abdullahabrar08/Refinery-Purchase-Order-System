import { useAuth } from "../../hooks/useAuth";
import { NavLink } from "react-router-dom";
import type { PropsWithChildren } from "react";

interface AppShellProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
}

export function AppShell({ children }: AppShellProps) {
  const { session, role, logout } = useAuth();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-primary/20 bg-background-light dark:bg-background-dark px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-1.5 rounded-lg text-white">
              <span className="material-symbols-outlined block">factory</span>
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">
              Industrial Procurement
            </h2>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink 
              to={role === "Buyer" ? "/buyer" : "/admin"}
              end
              className={({ isActive }) => 
                isActive 
                  ? "text-primary dark:text-primary text-sm font-bold border-b-2 border-primary pb-1"
                  : "text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors"
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/10 rounded-xl transition-all">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background-light dark:border-background-dark"></span>
          </button>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-primary/20 mx-1"></div>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={logout} title="Logout">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none">{session?.user.username || "User"}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-1">{role}</p>
            </div>
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined">logout</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full px-6 py-6 gap-6">
        {children}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-primary/20 py-8 mt-auto">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-1 rounded-lg text-primary">
              <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">© 2026 Industrial Procurement System. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
