import React, { useState, useEffect, useCallback } from "react";
import PageLayout from "@/layouts/PageLayout";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import DataTable from "@/components/table/DataTable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";

const PAGE_SIZE = 10;

const productSchema = z.object({
  product_name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  unit_price: z.coerce.number().min(0, "Unit price required"),
  competitor_price: z.coerce.number().min(0, "Competitor price required"),
});

const Products = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    product_name: "",
    category: "",
    unit_price: "",
    competitor_price: "",
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [sorting, setSorting] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    product_id: null,
    product_name: "",
    category: "",
    unit_price: "",
    competitor_price: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const {
    register,
    handleSubmit: handleFormSubmit,
    setValue,
    trigger,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: form,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/products/?limit=${pagination.pageSize}&offset=${
        pagination.pageIndex * pagination.pageSize
      }`;
      if (globalFilter) url += `&search=${encodeURIComponent(globalFilter)}`;
      if (sorting.length > 0) {
        url += `&ordering=${sorting[0].desc ? "-" : ""}${sorting[0].id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.results || data);
      setTotalCount(
        data.count ?? (data.results ? data.results.length : data.length)
      );
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [pagination, globalFilter, sorting]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/categories/?page_size=1000&search=${encodeURIComponent(
          categorySearch
        )}`
      );
      const data = await res.json();
      setCategories(data.results || data);
    } catch (err) {
      setCategories([]);
    }
  }, [categorySearch]);

  useEffect(() => {
    if (categoryPopoverOpen) fetchCategories();
  }, [categoryPopoverOpen, categorySearch, fetchCategories]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setValue(e.target.name, e.target.value, { shouldValidate: true });
  };

  const handleSubmit = handleFormSubmit(async (data) => {
    const payload = {
      product_name: data.product_name,
      category: data.category || null,
      unit_price: data.unit_price || null,
      current_stock: 0,
      competitor_price: data.competitor_price || null,
    };
    try {
      const res = await fetch("/api/products/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create product");
      toast.success("Product created");
      setSheetOpen(false);
      setForm({
        product_name: "",
        category: "",
        unit_price: "",
        competitor_price: "",
      });
      reset();
      fetchProducts();
    } catch {
      toast.error("Failed to create product");
    }
  });

  const handleEdit = (product) => {
    setEditForm(product);
    setEditSheetOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/products/${editForm.product_id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update product");
      toast.success("Product updated");
      setEditSheetOpen(false);
      fetchProducts();
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await fetch(`/api/products/${productToDelete.product_id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      toast.success("Product deleted");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const ProductColumns = [
    {
      accessorKey: "product_name",
      header: "Name",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "unit_price",
      header: "Unit Price",
      cell: ({ getValue }) => {
        const value = parseFloat(getValue() || 0);
        return `$ ${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      accessorKey: "competitor_price",
      header: "Competitor Price",
      cell: ({ getValue }) => {
        const value = parseFloat(getValue() || 0);
        return `$ ${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => handleEdit(row.original)}
            title="Edit"
            type="button"
          >
            <FiEdit2 />
          </button>
          <button
            className="text-red-600 hover:underline cursor-pointer"
            onClick={() => handleDelete(row.original)}
            title="Delete"
            type="button"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Helper to get selected category object
  const selectedCategory = categories.find((c) => c.name === form.category);
  const selectedEditCategory = categories.find(
    (c) => c.name === editForm.category
  );

  const handleCategorySelect = (categoryName) => {
    setForm((prev) => ({ ...prev, category: categoryName }));
    setValue("category", categoryName, { shouldValidate: true });
    trigger("category");
    setTimeout(() => {
      document.activeElement.blur();
    }, 0);
  };
  // For edit form, use a local workaround since it's not managed by react-hook-form
  const handleEditCategorySelect = (categoryName) => {
    setEditForm((prev) => ({ ...prev, category: categoryName }));
    setTimeout(() => {
      document.activeElement.blur();
    }, 0);
  };

  return (
    <PageLayout
      title="Products"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Products</h2>
            <p className="text-muted-foreground">Manage your products here</p>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="default" className="flex gap-2">
                <FiPlus className="w-4 h-4" /> Add Product
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="sm:max-w-md overflow-y-auto px-4"
            >
              <SheetHeader className="px-0">
                <SheetTitle>Add Product</SheetTitle>
                <SheetDescription>
                  Fill in the details to add a new product. All fields are
                  required.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-6">
                <div>
                  <label
                    htmlFor="product_name"
                    className="block text-sm font-medium mb-1"
                  >
                    Name<span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("product_name")}
                    id="product_name"
                    name="product_name"
                    placeholder="Product Name"
                    value={form.product_name}
                    onChange={handleInputChange}
                  />
                  {errors.product_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.product_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium mb-1"
                  >
                    Category<span className="text-red-500">*</span>
                  </label>
                  <Popover
                    open={categoryPopoverOpen}
                    onOpenChange={setCategoryPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between ${
                          !form.category ? "text-muted-foreground" : ""
                        }`}
                        type="button"
                      >
                        {selectedCategory?.name ||
                          form.category ||
                          "Select category"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-80">
                      <Command shouldFilter={false}>
                        <CommandList>
                          <CommandEmpty>No category found.</CommandEmpty>
                          {categories.length > 0 && (
                            <CommandGroup heading="Categories">
                              {categories.map((category) => (
                                <CommandItem
                                  key={category.category_id}
                                  value={category.name}
                                  onSelect={() => {
                                    handleCategorySelect(category.name);
                                    setCategoryPopoverOpen(false);
                                  }}
                                >
                                  {category.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.category.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="unit_price"
                    className="block text-sm font-medium mb-1"
                  >
                    Unit Price<span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("unit_price")}
                    id="unit_price"
                    name="unit_price"
                    placeholder="Unit Price"
                    type="number"
                    value={form.unit_price}
                    onChange={handleInputChange}
                  />
                  {errors.unit_price && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.unit_price.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="competitor_price"
                    className="block text-sm font-medium mb-1"
                  >
                    Competitor Price<span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("competitor_price")}
                    id="competitor_price"
                    name="competitor_price"
                    placeholder="Competitor Price"
                    type="number"
                    value={form.competitor_price}
                    onChange={handleInputChange}
                  />
                  {errors.competitor_price && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.competitor_price.message}
                    </p>
                  )}
                </div>
                <SheetFooter>
                  <Button type="submit" className="w-full">
                    Add Product
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        <DataTable
          columns={ProductColumns}
          data={products}
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
        {/* Edit Sheet */}
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetContent
            side="right"
            className="sm:max-w-md overflow-y-auto px-4"
          >
            <SheetHeader>
              <SheetTitle>Edit Product</SheetTitle>
              <SheetDescription>
                Update the product details below.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-6">
              <div>
                <label
                  htmlFor="edit_product_name"
                  className="block text-sm font-medium mb-1"
                >
                  Name<span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit_product_name"
                  name="product_name"
                  placeholder="Product Name"
                  value={editForm.product_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, product_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="edit_category"
                  className="block text-sm font-medium mb-1"
                >
                  Category<span className="text-red-500">*</span>
                </label>
                <Popover
                  open={categoryPopoverOpen}
                  onOpenChange={setCategoryPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={`w-full justify-between ${
                        !editForm.category ? "text-muted-foreground" : ""
                      }`}
                      type="button"
                    >
                      {selectedEditCategory?.name ||
                        editForm.category ||
                        "Select category"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-80">
                    <Command shouldFilter={false}>
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        {categories.length > 0 && (
                          <CommandGroup heading="Categories">
                            {categories.map((category) => (
                              <CommandItem
                                key={category.category_id}
                                value={category.name}
                                onSelect={() => {
                                  handleEditCategorySelect(category.name);
                                  setCategoryPopoverOpen(false);
                                }}
                              >
                                {category.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {/* Show error only if not selected */}
                {!editForm.category && (
                  <p className="text-red-500 text-xs mt-1">
                    Category is required
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="edit_unit_price"
                  className="block text-sm font-medium mb-1"
                >
                  Unit Price<span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit_unit_price"
                  name="unit_price"
                  placeholder="Unit Price"
                  type="number"
                  value={editForm.unit_price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, unit_price: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="edit_competitor_price"
                  className="block text-sm font-medium mb-1"
                >
                  Competitor Price<span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit_competitor_price"
                  name="competitor_price"
                  placeholder="Competitor Price"
                  type="number"
                  value={editForm.competitor_price}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      competitor_price: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <SheetFooter>
                <Button type="submit" className="w-full">
                  Update Product
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete product{" "}
                <b>{productToDelete?.name}</b>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default Products;
