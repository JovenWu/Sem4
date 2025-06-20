import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const productList = [
  { id: "P0001", name: "Gourmet Coffee Trio" },
  { id: "P0002", name: "Metal Floor Lamp" },
  { id: "P0003", name: "Family Frozen Lasagna" },
  { id: "P0004", name: "Bluetooth Earbuds" },
  { id: "P0005", name: "Fresh Berry Yogurt Pack" },
  { id: "P0006", name: "Mixed Nuts & Fruit Tray" },
  { id: "P0007", name: "Waterproof BT Speaker" },
  { id: "P0008", name: "Wired Gaming Mouse" },
  { id: "P0009", name: "Small Wooden Bookshelf" },
  { id: "P0010", name: "RC Robot Builder Kit" },
  { id: "P0011", name: "HD Webcam w/ Mic" },
  { id: "P0012", name: "Men's Dress Shirt" },
  { id: "P0013", name: "Large Salmon Fillet (3lb)" },
  { id: "P0014", name: "Kids Learning Tablet" },
  { id: "P0015", name: "Floating Wall Shelves (2)" },
  { id: "P0016", name: "Gourmet Pasta & Sauce" },
  { id: "P0017", name: "Quilted Puffer Vest" },
  { id: "P0018", name: "Studio Monitor Headphones" },
  { id: "P0019", name: "Cotton Baseball Cap" },
  { id: "P0020", name: "Giant Craft Box Kit" },
];
const getProductName = (id) => productList.find((p) => p.id === id)?.name || id;

export function SalesHistoryDialog({
  items,
  isOpen,
  setIsOpen,
  transactionId,
  customer,
}) {
  const total =
    items && items.length > 0
      ? items.reduce((sum, item) => {
          const subtotal = item.quantity_sold * item.unit_price_at_sale;
          const discount = subtotal * (item.discount_applied / 100);
          return sum + (subtotal - discount);
        }, 0)
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Sales Transaction
            {transactionId && (
              <div className="text-blue-600 font-mono text-base font-normal mt-1">
                {transactionId}
              </div>
            )}
            {customer && (
              <div className="text-green-700 font-mono text-base font-normal mt-1">
                Customer: {customer}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            List of items in this sales transaction
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[350px] overflow-y-auto">
          {items && items.length > 0 ? (
            items.map((item, idx) => (
              <div
                key={idx}
                className="border-b pb-2 last:border-b-0 last:pb-0"
              >
                <div className="font-medium flex items-center gap-2">
                  {getProductName(item.product_id)}
                  <Badge variant="outline">x{item.quantity_sold}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Price: ${item.unit_price_at_sale.toFixed(2)}
                  {item.discount_applied ? (
                    <span className="ml-2 text-xs text-blue-600">
                      ({item.discount_applied}% off)
                    </span>
                  ) : null}
                </div>
                <div className="text-sm font-medium">
                  Subtotal: $
                  {(
                    item.quantity_sold * item.unit_price_at_sale -
                    (item.quantity_sold *
                      item.unit_price_at_sale *
                      item.discount_applied) /
                      100
                  ).toFixed(2)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No items in this transaction.
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t font-medium text-right">
          Total: ${total.toFixed(2)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
