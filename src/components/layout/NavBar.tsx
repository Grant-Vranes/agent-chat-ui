"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Upload, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function NavBar({ children, chatId }: { children?: React.ReactNode; chatId?: string | null }) {
  const pathname = usePathname();
  const [exporting, setExporting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleExport = async (format: "markdown" | "docx") => {
    const pid = chatId;
    if (!pid) {
      toast.error("No active session to export");
      return;
    }
    setExporting(true);
    try {
      const res = await fetch(`${apiUrl}/api/logistics/export/${format}?proposalId=${encodeURIComponent(pid)}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const ext = format === "docx" ? ".docx" : ".md";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `proposal-${pid}${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error("Export error: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <nav className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-2">
        {children}
        <Link href="/">
          <Button variant={pathname === "/" ? "secondary" : "ghost"} size="sm">
            <MessageSquare className="mr-1 h-4 w-4" />
            Chat
          </Button>
        </Link>
        <Link href="/documents">
          <Button variant={pathname === "/documents" ? "secondary" : "ghost"} size="sm">
            <Upload className="mr-1 h-4 w-4" />
            Documents
          </Button>
        </Link>
        {chatId && (
          <div className="flex items-center gap-1 ml-2 border-l pl-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={exporting}
              onClick={() => handleExport("markdown")}
            >
              <Download className="mr-1 h-4 w-4" />
              MD
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={exporting}
              onClick={() => handleExport("docx")}
            >
              <Download className="mr-1 h-4 w-4" />
              DOCX
            </Button>
          </div>
        )}
      </div>
      <h1 className="text-lg font-semibold">Logistics Consultant</h1>
      <div className="w-20" />
    </nav>
  );
}