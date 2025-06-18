import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const SalesColumns = [
  {
    accessorKey: "sales_record_id",
    header: "Sales ID",
    cell: ({ row }) => (
      <div className="max-w-[180px] truncate">
        {row.getValue("sales_record_id")}
      </div>
    ),
  },
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
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => <div>{row.getValue("productName")}</div>,
  },
  {
    accessorKey: "quantity_sold",
    header: "Quantity",
    cell: ({ row }) => <div>{row.getValue("quantity_sold")}</div>,
  },
  {
    accessorKey: "unit_price_at_sale",
    header: "Unit Price",
    cell: ({ row }) => (
      <div>${row.getValue("unit_price_at_sale").toFixed(2)}</div>
    ),
  },
  {
    accessorKey: "discount_applied",
    header: "Discount",
    cell: ({ row }) => {
      const discount = row.getValue("discount_applied");
      return <div>{discount}%</div>;
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
      return <div className="font-medium">${total.toFixed(2)}</div>;
    },
  },
];
