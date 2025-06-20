import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FiMoreHorizontal } from "react-icons/fi";
import { SalesHistoryDialog } from "@/components/SalesOrderDialog";

export function SalesItemsCell({ items, transactionId, customer }) {
  const [dialogOpen, setDialogOpen] = useState(false);
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
  const getProductName = (id) =>
    productList.find((p) => p.id === id)?.name || id;

  if (!Array.isArray(items) || items.length === 0) return <div>No items</div>;
  if (items.length === 1) {
    const item = items[0];
    return (
      <div className="space-y-1">
        <span className="font-medium">{getProductName(item.product_id)}</span>{" "}
        &times; {item.quantity_sold} @ $
        {typeof item.unit_price_at_sale === "number" &&
        !isNaN(item.unit_price_at_sale)
          ? item.unit_price_at_sale.toFixed(2)
          : "0.00"}
        {item.discount_applied ? (
          <span className="ml-2 text-xs text-blue-600">
            ({item.discount_applied}% off)
          </span>
        ) : null}
      </div>
    );
  } else {
    const first = items[0];
    return (
      <div className="flex items-center space-x-2">
        <div>
          <span className="font-medium">
            {getProductName(first.product_id)}
          </span>{" "}
          &times; {first.quantity_sold} @ $
          {typeof first.unit_price_at_sale === "number" &&
          !isNaN(first.unit_price_at_sale)
            ? first.unit_price_at_sale.toFixed(2)
            : "0.00"}
          {first.discount_applied ? (
            <span className="ml-2 text-xs text-blue-600">
              ({first.discount_applied}% off)
            </span>
          ) : null}
          <span className="ml-2 text-xs text-gray-500">
            +{items.length - 1} more
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setDialogOpen(true)}
        >
          <FiMoreHorizontal className="h-4 w-4" />
          <span className="sr-only">View all items</span>
        </Button>
        <SalesHistoryDialog
          items={items}
          isOpen={dialogOpen}
          setIsOpen={setDialogOpen}
          transactionId={transactionId}
          customer={customer}
        />
      </div>
    );
  }
}
