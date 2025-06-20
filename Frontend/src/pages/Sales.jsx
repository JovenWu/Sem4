import React, { useState, useEffect, useCallback } from "react";
import PageLayout from "../layouts/PageLayout";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FiShoppingCart, FiTrash2, FiPlus, FiSearch } from "react-icons/fi";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { canAccess } from "../lib/auth";

const itemSchema = z.object({
  product_id: z.string().min(1, { message: "Product is required" }),
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
  promotion_marker: z.boolean().optional(),
});

const formSchema = z.object({
  transaction_date: z
    .date({ required_error: "Date is required" })
    .default(new Date()),
  customer: z.string().optional(),
  items: z
    .array(itemSchema)
    .min(1, { message: "At least one item is required" }),
});

const Sales = () => {
  const getCategoryColor = (category) => {
    if (!category) return "bg-gray-100 text-gray-800";

    const colorOptions = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-amber-100 text-amber-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-rose-100 text-rose-800",
      "bg-teal-100 text-teal-800",
      "bg-orange-100 text-orange-800",
      "bg-cyan-100 text-cyan-800",
    ];

    const categorySum = category
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return colorOptions[categorySum % colorOptions.length];
  };

  const { toggleSidebar, isMobile } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  // Server-side product pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [cartVersion, setCartVersion] = useState(0);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transaction_date: new Date(),
      customer: "",
      items: [],
    },
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (!canAccess("sales", userRole)) {
      window.location.assign("/app/unauthorized");
      return;
    }
  }, []);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  }); // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      console.log("Loading initial data...");
      await fetchCustomers(); // Wait for customers to be loaded
      await fetchCategories();
      console.log("Initial data loaded");
    };

    loadInitialData();
  }, []);
  useEffect(() => {
    if (cartVersion > 0) {
      form.trigger();
    }
  }, [cartVersion, form]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timerId = setTimeout(() => {
      fetchProducts(page, pageSize, productSearch, selectedCategory);
    }, 300);
    setSearchTimeout(timerId);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [productSearch, selectedCategory, page, pageSize]);
  const fetchProducts = async (
    currentPage = 1,
    limit = 12,
    search = "",
    category = "all"
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        page_size: limit,
      });

      if (search && search.trim()) {
        params.append("search", search.trim());
      }

      if (category && category !== "all") {
        params.append("category", category);
      }

      const url = `/api/products/?${params.toString()}`;
      console.log("Fetching products:", url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      let productData = [];
      let total = 0;
      let pageCount = 1;

      if (Array.isArray(data)) {
        productData = data;
        total = data.length;
        pageCount = 1;
      } else if (data && Array.isArray(data.results)) {
        productData = data.results;
        total = data.count || data.total || productData.length;
        pageCount = data.pages || Math.ceil(total / limit) || 1;
      }

      setProducts(productData);
      setTotalProducts(total);
      setTotalPages(pageCount);

      return productData;
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products", {
        description: "Check your connection and try again.",
      });
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      return [];
    } finally {
      setLoading(false);
    }
  };
  const fetchCustomers = async (searchTerm = "") => {
    try {
      // Add search parameter if provided
      const url = searchTerm
        ? `/api/customers/?search=${encodeURIComponent(searchTerm)}&limit=50`
        : "/api/customers/?limit=50";

      console.log("Fetching customers from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Received customer data:", data);
      let customerData = [];
      if (Array.isArray(data)) {
        customerData = data;
      } else if (data && Array.isArray(data.results)) {
        customerData = data.results;
      }
      // Process customer data - map customer_id to id for consistency
      customerData = customerData
        .filter((customer) => customer.customer_id) // Filter out customers without an ID
        .map((customer) => ({
          ...customer,
          // Use customer_id from API but store as id for consistency in our app
          id: customer.customer_id.toString(),
          name: customer.name || "Unknown Customer",
        }));

      console.log("Processed customer data:", customerData);
      setCustomers(customerData);
      return customerData;
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers", {
        description: "Check your connection and try again.",
      });
      return [];
    }
  };
  const fetchCategories = async () => {
    try {
      // Default to empty array
      let categoryData = [];

      try {
        const response = await fetch("/api/categories/");
        if (response.ok) {
          const data = await response.json();
          // Make sure we have an array of category objects with name property
          if (Array.isArray(data)) {
            categoryData = data;
          } else if (data && data.results && Array.isArray(data.results)) {
            categoryData = data.results;
          }
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      } catch (fetchError) {
        console.error("Error fetching categories:", fetchError);
        // Fallback: Extract unique categories from products
        if (products.length > 0) {
          const uniqueCategories = [
            ...new Set(products.map((p) => p.category).filter(Boolean)),
          ];
          categoryData = uniqueCategories.map((name) => ({ name }));
        }
      }

      // Ensure we always set an array, even if empty
      setCategories(categoryData);
    } catch (error) {
      console.error("Error in category processing:", error);
      // Final fallback: just set an empty array
      setCategories([]);
    }
  };
  const handleAddToCart = (product) => {
    if (!product || !product.product_id) {
      toast.error("Invalid product data");
      return;
    }

    const existingItemIndex = fields.findIndex(
      (item) => item.product_id === product.product_id
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const currentQty =
        form.getValues(`items.${existingItemIndex}.quantity_sold`) || 0;
      const newQty = currentQty + 1;

      // Update the quantity
      form.setValue(`items.${existingItemIndex}.quantity_sold`, newQty);

      // Explicitly set the whole items array to force React Hook Form to update
      const updatedFields = form.getValues("items").map((item, idx) => {
        if (idx === existingItemIndex) {
          return { ...item, quantity_sold: newQty };
        }
        return item;
      });

      form.setValue("items", updatedFields);

      // Force React Hook Form to be aware of the change and update the UI
      form.trigger(`items.${existingItemIndex}.quantity_sold`);

      // Increment cart version to force re-render
      setCartVersion((prev) => prev + 1);
    } else {
      // Add new item
      append({
        product_id: product.product_id,
        quantity_sold: 1,
        unit_price_at_sale: product.unit_price || 0,
        discount_applied: 0,
        promotion_marker: false,
      });

      // Force the form to update
      form.trigger();

      // Increment cart version to force re-render
      setCartVersion((prev) => prev + 1);
    }

    // Show different message based on whether item was added or updated
    if (existingItemIndex >= 0) {
      const newQty = form.getValues(`items.${existingItemIndex}.quantity_sold`);
      toast.success(`${product.product_name} quantity updated to ${newQty}`);
    } else {
      toast.success(`${product.product_name} added to cart`);
    }
  };
  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      remove(index);
      // Increment cart version to force re-render after removal
      setCartVersion((prev) => prev + 1);
      return;
    }

    // Get all current items
    const currentItems = form.getValues("items");

    // Update the specific item's quantity
    const updatedItems = currentItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, quantity_sold: newQuantity };
      }
      return item;
    });

    // Set the entire items array with the updated item
    form.setValue("items", updatedItems);

    // Update the specific field to ensure validation triggers
    form.setValue(`items.${index}.quantity_sold`, newQuantity);

    // Force validation to update any dependent fields
    form.trigger(`items.${index}.quantity_sold`);

    // Increment cart version to force re-render
    setCartVersion((prev) => prev + 1);

    // Force the component to update totals immediately
    form.trigger();
  };
  const updateItemDiscount = (index, newDiscount) => {
    const parsedDiscount = parseFloat(newDiscount);
    if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      return;
    }

    // Get all current items
    const currentItems = form.getValues("items");

    // Update the specific item's discount
    const updatedItems = currentItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, discount_applied: parsedDiscount };
      }
      return item;
    });

    // Set the entire items array with the updated item
    form.setValue("items", updatedItems);

    // Update the specific field to ensure validation triggers
    form.setValue(`items.${index}.discount_applied`, parsedDiscount);

    // Force validation to update any dependent fields
    form.trigger(`items.${index}.discount_applied`);

    // Increment cart version to force re-render
    setCartVersion((prev) => prev + 1);

    // Force the component to update totals immediately
    form.trigger();
  };
  // Enhancing the calculateTotal function to force component updates
  const calculateTotal = () => {
    // Get the entire current items array to ensure we have the latest values
    const currentItems = form.getValues("items") || [];

    return currentItems.reduce((total, item, index) => {
      const quantity = item.quantity_sold || 0;
      const price = item.unit_price_at_sale || 0;
      const discount = item.discount_applied || 0;

      const subtotal = quantity * price;
      return total + (subtotal - (subtotal * discount) / 100);
    }, 0);
  };

  const getProductName = (productId) => {
    if (!productId) return "Unknown Product";
    const product = products.find((p) => p.product_id === productId);
    return product ? product.product_name : productId;
  };
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Format data for API expectations - use customer_id instead of customer
      const formData = {
        transaction_date: data.transaction_date,
        customer_id: data.customer || null,
        items: data.items,
      };

      console.log("Submitting data:", formData);

      const response = await fetch("/api/sales-transactions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to create sales transaction"
        );
      }

      toast.success("Sales completed successfully!");
      form.reset({
        transaction_date: new Date(),
        customer: "",
        items: [],
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to complete sale", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  // Effect to fetch customers when search changes or popover opens
  useEffect(() => {
    if (customerPopoverOpen) {
      fetchCustomers(customerSearch);
    }
  }, [customerSearch, customerPopoverOpen]);

  // We'll use all customers since the server now handles the filtering
  const filteredCustomers = customers;

  return (
    <PageLayout title="Sales" toggleSidebar={toggleSidebar} isMobile={isMobile}>
      <div className="mt-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Point of Sale
          </h2>
          <p className="text-muted-foreground">
            Create new sales and print receipts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left section - Bill/Cart */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div>Current Bill</div>
                  <Badge variant="secondary">
                    {fields.length} {fields.length === 1 ? "Item" : "Items"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Add products and complete the sale
                </CardDescription>
              </CardHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent>
                    <div className="space-y-4">
                      {" "}
                      <FormField
                        control={form.control}
                        name="customer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer (Optional)</FormLabel>{" "}
                            <Popover
                              open={customerPopoverOpen}
                              onOpenChange={(open) => {
                                setCustomerPopoverOpen(open);
                                // Fetch initial list when opening
                                if (open) {
                                  fetchCustomers(customerSearch);
                                }
                              }}
                            >
                              {" "}
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {field.value
                                      ? customers.find(
                                          (c) => c.id === field.value
                                        )?.name || "Select customer"
                                      : "Select customer"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                {" "}
                                <Command shouldFilter={false}>
                                  {" "}
                                  <CommandInput
                                    placeholder="Search customers..."
                                    value={customerSearch}
                                    onValueChange={(value) => {
                                      setCustomerSearch(value);
                                      // This triggers the useEffect to fetch customers
                                    }}
                                  />{" "}
                                  <CommandList>
                                    {customerSearch.trim() !== "" &&
                                    filteredCustomers.length === 0 ? (
                                      <CommandEmpty>
                                        No customers found.
                                      </CommandEmpty>
                                    ) : customerSearch.trim() === "" ? (
                                      <CommandEmpty>
                                        Type to search customers.
                                      </CommandEmpty>
                                    ) : null}

                                    {filteredCustomers.length > 0 && (
                                      <CommandGroup heading="Customers">
                                        {filteredCustomers.map((customer) => (
                                          <CommandItem
                                            key={`customer-${customer.id}`}
                                            value={customer.id.toString()}
                                            onSelect={() => {
                                              form.setValue(
                                                "customer",
                                                customer.id
                                              );
                                              // Force React Hook Form to be aware of the change
                                              form.trigger("customer");
                                              setCustomerPopoverOpen(false);
                                            }}
                                          >
                                            <div className="flex items-center">
                                              <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold text-xs">
                                                {customer.name
                                                  ? customer.name[0].toUpperCase()
                                                  : "C"}
                                              </div>
                                              <span>{customer.name}</span>
                                              {customer.email && (
                                                <span className="ml-2 text-muted-foreground text-xs">
                                                  {customer.email}
                                                </span>
                                              )}
                                            </div>{" "}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}

                                    {/* Add button for new customer when search term exists and no exact match */}
                                    {customerSearch.trim() !== "" &&
                                      !filteredCustomers.some(
                                        (customer) =>
                                          customer.name.toLowerCase() ===
                                          customerSearch.trim().toLowerCase()
                                      ) && (
                                        <CommandGroup heading="Actions">
                                          <CommandItem
                                            onSelect={async () => {
                                              setAddingCustomer(true);
                                              try {
                                                const res = await fetch(
                                                  "/api/customers/",
                                                  {
                                                    method: "POST",
                                                    headers: {
                                                      "Content-Type":
                                                        "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                      name: customerSearch.trim(),
                                                      // You can add more fields if required by your API
                                                      email: "",
                                                    }),
                                                  }
                                                );

                                                if (!res.ok)
                                                  throw new Error(
                                                    "Failed to add customer"
                                                  );
                                                const data = await res.json();

                                                // Set the newly created customer as the selected one
                                                // API returns customer_id not id
                                                form.setValue(
                                                  "customer",
                                                  data.customer_id
                                                );
                                                form.trigger("customer");

                                                // Close popover and reset search
                                                setCustomerPopoverOpen(false);
                                                setCustomerSearch("");

                                                // Refresh customers list
                                                fetchCustomers();

                                                toast.success(
                                                  `Customer "${customerSearch.trim()}" added successfully`
                                                );
                                              } catch (error) {
                                                console.error(
                                                  "Error adding customer:",
                                                  error
                                                );
                                                toast.error(
                                                  "Failed to add customer"
                                                );
                                              } finally {
                                                setAddingCustomer(false);
                                              }
                                            }}
                                            className="text-primary cursor-pointer"
                                            disabled={addingCustomer}
                                          >
                                            <FiPlus className="mr-2" />
                                            Add customer "
                                            {customerSearch.trim()}"
                                          </CommandItem>
                                        </CommandGroup>
                                      )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />{" "}
                      {/* Cart Items */}
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Items {fields.length > 0 ? `(${fields.length})` : ""}
                        </div>
                        <ScrollArea className="h-[300px] border rounded-md p-2">
                          {fields.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                              <FiShoppingCart className="h-12 w-12 mb-3 text-gray-400 dark:text-gray-300" />
                              <p className="text-lg font-medium mb-1">
                                Cart is empty
                              </p>
                              <p className="text-sm">
                                Add products from the catalog →
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {fields.map((item, index) => (
                                <div
                                  key={item.id}
                                  className="flex flex-col border-b pb-3 last:border-b-0 last:pb-0 mb-3 last:mb-0"
                                >
                                  {" "}
                                  <div className="flex justify-between items-center mb-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
                                    <div className="font-medium text-slate-800 dark:text-white">
                                      {getProductName(item.product_id)}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => {
                                        remove(index);
                                        setCartVersion((prev) => prev + 1);
                                      }}
                                    >
                                      <FiTrash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-4">
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Quantity
                                      </div>
                                      <div className="flex items-center border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-slate-600"
                                          onClick={() =>
                                            updateItemQuantity(
                                              index,
                                              (form.getValues(
                                                `items.${index}.quantity_sold`
                                              ) || 0) - 1
                                            )
                                          }
                                        >
                                          -
                                        </Button>
                                        <Input
                                          type="number"
                                          className="w-12 h-8 text-center border-0 p-0"
                                          min="1"
                                          value={
                                            form.getValues(
                                              `items.${index}.quantity_sold`
                                            ) || 1
                                          }
                                          onChange={(e) =>
                                            updateItemQuantity(
                                              index,
                                              parseInt(e.target.value) || 1
                                            )
                                          }
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-slate-600"
                                          onClick={() =>
                                            updateItemQuantity(
                                              index,
                                              (form.getValues(
                                                `items.${index}.quantity_sold`
                                              ) || 0) + 1
                                            )
                                          }
                                        >
                                          +
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="col-span-4">
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Unit Price
                                      </div>
                                      <div className="flex items-center">
                                        <span className="text-sm text-slate-600 mr-1">
                                          $
                                        </span>
                                        <Input
                                          type="number"
                                          className="w-full h-8 bg-white"
                                          step="0.01"
                                          value={form.getValues(
                                            `items.${index}.unit_price_at_sale`
                                          )}
                                          onChange={(e) => {
                                            form.setValue(
                                              `items.${index}.unit_price_at_sale`,
                                              parseFloat(e.target.value) || 0
                                            );
                                            // Force update
                                            updateItemQuantity(
                                              index,
                                              form.getValues(
                                                `items.${index}.quantity_sold`
                                              )
                                            );
                                          }}
                                        />
                                      </div>
                                    </div>

                                    <div className="col-span-4">
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Discount
                                      </div>
                                      <div className="flex items-center">
                                        <Input
                                          type="number"
                                          className="w-full h-8 bg-white"
                                          min="0"
                                          max="100"
                                          value={
                                            form.getValues(
                                              `items.${index}.discount_applied`
                                            ) || 0
                                          }
                                          onChange={(e) =>
                                            updateItemDiscount(
                                              index,
                                              e.target.value
                                            )
                                          }
                                        />
                                        <span className="text-sm ml-1 text-slate-600">
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center mt-3">
                                    <div className="text-xs text-muted-foreground">
                                      {form.getValues(
                                        `items.${index}.quantity_sold`
                                      ) || 1}{" "}
                                      × $
                                      {(
                                        form.getValues(
                                          `items.${index}.unit_price_at_sale`
                                        ) || 0
                                      ).toFixed(2)}
                                      {(form.getValues(
                                        `items.${index}.discount_applied`
                                      ) || 0) > 0 &&
                                        ` (-${form.getValues(
                                          `items.${index}.discount_applied`
                                        )}%)`}
                                    </div>
                                    <div className="text-sm font-medium">
                                      ${calculateItemTotal(index).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col border-t pt-4">
                    <div className="w-full flex justify-between items-center text-lg font-medium mb-4">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="w-full flex flex-col gap-3">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <div className="text-muted-foreground">Total:</div>
                        <div className="text-2xl text-primary">
                          ${calculateTotal().toFixed(2)}
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            form.reset({
                              transaction_date: new Date(),
                              customer: "",
                              items: [],
                            });
                          }}
                        >
                          Clear All
                        </Button>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={fields.length === 0 || loading}
                        >
                          {loading ? "Processing..." : "Complete Sale"}
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          {/* Right section - Product Catalog */}
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Product Catalog</CardTitle>{" "}
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      className="pl-10"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setPage(1); // Reset to first page on search change
                      }}
                    />
                  </div>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setPage(1); // Reset to first page on category change
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Array.isArray(categories) &&
                        categories.map((category, index) => (
                          <SelectItem
                            key={index}
                            value={
                              (category && category.name) || `category-${index}`
                            }
                          >
                            {category && category.name
                              ? category.name
                              : `Category ${index + 1}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>{" "}
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading products...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {products.length > 0 ? (
                        products.map((product) => (
                          <Card
                            key={
                              product.product_id || `product-${Math.random()}`
                            }
                            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart({ ...product });
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div
                                  className="font-medium truncate"
                                  title={
                                    product.product_name || "Unnamed Product"
                                  }
                                >
                                  {product.product_name || "Unnamed Product"}
                                </div>
                                <Badge
                                  className={getCategoryColor(product.category)}
                                >
                                  {product.category || "Uncategorized"}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-lg font-bold">
                                  ${(product.unit_price || 0).toFixed(2)}
                                </div>{" "}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="p-0 w-8 h-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart({ ...product });
                                  }}
                                >
                                  <FiPlus />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          No products found. Try adjusting your search or
                          category filter.
                        </div>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between space-x-2 py-4 mt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {(page - 1) * pageSize + 1}-
                          {Math.min(page * pageSize, totalProducts)} of{" "}
                          {totalProducts} products
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center justify-center text-sm px-2">
                            Page {page} of {totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
  function calculateItemTotal(index) {
    // Get the current items array to ensure we have the latest values
    const currentItems = form.getValues("items") || [];
    const item = currentItems[index] || {};

    const quantity = item.quantity_sold || 0;
    const price = item.unit_price_at_sale || 0;
    const discount = item.discount_applied || 0;

    const subtotal = quantity * price;
    return subtotal - (subtotal * discount) / 100;
  }
};

export default Sales;
