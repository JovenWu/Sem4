import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function PurchaseOrderDialog({ products, isOpen, setIsOpen, poId }) {
  if (!products || products.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Purchase Order
            {poId && (
              <div className="text-blue-600 font-mono text-base font-normal mt-1">
                {poId}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            List of products in this purchase order
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[350px] overflow-y-auto">
          {products.map((product, idx) => (
            <div key={idx} className="border-b pb-2 last:border-b-0 last:pb-0">
              <div className="font-medium flex items-center gap-2">
                {product.name}
                <Badge variant="outline">x{product.quantity}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Price: ${product.price}
              </div>
              <div className="text-sm font-medium">
                Subtotal: ${(product.quantity * product.price).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t font-medium text-right">
          Total: $
          {products
            .reduce((sum, product) => sum + product.quantity * product.price, 0)
            .toFixed(2)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
