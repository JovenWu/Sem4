import React, { useState, useEffect, useCallback } from "react";
import PageLayout from "@/layouts/PageLayout";
import DataTable from "@/components/table/DataTable";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FiPlus } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { toast } from "sonner";

const StockLevel = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  const fetchStockInfo = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/product-stock-info/?page=${
        pagination.pageIndex + 1
      }&page_size=${pagination.pageSize}`;
      if (globalFilter) url += `&search=${encodeURIComponent(globalFilter)}`;
      if (sorting.length > 0) {
        url += `&ordering=${sorting
          .map((s) => (s.desc ? "-" : "") + s.id)
          .join(",")}`;
      }
      const res = await fetch(url);
      const result = await res.json();
      setData(result.results || []);
      setTotalCount(result.count || 0);
    } catch {
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [pagination, globalFilter, sorting]);

  // Fetch pending purchase orders
  const fetchPendingOrders = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/purchase-order/?status=Ordered&page_size=100"
      );
      if (!res.ok) throw new Error("Failed to fetch pending orders");
      const data = await res.json();
      setPendingOrders(data.results || data);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      toast.error("Failed to load pending orders");
    }
  }, []);

  useEffect(() => {
    fetchStockInfo();
  }, [fetchStockInfo]);

  useEffect(() => {
    if (dialogOpen) {
      fetchPendingOrders();
    }
  }, [dialogOpen, fetchPendingOrders]);

  useEffect(() => {
    // Filter orders based on search term
    if (pendingOrders.length > 0) {
      if (!orderSearch.trim()) {
        setFilteredOrders(pendingOrders);
      } else {
        const searchTerm = orderSearch.toLowerCase().trim();
        const filtered = pendingOrders.filter(
          (order) =>
            order.po_id.toString().includes(searchTerm) ||
            (order.supplier?.name &&
              order.supplier.name.toLowerCase().includes(searchTerm))
        );
        setFilteredOrders(filtered);
      }
    } else {
      setFilteredOrders([]);
    }
  }, [pendingOrders, orderSearch]);

  const columns = [
    {
      accessorKey: "product_name",
      header: "Product Name",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "current_stock",
      header: "Current Stock",
      cell: ({ getValue }) => getValue() ?? 0,
    },
    {
      accessorKey: "on_order",
      header: "On Order",
      cell: ({ getValue }) => getValue() ?? 0,
    },
  ];

  const handleOrderSelect = async (order) => {
    setSelectedOrder(order);

    // Fetch detailed information for the selected order if needed
    try {
      const res = await fetch(`/api/purchase-order/${order.po_id}/`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const orderDetails = await res.json();

      // Fetch product names for each item in the order
      if (orderDetails.items && orderDetails.items.length > 0) {
        const productPromises = orderDetails.items.map(async (item) => {
          try {
            const productRes = await fetch(`/api/products/${item.product_id}/`);
            if (productRes.ok) {
              const productData = await productRes.json();
              return {
                ...item,
                product_name: productData.product_name || productData.name,
              };
            }
            return item;
          } catch (error) {
            console.error(`Failed to fetch product ${item.product_id}:`, error);
            return item;
          }
        });

        const itemsWithProductNames = await Promise.all(productPromises);
        orderDetails.items = itemsWithProductNames;
      }

      setSelectedOrder(orderDetails);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    }
  };

  const handleReceiveStock = async () => {
    if (!selectedOrder) return;

    setReceiveLoading(true);
    try {
      // Update the purchase order status to "Received"
      const res = await fetch(`/api/purchase-order/${selectedOrder.po_id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Received",
          items_received: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to update order");

      toast.success("Stock received successfully", {
        description: `Purchase order #${selectedOrder.po_id} has been marked as received.`,
      });

      setDialogOpen(false);
      setSelectedOrder(null);
      fetchStockInfo(); // Refresh the stock data
    } catch (error) {
      console.error("Error receiving stock:", error);
      toast.error("Failed to receive stock");
    } finally {
      setReceiveLoading(false);
    }
  };

  return (
    <PageLayout
      title="Stock Level"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Stock Level</h2>
            <p className="text-muted-foreground">
              View product stock and on-order quantities
            </p>
          </div>
          <Button
            variant="default"
            className="flex gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <FiPlus className="w-4 h-4" /> Receive Stock
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          filterPlaceholder="Filter products..."
          manualPagination={true}
          manualFiltering={true}
          manualSorting={true}
          pageCount={Math.ceil(totalCount / pagination.pageSize)}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          totalCount={totalCount}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          sorting={sorting}
        />

        {/* Receive Stock Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            style={{ maxWidth: "85vw", width: "85vw" }}
            className="w-full"
          >
            <DialogHeader>
              <DialogTitle>Receive Stock</DialogTitle>
              <DialogDescription>
                Select a purchase order to receive and update inventory
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-4 my-4">
              {/* Left Section - Purchase Order Cards */}
              <div className="md:w-1/3 p-4 border rounded-md overflow-auto max-h-[70vh]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Pending Purchase Orders</h3>
                  <span className="text-sm text-muted-foreground">
                    {filteredOrders.length} order
                    {filteredOrders.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mb-3">
                  <Input
                    placeholder="Search orders by ID or supplier..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full"
                  />
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {pendingOrders.length === 0
                      ? "No pending orders found"
                      : "No matching orders found"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredOrders.map((order) => (
                      <Card
                        key={order.po_id}
                        className={`cursor-pointer hover:border-primary ${
                          selectedOrder?.po_id === order.po_id
                            ? "border-2 border-primary"
                            : ""
                        }`}
                        onClick={() => handleOrderSelect(order)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-sm">
                                PO #{order.po_id}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {order.supplier?.name || "Unknown Supplier"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs">
                            <p>
                              Expected:{" "}
                              {order.expected_delivery_date &&
                                format(
                                  new Date(order.expected_delivery_date),
                                  "PP"
                                )}
                            </p>
                            <p className="mt-0.5">
                              Items: {order.items?.length || 0}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Section - Order Details */}
              <div className="md:w-2/3 p-4 border rounded-md">
                {selectedOrder ? (
                  <>
                    <h3 className="font-medium mb-4">Order Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">PO ID</p>
                          <p className="font-medium">#{selectedOrder.po_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Supplier
                          </p>
                          <p className="font-medium">
                            {selectedOrder.supplier?.name || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Order Date
                          </p>
                          <p className="font-medium">
                            {selectedOrder.order_date &&
                              format(new Date(selectedOrder.order_date), "PPP")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Expected Delivery
                          </p>
                          <p className="font-medium">
                            {selectedOrder.expected_delivery_date &&
                              format(
                                new Date(selectedOrder.expected_delivery_date),
                                "PPP"
                              )}
                          </p>
                        </div>
                      </div>

                      {selectedOrder.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p>{selectedOrder.notes}</p>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <h4 className="font-medium mb-2">Ordered Items</h4>
                        <div className="space-y-2 max-h-[30vh] overflow-auto">
                          {selectedOrder.items?.map((item, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-md"
                            >
                              <div className="flex justify-between">
                                <p className="font-medium">
                                  {item.product_name ||
                                    item.product?.product_name ||
                                    `Product #${item.product_id}`}
                                </p>
                                <p>{item.ordered_quantity} units</p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Unit Price: ${item.unit_cost_price?.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Select a purchase order from the left to view details
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReceiveStock}
                disabled={!selectedOrder || receiveLoading}
              >
                {receiveLoading ? "Processing..." : "Mark as Received"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default StockLevel;
