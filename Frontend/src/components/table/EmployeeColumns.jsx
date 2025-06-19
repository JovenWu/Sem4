import { Button } from "@/components/ui/button";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";

const roleColor = {
  Owner: "bg-purple-100 text-purple-700 border border-purple-200",
  Admin: "bg-blue-100 text-blue-700 border border-blue-200",
  Procurement: "bg-green-100 text-green-700 border border-green-200",
  Sales: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Inventory: "bg-gray-100 text-gray-700 border border-gray-200",
};

const RoleCell = ({ value }) => (
  <Badge className={roleColor[value] || "bg-gray-100 text-gray-700 border border-gray-200"}>
    {value}
  </Badge>
);

export const EmployeeColumns = ({ onRowClick, refetch }) => [
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => <RoleCell value={getValue()} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onRowClick(row.original)}
          title="Edit"
        >
          <FaEdit />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={async (e) => {
            e.stopPropagation();
            if (!window.confirm("Are you sure you want to delete this employee?")) return;
            const token = localStorage.getItem("access");
            try {
              const res = await fetch(
                `http://localhost:8000/api/employees/${row.original.id}/`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (res.ok) {
                refetch?.();
              }
            } catch {
              // Optionally handle error
            }
          }}
          title="Delete"
        >
          <FaTrash />
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];