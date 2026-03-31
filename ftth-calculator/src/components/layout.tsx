import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Calculator, 
  SplitSquareHorizontal, 
  GitCommit, 
  GitMerge, 
  Settings2, 
  History, 
  Users, 
  LogOut, 
  Menu,
  X
} from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: user } = useGetMe({ query: { retry: false } });

  const handleLogout = () => {
    localStorage.removeItem("ftth_token");
    window.location.href = "/login";
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: Calculator },
    { href: "/find-ratio", label: "Find Ratio", icon: SplitSquareHorizontal },
    { href: "/splitter-ratio", label: "Splitter Ratio", icon: Settings2 },
    { href: "/jalur-lurus", label: "Jalur Lurus", icon: GitCommit },
    { href: "/jalur-percabangan", label: "Jalur Percabangan", icon: GitMerge },
    { href: "/mix-ratio", label: "Mix Ratio", icon: Settings2 },
    { href: "/history", label: "History", icon: History },
  ];

  if (user?.role === "super_admin") {
    navItems.push({ href: "/admin/users", label: "User Admin", icon: Users });
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl mx-3 mb-1 cursor-pointer transition-all duration-200 group",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}>
              <item.icon className={cn("w-5 h-5", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-sidebar border-r border-sidebar-border z-20">
        <div 
          className="h-20 w-full flex justify-center items-center" 
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <img 
            src="/images/axelbit.png" 
            alt="Axelbit Logo"
            style={{ height: '42px', width: 'auto', objectFit: 'contain', marginTop: '4px' }}
          />
        </div>
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-sidebar-border/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent/50 text-white mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{user?.username}</span>
              <span className="text-xs text-sidebar-foreground/60">{user?.role}</span>
            </div>
          </div>
          <Button variant="ghost" className="w-full text-sidebar-foreground hover:text-white hover:bg-sidebar-accent justify-start" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3 opacity-70" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar Mobile */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border z-50 flex flex-col transition-transform duration-300 ease-in-out md:hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div 
          className="h-20 w-full flex justify-center items-center relative px-6" 
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <img 
            src="/images/axelbit.png" 
            alt="Axelbit Logo"
            style={{ height: '42px', width: 'auto', objectFit: 'contain', marginTop: '4px' }}
          />
          <button onClick={() => setIsMobileOpen(false)} className="text-sidebar-foreground hover:text-white absolute right-6">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
          <NavLinks />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center">
            <button onClick={() => setIsMobileOpen(true)} className="md:hidden mr-4 p-2 rounded-lg hover:bg-muted text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-display font-bold text-foreground">
              {navItems.find(i => i.href === location)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
               <span className="text-sm font-semibold">{user?.username}</span>
               <span className="text-xs text-primary font-medium">{user?.role === 'super_admin' ? 'Super Admin' : 'Engineer'}</span>
             </div>
             <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="Logo" className="w-10 h-10 rounded-lg shadow-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
