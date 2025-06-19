import React, { useState, useEffect, useCallback } from "react";
import PageLayout from "@/layouts/PageLayout";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/table/DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const ROLES = ["Owner", "Admin", "Procurement", "Sales", "Inventory"];

const PAGE_SIZE = 10;

const Employees = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [form, setForm] = useState({
    username: "",
    role: ROLES[2],
    password: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Table state
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "username", desc: false }]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [totalCount, setTotalCount] = useState(0);

  // Fetch employees from API
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access");
      let url = `http://localhost:8000/api/employees/?limit=${
        pagination.pageSize
      }&offset=${pagination.pageIndex * pagination.pageSize}`;
      if (globalFilter) url += `&search=${encodeURIComponent(globalFilter)}`;
      if (sorting.length > 0) {
        url += `&ordering=${sorting[0].desc ? "-" : ""}${sorting[0].id}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.results || data); // support both paginated and non-paginated
        setTotalCount(
          data.count ?? (data.results ? data.results.length : data.length)
        );
      } else {
        setError("Failed to fetch employees");
      }
    } catch {
      setError("Failed to fetch employees");
    }
    setLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, sorting]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Dialog open
  const openDialog = (employee = null) => {
    setEditEmployee(employee);
    setForm(
      employee
        ? { username: employee.username, role: employee.role, password: "" }
        : { username: "", role: ROLES[2], password: "" }
    );
    setDialogOpen(true);
  };

  // Add or edit employee
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");
    let url, method, body;
    if (editEmployee) {
      // Edit existing employee
      url = `http://localhost:8000/api/employees/${editEmployee.id}/`;
      method = "PUT";
      body = { username: form.username, role: form.role };
      if (form.password) {
        body.password = form.password;
      }
    } else {
      // Create new employee using /api/create-user/
      url = "http://localhost:8000/api/create-user/";
      method = "POST";
      body = {
        username: form.username,
        password: form.password,
        role: form.role,
      };
    }
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editEmployee ? "Employee updated" : "Employee added");
        setDialogOpen(false);
        fetchEmployees();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save employee");
      }
    } catch {
      toast.error("Failed to save employee");
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!employeeToDelete) return;
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(
        `http://localhost:8000/api/employees/${employeeToDelete.id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        fetchEmployees();
        toast.success("Employee deleted successfully");
      }
    } catch {
      // Optionally handle error
    }
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  // Table handlers
  const handlePaginationChange = (updater) => {
    setPagination((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...prev, ...next };
    });
  };

  const handleGlobalFilterChange = (value) => {
    setGlobalFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleSortingChange = (updater) => {
    setSorting(typeof updater === "function" ? updater(sorting) : updater);
  };

  const roleColor = {
    Owner: "bg-purple-100 text-purple-700 border border-purple-200",
    Admin: "bg-blue-100 text-blue-700 border border-blue-200",
    Procurement: "bg-green-100 text-green-700 border border-green-200",
    Sales: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    Inventory: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  const RoleBadge = ({ value }) => (
    <Badge
      className={
        roleColor[value] || "bg-gray-100 text-gray-700 border border-gray-200"
      }
    >
      {value}
    </Badge>
  );

  const columns = [
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => <RoleBadge value={getValue()} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => openDialog(row.original)}
            title="Edit"
          >
            <FiEdit2 />
          </Button>
          <Dialog
            open={deleteDialogOpen && employeeToDelete?.id === row.original.id}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) setEmployeeToDelete(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => {
                  setEmployeeToDelete(row.original);
                  setDeleteDialogOpen(true);
                }}
                title="Delete"
              >
                <FiTrash2 />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs">
              <DialogHeader>
                <DialogTitle>Delete Employee</DialogTitle>
              </DialogHeader>
              <div>
                Are you sure you want to delete <b>{row.original.username}</b>?
              </div>
              <DialogFooter className="flex flex-row gap-2 pt-2 w-full">
                <Button
                  variant="destructive"
                  className="flex-1 w-full"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 w-full"
                  >
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ),
      enableSorting: false,
    },
  ];

  return (
    <PageLayout
      title="Employees"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Employees
            </h2>
            <p className="text-muted-foreground">
              Manage your employees, assign roles, and more.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="mt-2 md:mt-0 cursor-pointer"
                onClick={() => openDialog()}
              >
                <FaPlus className="mr-2" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-[320px] p-4">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {editEmployee ? "Edit Employee" : "Add Employee"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                  className="w-full"
                />
                {!editEmployee && (
                  <Input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    className="w-full"
                  />
                )}
                {editEmployee && (
                  <Input
                    name="password"
                    type="password"
                    placeholder={
                      editEmployee
                        ? "New Password (leave blank to keep current)"
                        : "Password"
                    }
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full"
                  />
                )}
                <Select
                  value={form.role}
                  onValueChange={(role) => setForm({ ...form, role })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        <Badge
                          className={
                            role === "Owner"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : role === "Admin"
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : role === "Procurement"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : role === "Sales"
                              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }
                        >
                          {role}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter className="flex flex-row gap-2 pt-2 w-full">
                  <Button
                    type="submit"
                    className="flex-1 w-full cursor-pointer"
                  >
                    {editEmployee ? "Update" : "Add"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 w-full cursor-pointer"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable
          columns={columns}
          data={employees}
          filterPlaceholder="Filter employees..."
          loading={loading}
          manualPagination={true}
          manualFiltering={true}
          manualSorting={true}
          pageCount={Math.ceil(totalCount / pagination.pageSize)}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          totalCount={totalCount}
          onPaginationChange={handlePaginationChange}
          onGlobalFilterChange={handleGlobalFilterChange}
          onSortingChange={handleSortingChange}
          globalFilter={globalFilter}
          sorting={sorting}
          error={error}
        />
      </div>
    </PageLayout>
  );
};

export default Employees;
