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

const PAGE_SIZE = 10;

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

const Customers = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
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
    customer_id: null,
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: form,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/customers/?limit=${pagination.pageSize}&offset=${
        pagination.pageIndex * pagination.pageSize
      }`;
      if (globalFilter) url += `&search=${encodeURIComponent(globalFilter)}`;
      if (sorting.length > 0) {
        url += `&ordering=${sorting[0].desc ? "-" : ""}${sorting[0].id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data.results || data);
      setTotalCount(
        data.count ?? (data.results ? data.results.length : data.length)
      );
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [pagination, globalFilter, sorting]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = handleFormSubmit(async (data) => {
    try {
      const res = await fetch("/api/customers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create customer");
      toast.success("Customer created");
      setSheetOpen(false);
      setForm({ name: "", phone: "", email: "", address: "" });
      reset();
      fetchCustomers();
    } catch {
      toast.error("Failed to create customer");
    }
  });

  const handleEdit = (customer) => {
    setEditForm(customer);
    setEditSheetOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/customers/${editForm.customer_id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update customer");
      toast.success("Customer updated");
      setEditSheetOpen(false);
      fetchCustomers();
    } catch {
      toast.error("Failed to update customer");
    }
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const res = await fetch(
        `/api/customers/${customerToDelete.customer_id}/`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete customer");
      toast.success("Customer deleted");
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const CustomerColumns = [
    {
      accessorKey: "customer_id",
      header: "ID",
      enableHiding: true,
      show: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ getValue }) => getValue() || "-",
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

  return (
    <PageLayout
      title="Customers"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Customers</h2>
            <p className="text-muted-foreground">Manage your customers here</p>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="default" className="flex gap-2">
                <FiPlus className="w-4 h-4" /> Add Customer
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="sm:max-w-md overflow-y-auto px-4"
            >
              <SheetHeader className="px-0">
                <SheetTitle>Add Customer</SheetTitle>
                <SheetDescription>
                  Fill in the details to add a new customer. All fields are
                  optional except name.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-1"
                  >
                    Name<span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("name")}
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleInputChange}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium mb-1"
                  >
                    Phone
                  </label>
                  <Input
                    {...register("phone")}
                    id="phone"
                    name="phone"
                    placeholder="0812-3456-7890"
                    value={form.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1"
                  >
                    Email
                  </label>
                  <Input
                    {...register("email")}
                    id="email"
                    name="email"
                    placeholder="johndoe@email.com"
                    value={form.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium mb-1"
                  >
                    Address
                  </label>
                  <Input
                    {...register("address")}
                    id="address"
                    name="address"
                    placeholder="Jl. Merdeka No. 123, Jakarta"
                    value={form.address}
                    onChange={handleInputChange}
                  />
                </div>
                <SheetFooter>
                  <Button type="submit" className="w-full">
                    Add Customer
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        <DataTable
          columns={CustomerColumns}
          data={customers}
          loading={loading}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          filterPlaceholder="Filter customers..."
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
              <SheetTitle>Edit Customer</SheetTitle>
              <SheetDescription>
                Update the customer details below.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-6">
              <div>
                <label
                  htmlFor="edit_name"
                  className="block text-sm font-medium mb-1"
                >
                  Name<span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit_name"
                  name="name"
                  placeholder="John Doe"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="edit_phone"
                  className="block text-sm font-medium mb-1"
                >
                  Phone
                </label>
                <Input
                  id="edit_phone"
                  name="phone"
                  placeholder="0812-3456-7890"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="edit_email"
                  className="block text-sm font-medium mb-1"
                >
                  Email
                </label>
                <Input
                  id="edit_email"
                  name="email"
                  placeholder="johndoe@email.com"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="edit_address"
                  className="block text-sm font-medium mb-1"
                >
                  Address
                </label>
                <Input
                  id="edit_address"
                  name="address"
                  placeholder="Jl. Merdeka No. 123, Jakarta"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                />
              </div>
              <SheetFooter>
                <Button type="submit" className="w-full">
                  Update Customer
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete customer{" "}
                <b>{customerToDelete?.name}</b>? This action cannot be undone.
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

export default Customers;
