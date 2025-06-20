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

const PAGE_SIZE = 10;

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

const Suppliers = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    contact_person: "",
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
    supplier_id: null,
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: form,
  });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/suppliers/?limit=${pagination.pageSize}&offset=${
        pagination.pageIndex * pagination.pageSize
      }`;
      if (globalFilter) url += `&search=${encodeURIComponent(globalFilter)}`;
      if (sorting.length > 0) {
        url += `&ordering=${sorting[0].desc ? "-" : ""}${sorting[0].id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setSuppliers(data.results || data);
      setTotalCount(
        data.count ?? (data.results ? data.results.length : data.length)
      );
    } catch (err) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [pagination, globalFilter, sorting]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = handleFormSubmit(async (data) => {
    try {
      const res = await fetch("/api/suppliers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create supplier");
      toast.success("Supplier created");
      setSheetOpen(false);
      setForm({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
      });
      reset();
      fetchSuppliers();
    } catch {
      toast.error("Failed to create supplier");
    }
  });

  const handleEdit = (supplier) => {
    setEditForm(supplier);
    setEditSheetOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/suppliers/${editForm.supplier_id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update supplier");
      toast.success("Supplier updated");
      setEditSheetOpen(false);
      fetchSuppliers();
    } catch {
      toast.error("Failed to update supplier");
    }
  };

  const handleDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      const res = await fetch(
        `/api/suppliers/${supplierToDelete.supplier_id}/`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete supplier");
      toast.success("Supplier deleted");
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
      fetchSuppliers();
    } catch {
      toast.error("Failed to delete supplier");
    }
  };

  // Define columns here so they can access the handlers
  const SupplierColumns = [
    {
      accessorKey: "supplier_id",
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
      accessorKey: "contact_person",
      header: "Contact Person",
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
      title="Suppliers"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Suppliers</h2>
            <p className="text-muted-foreground">Manage your suppliers here</p>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="default" className="flex gap-2">
                <FiPlus className="w-4 h-4" /> Add Supplier
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="sm:max-w-md overflow-y-auto px-4"
            >
              <SheetHeader className="px-0">
                <SheetTitle>Add Supplier</SheetTitle>
                <SheetDescription>
                  Fill in the details to add a new supplier. All fields are
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
                    placeholder="PT Sumber Makmur"
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
                    htmlFor="contact_person"
                    className="block text-sm font-medium mb-1"
                  >
                    Contact Person
                  </label>
                  <Input
                    {...register("contact_person")}
                    id="contact_person"
                    name="contact_person"
                    placeholder="Budi Santoso"
                    value={form.contact_person}
                    onChange={handleInputChange}
                  />
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
                    placeholder="info@sumbermakmur.co.id"
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
                    Add Supplier
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        <DataTable
          columns={SupplierColumns}
          data={suppliers}
          loading={loading}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          filterPlaceholder="Filter suppliers..."
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
              <SheetTitle>Edit Supplier</SheetTitle>
              <SheetDescription>
                Update the supplier details below.
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
                  placeholder="PT Sumber Makmur"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="edit_contact_person"
                  className="block text-sm font-medium mb-1"
                >
                  Contact Person
                </label>
                <Input
                  id="edit_contact_person"
                  name="contact_person"
                  placeholder="Budi Santoso"
                  value={editForm.contact_person}
                  onChange={(e) =>
                    setEditForm({ ...editForm, contact_person: e.target.value })
                  }
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
                  placeholder="info@sumbermakmur.co.id"
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
                  Update Supplier
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Supplier</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete supplier{" "}
                <b>{supplierToDelete?.name}</b>? This action cannot be undone.
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

export default Suppliers;
