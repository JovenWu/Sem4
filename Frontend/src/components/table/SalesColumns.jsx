import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SalesItemsCell } from "./SalesItemsCell";

export const SalesColumns = [
  {
    accessorKey: "transaction_date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("transaction_date");
      if (!date) return null;
      return <div>{format(new Date(date), "PPP")}</div>;
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.getValue("customer");
      // If customer is an object, show the name; otherwise, show as is or '-'
      if (customer && typeof customer === "object" && customer.name) {
        return <div>{customer.name}</div>;
      }
      return <div>{customer || "-"}</div>;
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => (
      <SalesItemsCell
        items={row.getValue("items")}
        transactionId={row.original.transaction_id}
      />
    ),
  },
  {
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const items = row.getValue("items") || [];
      // Show max discount in transaction, or 0 if none
      const maxDiscount =
        items.length > 0
          ? Math.max(...items.map((i) => i.discount_applied || 0))
          : 0;
      return <div>{maxDiscount ? `${maxDiscount}%` : "-"}</div>;
    },
  },
  {
    accessorKey: "promotion_marker",
    header: "Promotion",
    cell: ({ row }) => {
      const hasPromotion = row.getValue("promotion_marker");
      return hasPromotion ? (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Yes
        </Badge>
      ) : (
        <Badge variant="outline" className="text-gray-500">
          No
        </Badge>
      );
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const total = row.getValue("total");
      return (
        <div className="font-medium">
          $
          {typeof total === "number" && !isNaN(total)
            ? total.toFixed(2)
            : "0.00"}
        </div>
      );
    },
  },
];
