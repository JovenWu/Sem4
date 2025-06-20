import React, { useState, useEffect } from "react";
import PageLayout from "../layouts/PageLayout";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FiPlus, FiTrash } from "react-icons/fi";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { FaCalendar } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/table/DataTable";
import { PoColumns } from "@/components/table/PoColumns";
import { toast } from "sonner";

const productSchema = z.object({
  product: z.string().min(1, { message: "Product is required" }),
  ordered_quantity: z
    .number()
    .positive({ message: "Quantity must be positive" }),
  unit_cost_price: z.number().positive({ message: "Price must be positive" }),
});

const formSchema = z.object({
  supplier_name: z.string().min(1, { message: "Supplier name is required" }),
  items: z
    .array(productSchema)
    .min(1, { message: "At least one product is required" }),
  order_date: z.date({ required_error: "Order date is required" }),
  expected_delivery_date: z.date({
    required_error: "Expected delivery date is required",
  }),
  status: z.string().min(1, { message: "Status is required" }),
  notes: z.string().optional(),
});

const PurchaseOrder = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [open, setOpen] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);

  // Server-side pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_name: "",
      items: [{ product: "", ordered_quantity: 1, unit_cost_price: 0 }],
      order_date: undefined,
      expected_delivery_date: undefined,
      status: "Ordered",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build API URL with parameters
  const buildApiUrl = (params = {}) => {
    const url = new URL("/api/purchase-order/", window.location.origin);

    url.searchParams.set("page", (params.pageIndex + 1).toString());
    url.searchParams.set("page_size", params.pageSize.toString());

    if (params.search && params.search.trim()) {
      url.searchParams.set("search", params.search.trim());
    }

    if (params.sorting && params.sorting.length > 0) {
      const orderBy = params.sorting
        .map((sort) => {
          const field =
            sort.id === "supplierName"
              ? "supplier_name"
              : sort.id === "orderDate"
              ? "order_date"
              : sort.id === "expectedDeliveryDate"
              ? "expected_delivery_date"
              : sort.id === "status"
              ? "status"
              : sort.id;
          return sort.desc ? `-${field}` : field;
        })
        .join(",");
      url.searchParams.set("ordering", orderBy);
    }

    return url.toString();
  };

  const fetchPurchaseOrders = async (params = {}) => {
    setLoading(true);
    try {
      const apiUrl = buildApiUrl({
        pageIndex: params.pageIndex ?? pagination.pageIndex,
        pageSize: params.pageSize ?? pagination.pageSize,
        search: params.search ?? globalFilter,
        sorting: params.sorting ?? sorting,
      });

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      setPurchaseOrders(data.results || data);
      setPageCount(data.total_pages || 0);
      setTotalCount(data.count || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching purchase orders:", err);
      setError("Failed to load purchase orders. Please try again later.");
      toast.error("Failed to load purchase orders", {
        description: "Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Fetch all products for the form dropdown (no pagination needed)
      const response = await fetch("/api/products/?page_size=1000");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data.results || data);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, sorting]);

  // Handle pagination changes
  const handlePaginationChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Handle search changes
  const handleGlobalFilterChange = (value) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  // Handle sorting changes
  const handleSortingChange = (newSorting) => {
    setSorting(newSorting);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const onSubmit = async (data) => {
    try {
      const formattedOrderDate = data.order_date.toISOString().split("T")[0];
      const formattedDeliveryDate = data.expected_delivery_date
        .toISOString()
        .split("T")[0];

      const requestPayload = {
        supplier_name: data.supplier_name,
        order_date: formattedOrderDate,
        expected_delivery_date: formattedDeliveryDate,
        status: data.status,
        notes: data.notes || "",
        items: data.items.map((item) => ({
          product_id: item.product,
          ordered_quantity: Number(item.ordered_quantity),
          unit_cost_price: Number(item.unit_cost_price),
          received_quantity: 0,
        })),
      };

      const response = await fetch("/api/purchase-order/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
            responseData.message ||
            `HTTP error! Status: ${response.status}`
        );
      }

      toast.success("Purchase order created successfully", {
        description: `Purchase order for ${data.supplier_name} has been created.`,
      });

      fetchPurchaseOrders();

      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to create purchase order", {
        description: error.message || "Please try again later.",
      });
      console.error("Error creating purchase order:", error);
    }
  };

  const calculateTotal = () => {
    const items = form.watch("items");
    return items
      .reduce((total, item) => {
        const quantity = Number(item.ordered_quantity) || 0;
        const price = Number(item.unit_cost_price) || 0;
        return total + quantity * price;
      }, 0)
      .toFixed(2);
  };

  const formattedPurchaseOrders = purchaseOrders.map((po) => {
    const productMap = {};
    products.forEach((product) => {
      productMap[product.product_id] = product.product_name;
    });

    return {
      id: po.po_id,
      supplierName: po.supplier_name,
      orderDate: po.order_date,
      expectedDeliveryDate: po.expected_delivery_date,
      status: po.status,
      products:
        po.items?.map((item) => ({
          name: productMap[item.product_id] || item.product_id,
          quantity: item.ordered_quantity,
          price: item.unit_cost_price,
        })) || [],
      notes: po.notes || "",
    };
  });

  return (
    <PageLayout
      title="Purchase Order"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Purchase Order
            </h2>
            <p className="text-muted-foreground">
              Manage your purchase order here
            </p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="default"
                className="flex gap-2 cursor-pointer"
                data-tour="create-purchase-btn"
              >
                <FiPlus className="w-4 h-4" />
                Create
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Create Purchase Order</SheetTitle>
                <SheetDescription>
                  Fill in the details to create a new purchase order.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 py-6"
                  >
                    <FormField
                      control={form.control}
                      name="supplier_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Supplier Co., Ltd."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Products Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base">Products</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            append({
                              product: "",
                              ordered_quantity: 1,
                              unit_cost_price: 0,
                            })
                          }
                          className="flex items-center gap-1"
                        >
                          <FiPlus className="h-4 w-4" />
                          Add Product
                        </Button>
                      </div>

                      {fields.map((field, index) => (
                        <Card key={field.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">
                                Product {index + 1}
                              </h4>
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="h-8 w-8 p-0 text-destructive"
                                >
                                  <FiTrash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.product`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {products.map((product) => (
                                          <SelectItem
                                            key={product.product_id}
                                            value={product.product_id}
                                          >
                                            {product.product_name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.ordered_quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Quantity</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="1"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              Number(e.target.value)
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`items.${index}.unit_cost_price`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Unit Price</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              Number(e.target.value)
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {form.formState.errors.items?.root && (
                        <p className="text-sm font-medium text-destructive">
                          {form.formState.errors.items.root.message}
                        </p>
                      )}

                      <div className="flex justify-end font-medium">
                        Total: ${calculateTotal()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="order_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Order Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${
                                      !field.value
                                        ? "text-muted-foreground"
                                        : ""
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Select date</span>
                                    )}
                                    <FaCalendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0 z-[]"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expected_delivery_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Expected Delivery</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${
                                      !field.value
                                        ? "text-muted-foreground"
                                        : ""
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Select date</span>
                                    )}
                                    <FaCalendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any additional notes here..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <SheetFooter>
                      <Button type="submit" className="w-full">
                        Create Purchase Order
                      </Button>
                    </SheetFooter>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        <DataTable
          columns={PoColumns}
          data={formattedPurchaseOrders}
          filterPlaceholder="Filter purchase orders..."
          data-tour="purchase-table"
          loading={loading}
          manualPagination={true}
          manualFiltering={true}
          manualSorting={true}
          pageCount={pageCount}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          totalCount={totalCount}
          onPaginationChange={handlePaginationChange}
          onGlobalFilterChange={handleGlobalFilterChange}
          onSortingChange={handleSortingChange}
          globalFilter={searchQuery}
          sorting={sorting}
        />
      </div>
    </PageLayout>
  );
};

export default PurchaseOrder;
