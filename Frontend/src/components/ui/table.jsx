import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef(function Table({ className, ...props }, ref) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        ref={ref}
        {...props}
      />
    </div>
  );
});

const TableHeader = React.forwardRef(function TableHeader(
  { className, ...props },
  ref
) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      ref={ref}
      {...props}
    />
  );
});

const TableBody = React.forwardRef(function TableBody(
  { className, ...props },
  ref
) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      ref={ref}
      {...props}
    />
  );
});

const TableFooter = React.forwardRef(function TableFooter(
  { className, ...props },
  ref
) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

const TableRow = React.forwardRef(function TableRow(
  { className, ...props },
  ref
) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

const TableHead = React.forwardRef(function TableHead(
  { className, ...props },
  ref
) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

const TableCell = React.forwardRef(function TableCell(
  { className, ...props },
  ref
) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

const TableCaption = React.forwardRef(function TableCaption(
  { className, ...props },
  ref
) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      ref={ref}
      {...props}
    />
  );
});

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
