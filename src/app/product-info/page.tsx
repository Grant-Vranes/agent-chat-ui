"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { NavBar } from "@/components/layout/NavBar";

export default function ProductInfoPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleExtract = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `${apiUrl}/ai/product_info_app/chat/sync?message=${encodeURIComponent(input)}`,
      );
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Product Info Extraction</h1>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text containing product information..."
          className="min-h-[120px] w-full resize-none rounded-lg border p-3 outline-none"
        />
        <Button onClick={handleExtract} disabled={loading}>
          {loading ? "Extracting..." : "Extract Info"}
        </Button>

        {result && (
          <div className="rounded-lg border p-4 space-y-2">
            {Object.entries(result).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium capitalize min-w-[100px]">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}