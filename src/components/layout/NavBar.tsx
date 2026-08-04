"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Upload, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UploadPanel } from "@/components/documents/UploadPanel";

export function NavBar({ children, chatId }: { children?: React.ReactNode; chatId?: string | null }) {
  const pathname = usePathname();
  const [exporting, setExporting] = useState(false);
  const [docOpen, setDocOpen] = useState(false);

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
    <nav className="flex items-center justify-between border-b border-border px-4 py-3 shadow-card">
      <div className="flex items-center gap-2">
        {children}
        <Button variant={pathname === "/" ? "secondary" : "ghost"} size="sm" onClick={() => window.location.href = "/"}>
          <MessageSquare className="mr-1.5 h-4 w-4" />
          Chat
        </Button>
        <Dialog open={docOpen} onOpenChange={setDocOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Upload className="mr-1.5 h-4 w-4" />
              Documents
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Document Upload</DialogTitle>
              <DialogDescription>Upload documents to the knowledge base.</DialogDescription>
            </DialogHeader>
            <UploadPanel />
          </DialogContent>
        </Dialog>
        {chatId && (
          <div className="ml-2 flex items-center gap-1 border-l border-border pl-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={exporting}
              onClick={() => handleExport("markdown")}
            >
              <Download className="mr-1.5 h-4 w-4" />
              MD
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={exporting}
              onClick={() => handleExport("docx")}
            >
              <Download className="mr-1.5 h-4 w-4" />
              DOCX
            </Button>
          </div>
        )}
      </div>
      <h1 className="font-display text-lg italic text-primary">Logistics Consultant</h1>
      <div className="w-20" />
    </nav>
  );
}