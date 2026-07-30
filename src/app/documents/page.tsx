"use client";

import { UploadPanel } from "@/components/documents/UploadPanel";
import { NavBar } from "@/components/layout/NavBar";

export default function DocumentsPage() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="p-6">
        <UploadPanel />
      </main>
    </div>
  );
}