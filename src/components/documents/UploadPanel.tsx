"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, Braces } from "lucide-react";

type UploadMode =
  | "string"
  | "file"
  | "markdown"
  | "json-basic"
  | "json-fields"
  | "json-pointer";

export function UploadPanel() {
  const [mode, setMode] = useState<UploadMode>("file");
  const [textContent, setTextContent] = useState("");
  const [fields, setFields] = useState("");
  const [pointer, setPointer] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpointMap: Record<string, string> = {
        file: "/document/upload/file",
        markdown: "/document/upload/markdown",
        "json-basic": "/document/upload/json/basic",
      };

      const baseEndpoint = endpointMap[mode] || "/document/upload/file";
      const params = new URLSearchParams();
      if (mode === "json-fields") {
        params.set("fields", fields);
      }
      if (mode === "json-pointer") {
        params.set("pointer", pointer);
      }
      const queryString = params.toString();
      const url = `${apiUrl}${baseEndpoint}${queryString ? "?" + queryString : ""}`;

      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
      if (data.success) toast.success("Upload successful");
      else toast.error("Upload failed: " + data.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Upload error: " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleStringSubmit = async () => {
    if (!textContent.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${apiUrl}/document/upload/string`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: textContent,
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
      if (data.success) toast.success("Upload successful");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Error: " + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Document Upload</h1>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "string", label: "Plain Text", icon: FileText },
            { value: "file", label: "General File", icon: Upload },
            { value: "markdown", label: "Markdown", icon: FileText },
            { value: "json-basic", label: "JSON (Basic)", icon: Braces },
            { value: "json-fields", label: "JSON (Fields)", icon: Braces },
            { value: "json-pointer", label: "JSON (Pointer)", icon: Braces },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={mode === value ? "default" : "outline"}
            size="sm"
            onClick={() => setMode(value as UploadMode)}
          >
            <Icon className="mr-1 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border p-4">
        {mode === "string" ? (
          <div className="space-y-2">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter plain text content..."
              className="min-h-[200px] w-full resize-none rounded border p-3 outline-none"
            />
            <Button onClick={handleStringSubmit} disabled={loading}>
              {loading ? "Uploading..." : "Upload Text"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {mode === "json-fields" && (
              <Input
                value={fields}
                onChange={(e) => setFields(e.target.value)}
                placeholder="Field names (comma-separated, e.g. title,content)"
              />
            )}
            {mode === "json-pointer" && (
              <Input
                value={pointer}
                onChange={(e) => setPointer(e.target.value)}
                placeholder="JSON Pointer path (e.g. /data/items)"
              />
            )}
            <Input type="file" onChange={handleFileUpload} />
          </div>
        )}
      </div>

      {result && (
        <pre className="rounded-lg border bg-muted p-4 text-sm overflow-x-auto">
          {result}
        </pre>
      )}
    </div>
  );
}