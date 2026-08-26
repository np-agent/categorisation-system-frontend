"use client";

import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const CLAMP_CLASS: Record<number, string> = {
  1: "block truncate",
  2: "line-clamp-2",
  3: "line-clamp-3",
};

/**
 * Text that stays on its allotted lines and reveals the full value on hover,
 * but only when it is actually being cut off.
 */
export function TruncatedText({
  text,
  className,
  clamp = 1,
  fallback = "—",
}: {
  text: string | null | undefined;
  className?: string;
  clamp?: 1 | 2 | 3;
  fallback?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [clipped, setClipped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // ResizeObserver fires on observe, so this covers the first measurement as
    // well as later column resizes.
    const observer = new ResizeObserver(() => {
      setClipped(
        el.scrollWidth > el.clientWidth + 1 ||
          el.scrollHeight > el.clientHeight + 1
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  if (!text) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          ref={ref}
          className={cn("min-w-0 max-w-full", CLAMP_CLASS[clamp], className)}
        >
          {text}
        </span>
      </TooltipTrigger>
      {/* Only mount the content when clipped, otherwise fully visible values
          would pop a redundant tooltip on every hover. */}
      {clipped && (
        <TooltipContent
          side="top"
          collisionPadding={12}
          className="block max-h-[min(20rem,50vh)] w-auto max-w-lg overflow-y-auto whitespace-pre-wrap break-words text-left font-normal"
        >
          {text}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
