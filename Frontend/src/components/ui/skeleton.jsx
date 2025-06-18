import { cn } from "@/lib/utils";
import React from "react";

const Skeleton = React.forwardRef(function Skeleton(
  { className, ...props },
  ref
) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      ref={ref}
      {...props}
    />
  );
});

export { Skeleton };
