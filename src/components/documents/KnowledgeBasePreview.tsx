"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, FileText, AlertCircle, Inbox } from "lucide-react";

type DocumentSummary = {
  sourceName: string;
  chunkCount: number;
  uploadTime: string;
  keywords: string | null;
  contentPreview: string;
};

export function KnowledgeBasePreview() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/document/list`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">加载失败：{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDocuments}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          重试
        </Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          知识库为空，请通过 Documents 按钮上传文档
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {documents.length} 个文档
        </p>
        <Button variant="ghost" size="sm" onClick={fetchDocuments}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          刷新
        </Button>
      </div>
      {documents.map((doc) => {
        const isExpanded = expanded.has(doc.sourceName);
        const keywords = doc.keywords
          ? doc.keywords.split(",").map((k) => k.trim()).filter(Boolean)
          : [];
        return (
          <div
            key={doc.sourceName}
            className="rounded-lg border p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-medium text-sm truncate">
                  {doc.sourceName}
                </span>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {doc.chunkCount} chunks
              </Badge>
            </div>
            {doc.uploadTime && (
              <p className="text-xs text-muted-foreground">
                {new Date(doc.uploadTime).toLocaleString("zh-CN")}
              </p>
            )}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
            {doc.contentPreview && (
              <div>
                <p
                  className={`text-sm text-muted-foreground cursor-pointer ${
                    isExpanded ? "" : "line-clamp-2"
                  }`}
                  onClick={() => toggleExpand(doc.sourceName)}
                >
                  {doc.contentPreview}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
