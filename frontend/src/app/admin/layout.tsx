"use client";
import { Button } from "@/components/ui/button";
import { userAuthStore } from "@/store/authStore";
import {
  CreditCard,
  LayoutDashboard,
  Loader,
  LogOut,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, loading, logout } = userAuthStore();
  const router = useRouter();
  const pathName = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  const isLoginPage = pathName === "/admin/login";

  useEffect(() => {
    setHasMounted(true);
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    if (isLoginPage) {
      setIsChecking(false);
      return;
    }

    if (loading) {
      setIsChecking(true);
      return;
    }

    if (!isAuthenticated || user?.type !== "admin") {
      router.push("/admin/login");
      return;
    }

    setIsChecking(false);
  }, [isAuthenticated, user, loading, router, hasMounted, isLoginPage]);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const navigationItem = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: pathName === "/admin/dashboard",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      current: pathName === "/admin/users",
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: CreditCard,
      current: pathName === "/admin/payments",
    },
  ];

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || isChecking) {
    return <Loader />;
  }

  if (!isAuthenticated || user?.type !== "admin") {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Portal
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-5 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItem.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => router.push(item.href)}
                  className={`${
                    item.current
                      ? "text-blue-600 border-b-2 border-blue-600 rounded-none"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}


