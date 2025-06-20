import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FiMoreHorizontal } from "react-icons/fi";
import { useState } from "react";
import { toast } from "sonner";
import { PurchaseOrderDialog } from "@/components/PurchaseOrderDialog";

export const PoColumns = [
  {
    accessorKey: "po_id", // Use po_id instead of id
    header: "PO ID",
    cell: ({ row }) => <div>{row.getValue("po_id")}</div>,
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
    cell: ({ row }) => <div>{row.getValue("supplierName")}</div>,
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => {
      const products = row.getValue("products");
      const [dialogOpen, setDialogOpen] = useState(false);
      if (!products || products.length === 0) return <div>No products</div>;
      const firstProduct = products[0];
      if (products.length === 1) {
        return (
          <div>
            <div className="font-medium">{firstProduct.name}</div>
            <div className="text-muted-foreground text-xs">
              {firstProduct.quantity} × ${firstProduct.price}
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center space-x-2">
          <div>
            <div className="font-medium">{firstProduct.name}</div>
            <div className="text-muted-foreground text-xs">
              {firstProduct.quantity} × ${firstProduct.price}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setDialogOpen(true)}
          >
            <FiMoreHorizontal className="h-4 w-4" />
            <span className="sr-only">View all products</span>
          </Button>
          <PurchaseOrderDialog
            products={products}
            isOpen={dialogOpen}
            setIsOpen={setDialogOpen}
            poId={row.getValue("po_id")}
          />
        </div>
      );
    },
  },
  {
    accessorKey: "orderDate",
    header: "Order Date",
    cell: ({ row }) => {
      const date = row.getValue("orderDate");
      if (!date) return null;
      return <div>{format(new Date(date), "PPP")}</div>;
    },
  },
  {
    accessorKey: "expectedDeliveryDate",
    header: "Expected Delivery",
    cell: ({ row }) => {
      const date = row.getValue("expectedDeliveryDate");
      if (!date) return null;
      return <div>{format(new Date(date), "PPP")}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      if (status === "Received") {
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Received
          </Badge>
        );
      }
      // Only show badge for Ordered, no dropdown
      if (status === "Ordered") {
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Ordered
          </Badge>
        );
      }
      // fallback for unknown status
      return <Badge variant="outline">{status}</Badge>;
    },
  },
];
