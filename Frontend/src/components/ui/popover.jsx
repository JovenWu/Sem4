import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = React.forwardRef(function PopoverTrigger(props, ref) {
  return <PopoverPrimitive.Trigger ref={ref} {...props} />;
});

const PopoverContent = React.forwardRef(function PopoverContent(
  { className, align = "center", sideOffset = 4, ...props },
  ref
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});

function PopoverAnchor({ ...props }) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}


export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
