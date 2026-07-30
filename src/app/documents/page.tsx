"use client";

import { UploadPanel } from "@/components/documents/UploadPanel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShoppingCart, Upload } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <MessageSquare className="mr-1 h-4 w-4" />
              Chat
            </Button>
          </Link>
          <Link href="/documents">
            <Button variant="secondary" size="sm">
              <Upload className="mr-1 h-4 w-4" />
              Documents
            </Button>
          </Link>
          <Link href="/product-info">
            <Button variant="ghost" size="sm">
              <ShoppingCart className="mr-1 h-4 w-4" />
              Product Info
            </Button>
          </Link>
        </div>
        <h1 className="text-lg font-semibold">Support Bot</h1>
        <div className="w-20" />
      </nav>
      <main className="p-6">
        <UploadPanel />
      </main>
    </div>
  );
}