"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PptOutline, PptSlide } from "@/lib/storage";
import { BarChart3, List, FileText, HelpCircle, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlideViewerProps {
  outline: PptOutline | null
  hasOutline: boolean
  isOpen: boolean
  onToggle: () => void
  width?: number
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

export function SlideViewer({ outline, hasOutline, isOpen, onToggle, width = 340 }: SlideViewerProps) {
  if (!hasOutline || !outline) return null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          key="outline-open"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full border-r border-border bg-background overflow-hidden flex-shrink-0"
        >
          <div className="flex h-full flex-col" style={{ width }}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                PPT 大纲
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {outline.slides.length} 页
                </span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="flex flex-col gap-2">
                {outline.slides.map((slide) => (
                  <SlideCard key={slide.pageNumber} slide={slide} />
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      ) : (
        <motion.aside
          key="outline-closed"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 40, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full border-r border-border bg-background flex-shrink-0"
        >
          <div className="flex h-full w-[40px] flex-col items-center pt-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open PPT outline"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function SlideCard({ slide }: { slide: PptSlide }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/50 pb-1.5 mb-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
          {slide.pageNumber}
        </span>
        <span className="flex-1 text-xs font-semibold text-card-foreground leading-snug">
          {slide.title}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {contentTypeIcon[slide.contentType] || <FileText className="h-3 w-3" />}
        </span>
      </div>
      {slide.content ? (
        <div className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {slide.content}
        </div>
      ) : (
        <>
          {slide.subtitle && (
            <p className="text-[11px] italic text-muted-foreground line-clamp-1">{slide.subtitle}</p>
          )}
          {slide.bullets.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {slide.bullets.slice(0, 3).map((bullet, i) => (
                <p key={i} className="text-[11px] text-muted-foreground leading-relaxed truncate">
                  • {bullet}
                </p>
              ))}
              {slide.bullets.length > 3 && (
                <p className="text-[10px] text-muted-foreground/60">
                  +{slide.bullets.length - 3} more
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}