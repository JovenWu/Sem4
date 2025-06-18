import React, { useState, useEffect } from "react";
import PageLayout from "../layouts/PageLayout";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FiPlus, FiCheck, FiChevronDown } from "react-icons/fi";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { FaCalendar } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import DataTable from "@/components/table/DataTable";
import { SalesColumns } from "@/components/table/SalesColumns";
import { toast } from "sonner";

const formSchema = z.object({
  transaction_date: z.date({ required_error: "Date is required" }),
  productName: z.string().min(1, { message: "Product name is required" }),
  quantity_sold: z
    .number()
    .int()
    .positive({ message: "Quantity must be positive" }),
  unit_price_at_sale: z
    .number()
    .positive({ message: "Price must be positive" }),
  discount_applied: z
    .number()
    .min(0, { message: "Discount cannot be negative" })
    .max(100, { message: "Discount cannot exceed 100%" }),
});

const SalesOrder = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [open, setOpen] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transaction_date: undefined,
      productName: "",
      quantity_sold: 1,
      unit_price_at_sale: 0,
      discount_applied: 0,
    },
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
    const url = new URL("/api/sales-records/", window.location.origin);

    url.searchParams.set("page", (params.pageIndex + 1).toString());
    url.searchParams.set("page_size", params.pageSize.toString());

    if (params.search && params.search.trim()) {
      url.searchParams.set("search", params.search.trim());
    }

    if (params.sorting && params.sorting.length > 0) {
      const orderBy = params.sorting
        .map((sort) => {
          const field =
            sort.id === "productName"
              ? "product_id"
              : sort.id === "transaction_date"
              ? "transaction_date"
              : sort.id === "quantity_sold"
              ? "quantity_sold"
              : sort.id === "unit_price_at_sale"
              ? "unit_price_at_sale"
              : sort.id;
          return sort.desc ? `-${field}` : field;
        })
        .join(",");
      url.searchParams.set("ordering", orderBy);
    }

    return url.toString();
  };

  // Fetch sales data with server-side parameters
  const fetchSalesData = async (params = {}) => {
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

      setSalesData(data.results || data);
      setPageCount(data.total_pages || 0);
      setTotalCount(data.count || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError("Failed to load sales data. Please try again later.");
      toast.error("Failed to load sales data", {
        description: "Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
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

  // When product is selected, update the price
  const onProductChange = (productName) => {
    const selectedProduct = productList.find(
      (product) => product.name === productName
    );
    if (selectedProduct) {
      form.setValue("productName", selectedProduct.name);
    }
  };

  // Calculate total amount with discount
  const calculateTotal = () => {
    const quantity = form.watch("quantity_sold") || 0;
    const price = form.watch("unit_price_at_sale") || 0;
    const discount = form.watch("discount_applied") || 0;

    const subtotal = quantity * price;
    const discountAmount = subtotal * (discount / 100);
    return (subtotal - discountAmount).toFixed(2);
  };

  const onSubmit = async (data) => {
    try {
      // Get product ID based on product name
      const selectedProduct = productList.find(
        (product) => product.name === data.productName
      );

      if (!selectedProduct) {
        toast.error("Invalid product selected");
        return;
      }

      // Format date to ISO string
      const formattedDate = data.transaction_date.toISOString();

      // Create request payload
      const requestPayload = {
        product_id: selectedProduct.id,
        transaction_date: formattedDate,
        quantity_sold: data.quantity_sold,
        unit_price_at_sale: data.unit_price_at_sale,
        discount_applied: data.discount_applied,
        promotion_marker: data.discount_applied > 0, // true if discount exists
      };

      // Send POST request using fetch instead of axios
      const response = await fetch("/api/sales-records/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      // Show success toast
      toast.success("Sales order created successfully", {
        description: `Sales order for ${data.productName} has been created.`,
      });

      // Refresh sales data
      fetchSalesData();

      // Reset the form and close the sheet
      setOpen(false);
      form.reset();
    } catch (error) {
      // Show error toast if submission fails
      toast.error("Failed to create sales order", {
        description: error.message || "Please try again later.",
      });
      console.error("Error creating sales order:", error);
    }
  };

  // Helper function to calculate total for each sale
  const calculateSaleTotal = (quantity, price, discount) => {
    const subtotal = quantity * price;
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };
  // Format data for the DataTable
  const formattedSalesData = salesData.map((sale) => {
    // Find product name from product_id
    const product = productList.find((p) => p.id === sale.product_id);

    return {
      sales_record_id: sale.sales_record_id,
      transaction_date: sale.transaction_date,
      product_id: sale.product_id,
      productName: product ? product.name : "Unknown Product",
      quantity_sold: sale.quantity_sold,
      unit_price_at_sale: sale.unit_price_at_sale,
      discount_applied: sale.discount_applied,
      total: calculateSaleTotal(
        sale.quantity_sold,
        sale.unit_price_at_sale,
        sale.discount_applied
      ),
      promotion_marker: sale.promotion_marker,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
    };
  });

  return (
    <PageLayout
      title="Sales Order"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Sales Order
            </h2>
            <p className="text-muted-foreground">
              Manage your sales orders here
            </p>
          </div>{" "}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="default"
                className="flex gap-2 cursor-pointer"
                data-tour="create-sales-btn"
              >
                <FiPlus className="w-4 h-4" />
                Create
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Create Sales Order</SheetTitle>
                <SheetDescription>
                  Fill in the details to create a new sales order.
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
                      name="transaction_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value ? "text-muted-foreground" : ""
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

                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => {
                        const [popoverOpen, setPopoverOpen] = useState(false);

                        return (
                          <FormItem className="flex flex-col">
                            <FormLabel>Product</FormLabel>
                            <Popover
                              open={popoverOpen}
                              onOpenChange={setPopoverOpen}
                            >
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={`w-full justify-between ${
                                      !field.value
                                        ? "text-muted-foreground"
                                        : ""
                                    }`}
                                    onClick={() => setPopoverOpen(true)}
                                  >
                                    {field.value
                                      ? productList.find(
                                          (product) =>
                                            product.name === field.value
                                        )?.name
                                      : "Select a product"}
                                    <FiChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="p-0 w-[300px]"
                                align="start"
                                side="bottom"
                                sideOffset={5}
                              >
                                <div className="border rounded-md shadow-sm">
                                  <div className="flex items-center border-b px-3">
                                    <FiChevronDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                    <input
                                      className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                      placeholder="Search for a product..."
                                      value={field.input || ""}
                                      onChange={(e) => {
                                        field.input = e.target.value;
                                        form.setValue("_dummy", Math.random());
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>

                                  {/* Scrollable area */}
                                  <div className="relative">
                                    <div
                                      className="h-[200px] overflow-y-scroll scrollbar-thin border-t"
                                      onClick={(e) => e.stopPropagation()}
                                      onWheel={(e) => e.stopPropagation()}
                                    >
                                      {productList
                                        .filter(
                                          (product) =>
                                            !field.input ||
                                            product.name
                                              .toLowerCase()
                                              .includes(
                                                (
                                                  field.input || ""
                                                ).toLowerCase()
                                              )
                                        )
                                        .map((product) => (
                                          <div
                                            key={product.id}
                                            className={`relative flex cursor-pointer select-none items-center px-2 py-2 text-sm hover:bg-slate-100 ${
                                              field.value === product.name
                                                ? "bg-slate-100 font-medium"
                                                : ""
                                            }`}
                                            onClick={() => {
                                              field.onChange(product.name);
                                              onProductChange(product.name);
                                              setPopoverOpen(false);
                                            }}
                                          >
                                            <FiCheck
                                              className={`mr-2 h-4 w-4 ${
                                                field.value === product.name
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              }`}
                                            />
                                            {product.name}
                                          </div>
                                        ))}
                                      {productList.filter(
                                        (product) =>
                                          !field.input ||
                                          product.name
                                            .toLowerCase()
                                            .includes(
                                              (field.input || "").toLowerCase()
                                            )
                                      ).length === 0 && (
                                        <div className="p-2 text-sm text-center text-muted-foreground">
                                          No products found.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity_sold"
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
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="unit_price_at_sale"
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
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="discount_applied"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="py-2 px-4 bg-slate-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold">${calculateTotal()}</span>
                      </div>
                    </div>

                    <SheetFooter>
                      <Button type="submit">Create Sales Order</Button>
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
          columns={SalesColumns}
          data={formattedSalesData}
          filterPlaceholder="Filter sales orders..."
          data-tour="sales-table"
          loading={loading}
          // Server-side props
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

export default SalesOrder;
