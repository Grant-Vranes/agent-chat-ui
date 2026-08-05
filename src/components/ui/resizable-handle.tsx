"use client";

import { useRef, useCallback } from "react";

interface ResizableHandleProps {
  onResize: (deltaX: number) => void
}

export function ResizableHandle({ onResize }: ResizableHandleProps) {
  const draggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    const startX = e.clientX;

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = e.clientX - startX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 shrink-0 cursor-col-resize hover:w-[5px] hover:bg-primary/20 active:bg-primary/30 transition-all"
    />
  );
}