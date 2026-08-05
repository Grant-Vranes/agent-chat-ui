"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PptOutline, PptSlide } from "@/lib/storage";
import { BarChart3, List, FileText, HelpCircle, BookOpen, X, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

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

const contentTypeLabel: Record<string, string> = {
  "cover": "Cover",
  "toc": "Table of Contents",
  "text": "Text",
  "text+chart": "Text & Chart",
  "text+list": "Text & List",
  "qa": "Q&A",
  "ending": "Ending",
};

export function SlideViewer({ outline, hasOutline, isOpen, onToggle, width = 340 }: SlideViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [jumpPage, setJumpPage] = useState("");
  const [highlightPage, setHighlightPage] = useState<number | null>(null);
  const [inputError, setInputError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleJump = useCallback(() => {
    if (!outline) return;
    const page = parseInt(jumpPage, 10);
    if (isNaN(page) || page < 1 || page > outline.slides.length) {
      setInputError(true);
      return;
    }
    setInputError(false);
    const el = document.getElementById(`slide-${page}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightPage(page);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => setHighlightPage(null), 2000);
    }
  }, [jumpPage, outline]);

  const handleJumpKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleJump();
    }
  }, [handleJump]);

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
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  PPT 大纲
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {outline.slides.length} 页
                  </span>
                </h2>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpanded((v) => !v)}
                        className="text-muted-foreground hover:text-foreground h-7 w-7"
                      >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {expanded ? "收起细节" : "展开细节"}
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="text-muted-foreground hover:text-foreground h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={outline.slides.length}
                  value={jumpPage}
                  onChange={(e) => {
                    setJumpPage(e.target.value);
                    setInputError(false);
                  }}
                  onKeyDown={handleJumpKeyDown}
                  placeholder="页码"
                  className={`h-7 w-16 rounded-md border bg-transparent px-2 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 ${
                    inputError
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:border-primary"
                  }`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleJump}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  跳转
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-3 py-3">
              <TooltipProvider>
                <div className="flex flex-col gap-2">
                  {outline.slides.map((slide) => (
                    <SlideCard
                      key={slide.pageNumber}
                      slide={slide}
                      expanded={expanded}
                      highlighted={highlightPage === slide.pageNumber}
                    />
                  ))}
                </div>
              </TooltipProvider>
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

function SlideCard({ slide, expanded, highlighted }: { slide: PptSlide; expanded: boolean; highlighted: boolean }) {
  return (
    <div
      id={`slide-${slide.pageNumber}`}
      className={`rounded-lg border bg-card p-3 shadow-sm transition-all duration-300 ${
        highlighted
          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
          : "border-border"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-border/50 pb-1.5 mb-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
          {slide.pageNumber}
        </span>
        <span className="flex-1 text-xs font-semibold text-card-foreground leading-snug">
          {slide.title}
        </span>
        <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0 text-muted-foreground cursor-help">
                {contentTypeIcon[slide.contentType] || <FileText className="h-3 w-3" />}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {contentTypeLabel[slide.contentType] || slide.contentType}
            </TooltipContent>
          </Tooltip>
      </div>
      {slide.content ? (
        <div className={`text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-4"}`}>
          {slide.content}
        </div>
      ) : (
        <>
          {slide.subtitle && (
            <p className={`text-[11px] italic text-muted-foreground ${expanded ? "" : "line-clamp-1"}`}>{slide.subtitle}</p>
          )}
          {slide.bullets.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {(expanded ? slide.bullets : slide.bullets.slice(0, 3)).map((bullet, i) => (
                <p key={i} className={`text-[11px] text-muted-foreground leading-relaxed ${expanded ? "" : "truncate"}`}>
                  • {bullet}
                </p>
              ))}
              {!expanded && slide.bullets.length > 3 && (
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