"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PptOutline, PptSlide } from "@/lib/storage";
import { BarChart3, List, FileText, HelpCircle, BookOpen } from "lucide-react";

interface SlideViewerProps {
  outline: PptOutline | null
  hasOutline: boolean
}

const contentTypeIcon: Record<string, React.ReactNode> = {
  "cover": <BookOpen className="h-4 w-4" />,
  "toc": <List className="h-4 w-4" />,
  "text": <FileText className="h-4 w-4" />,
  "text+chart": <BarChart3 className="h-4 w-4" />,
  "text+list": <List className="h-4 w-4" />,
  "qa": <HelpCircle className="h-4 w-4" />,
  "ending": <BookOpen className="h-4 w-4" />,
};

export function SlideViewer({ outline, hasOutline }: SlideViewerProps) {
  const [open, setOpen] = useState(false);

  if (!hasOutline || !outline) return null;

  return (
    <div className="h-full w-auto shrink-0 border-r border-border">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-full w-9 rounded-none px-0 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            浏览 PPT 大纲
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PPT 幻灯片浏览</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          {outline.slides.map((slide) => (
            <SlideCard key={slide.pageNumber} slide={slide} />
          ))}
        </div>
      </DialogContent>
        </Dialog>
      </div>
    );
  }

function SlideCard({ slide }: { slide: PptSlide }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {slide.pageNumber}
        </span>
        <span className="flex-1 text-sm font-semibold text-card-foreground">
          {slide.title}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {contentTypeIcon[slide.contentType] || <FileText className="h-4 w-4" />}
        </span>
      </div>
      {slide.subtitle && (
        <p className="px-9 text-xs italic text-muted-foreground">{slide.subtitle}</p>
      )}
      {slide.bullets.length > 0 && (
        <ul className="flex flex-col gap-1 px-9">
          {slide.bullets.map((bullet, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed">
              • {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}