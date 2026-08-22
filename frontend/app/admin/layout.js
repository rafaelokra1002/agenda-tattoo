"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { Spinner } from "../components/ui";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/bookings", label: "Agendamentos", icon: "📅" },
  { href: "/admin/clients", label: "Clientes", icon: "👥" },
  { href: "/admin/services", label: "Serviços", icon: "🖊️" },
  { href: "/admin/schedule", label: "Horários", icon: "⏰" },
  { href: "/admin/settings", label: "Configurações", icon: "⚙️" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  const [ready, setReady] = useState(isLogin);
  const [user, setUser] = useState(null);

  // Guarda de rota: sem token -> volta para o login.
  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    const token = auth.getToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setUser(auth.getUser());
    setReady(true);
  }, [isLogin, pathname, router]);

  // A página de login não usa o chrome do painel.
  if (isLogin) return children;

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-400">
        <Spinner />
      </main>
    );
  }

  function logout() {
    auth.logout();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-line bg-panel p-4">
        <div className="px-2 py-3">
          <p className="text-brand font-semibold uppercase tracking-widest text-xs">
            Studio Ink
          </p>
          <p className="text-sm text-slate-400">Painel administrativo</p>
        </div>
        <nav className="mt-4 space-y-1 flex-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-brand text-white"
                    : "text-slate-300 hover:bg-ink"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line pt-3">
          <div className="px-3 text-xs text-slate-500 mb-2 truncate">
            {user?.email}
          </div>
          <button onClick={logout} className="btn-ghost w-full text-sm">
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Topbar mobile */}
        <header className="md:hidden flex items-center justify-between border-b border-line bg-panel px-4 py-3">
          <span className="font-semibold">Painel</span>
          <button onClick={logout} className="text-sm text-slate-400">
            Sair
          </button>
        </header>

        {/* Nav mobile */}
        <nav className="md:hidden flex gap-1 overflow-x-auto border-b border-line bg-panel px-2 py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs ${
                pathname === item.href ? "bg-brand text-white" : "text-slate-300"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
