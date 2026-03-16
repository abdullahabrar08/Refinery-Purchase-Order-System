import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { DEFAULT_CREDENTIALS } from "../lib/constants";
import type { LoginPayload } from "../types/domain";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, role } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<LoginPayload>(DEFAULT_CREDENTIALS.buyer);

  const destination = useMemo(() => {
    if (role === "Admin") {
      return "/admin";
    }

    return "/buyer";
  }, [role]);

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleCredentialPreset = (preset: "buyer" | "admin") => {
    setFormValues(DEFAULT_CREDENTIALS[preset]);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      const session = await login(formValues);
      navigate(session.user.role === "Admin" ? "/admin" : "/buyer", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in right now.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6 font-display">
      <section className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary p-2 rounded-xl text-white">
            <span className="material-symbols-outlined block text-2xl">factory</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Industrial Ops</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Procurement Portal</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formValues.email === DEFAULT_CREDENTIALS.buyer.email ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            type="button"
            onClick={() => handleCredentialPreset("buyer")}
          >
            Buyer Demo
          </button>
          <button
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formValues.email === DEFAULT_CREDENTIALS.admin.email ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            type="button"
            onClick={() => handleCredentialPreset("admin")}
          >
            Admin Demo
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <span className="material-symbols-outlined text-sm">mail</span>
              </span>
              <input
                className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                type="email"
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, email: event.target.value }))
                }
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <span className="material-symbols-outlined text-sm">lock</span>
              </span>
              <input
                className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                type="password"
                value={formValues.password}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, password: event.target.value }))
                }
                autoComplete="current-password"
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <button 
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2" 
            type="submit" 
            disabled={isPending}
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <span className="material-symbols-outlined text-sm">login</span>
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
