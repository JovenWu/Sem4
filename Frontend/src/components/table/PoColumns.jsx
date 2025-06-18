import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

export const PoColumns = [
  {
    accessorKey: "id",
    header: "PO ID",
    cell: ({ row }) => <div>{row.getValue("id")}</div>,
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

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <FiMoreHorizontal className="h-4 w-4" />
                <span className="sr-only">View more products</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-4">
                <div className="font-medium mb-2">
                  All Products ({products.length})
                </div>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {products.map((product, index) => (
                    <div
                      key={index}
                      className="border-b pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm">
                        Quantity: {product.quantity}
                      </div>
                      <div className="text-sm">Price: ${product.price}</div>
                      <div className="text-sm font-medium">
                        Subtotal: $
                        {(product.quantity * product.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t font-medium text-right">
                  Total: $
                  {products
                    .reduce(
                      (sum, product) => sum + product.quantity * product.price,
                      0
                    )
                    .toFixed(2)}
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
      const [isLoading, setIsLoading] = useState(false);
      const id = row.getValue("id");

      const updateStatus = async (newStatus) => {
        if (status === newStatus) return;

        setIsLoading(true);
        try {
          const response = await fetch(`/api/purchase-order/${id}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: newStatus,
              ...(newStatus === "Received" && {
                items_received: true,
              }),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Error: ${response.status}`);
          }

          toast.success(`Status updated to ${newStatus}`, {
            description: `Purchase order ${id} status has been updated.`,
          });
        } catch (error) {
          console.error("Failed to update status:", error);
          toast.error("Failed to update status", {
            description: error.message || "Please try again later.",
          });
        } finally {
          setIsLoading(false);
        }
      };

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

      return (
        <Select
          defaultValue={status}
          onValueChange={updateStatus}
          disabled={isLoading}
        >
          <SelectTrigger className="p-0 shadow-none border-0">
            <SelectValue placeholder="Status">
              {status === "Ordered" && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  Ordered
                </Badge>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ordered">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Ordered
              </Badge>
            </SelectItem>
            <SelectItem value="Received">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Received
              </Badge>
            </SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
];
