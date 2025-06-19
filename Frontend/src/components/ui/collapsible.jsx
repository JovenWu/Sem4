import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

function Collapsible({ ...props }) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({ ...props }) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
}

function CollapsibleContent({ className = "", ...props }) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={`
        overflow-hidden
        transition-all duration-300
        data-[state=open]:animate-collapsible-down
        data-[state=closed]:animate-collapsible-up
        ${className}
      `}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
