import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CircleHelp, Home, LifeBuoy, LogOut, Sparkles, User, Waves } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo, LogoMark } from "./Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/ciclo", label: "Meu ciclo", icon: Waves },
  { to: "/dicas", label: "Dicas", icon: Sparkles },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const signOut = useSignOut();
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card/70 px-4 py-6 backdrop-blur md:flex">
        <Link to="/inicio" className="px-2" aria-label="Cíclica — início">
          <Logo />
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Navegação principal">
          {[...NAV, { to: "/ajuda", label: "Ajuda", icon: LifeBuoy } as const].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary !text-foreground" }}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sair
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/inicio" className="flex items-center gap-2" aria-label="Cíclica — início">
          <LogoMark className="h-8 w-8" />
          <span className="font-display text-xl font-semibold">Cíclica</span>
        </Link>
        <Link
          to="/ajuda"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          aria-label="Ajuda"
        >
          <CircleHelp className="h-5 w-5" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:ml-64 md:max-w-none md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Navegação principal"
      >
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted-foreground"
            activeProps={{ className: "!text-primary", "aria-current": "page" }}
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    isActive && "bg-secondary",
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {item.label}
              </>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-medium text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-rose-pastel border-t-primary" />
      {label}
    </div>
  );
}

export function ErrorState({ message = "Não foi possível carregar seus dados.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-card p-6 text-center" role="alert">
      <p className="text-foreground">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
