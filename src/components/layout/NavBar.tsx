"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShoppingCart, Upload } from "lucide-react";

export function NavBar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Chat", icon: MessageSquare },
    { href: "/documents", label: "Documents", icon: Upload },
    { href: "/product-info", label: "Product Info", icon: ShoppingCart },
  ] as const;

  return (
    <nav className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-2">
        {children}
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant={pathname === href ? "secondary" : "ghost"}
              size="sm"
            >
              <Icon className="mr-1 h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
      </div>
      <h1 className="text-lg font-semibold">Support Bot</h1>
      <div className="w-20" />
    </nav>
  );
}