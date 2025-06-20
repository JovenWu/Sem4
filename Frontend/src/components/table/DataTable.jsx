import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { VscSettings } from "react-icons/vsc";
import { BiHide } from "react-icons/bi";

export default function DataTable({
  data,
  columns,
  filterPlaceholder = "Filter...",
  onRowClick,
  loading = false,
  // Server-side props
  pageCount = 0,
  pageIndex = 0,
  pageSize = 10,
  totalCount = 0,
  onPaginationChange,
  onGlobalFilterChange,
  onSortingChange,
  globalFilter = "",
  sorting = [],
  manualPagination = false,
  manualFiltering = false,
  manualSorting = false,
  columnVisibility: propColumnVisibility,
  onColumnVisibilityChange: propOnColumnVisibilityChange,
  ...props
}) {
  // If parent passes columnVisibility, use it as controlled; otherwise, set initial state from columns
  const getDefaultColumnVisibility = () => {
    const visibility = {};
    columns.forEach((col) => {
      if (col.accessorKey && (col.visible === false || col.show === false)) {
        visibility[col.accessorKey] = false;
      }
    });
    return visibility;
  };
  const [columnVisibility, setColumnVisibility] = useState(
    getDefaultColumnVisibility()
  );

  // Use controlled or internal state
  const effectiveColumnVisibility =
    propColumnVisibility !== undefined
      ? propColumnVisibility
      : columnVisibility;
  const handleColumnVisibilityChange =
    propOnColumnVisibilityChange || setColumnVisibility;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Server-side configuration
    manualPagination,
    manualFiltering,
    manualSorting,
    pageCount: manualPagination ? pageCount : undefined,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    state: {
      pagination: { pageIndex, pageSize },
      globalFilter,
      sorting,
      columnVisibility: effectiveColumnVisibility,
    },
    onPaginationChange: manualPagination ? onPaginationChange : undefined,
    onGlobalFilterChange: manualFiltering ? onGlobalFilterChange : undefined,
    onSortingChange: manualSorting ? onSortingChange : undefined,
  });

  return (
    <div {...props}>
      <div className="flex items-center justify-between py-4">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder={filterPlaceholder}
            value={globalFilter ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              if (manualFiltering && onGlobalFilterChange) {
                onGlobalFilterChange(value);
              } else {
                table.setGlobalFilter(value);
              }
            }}
            className="w-full"
          />
        </div>

        {/* ...existing dropdown menu code... */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ml-auto flex items-center gap-2 cursor-pointer"
            >
              <VscSettings className="h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2 py-1.5">
              <p className="font-medium text-sm">Toggle columns</p>
            </div>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.columnDef.header}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden border rounded-md">
        <div className="overflow-x-auto">
          <Table className="min-w-full text-sm">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-2 md:px-4 py-2 text-left font-medium"
                      {...(header.column.columnDef.headerProps || {})}
                    >
                      {header.column.getCanSort() ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            className="cursor-pointer"
                          >
                            <Button
                              variant="ghost"
                              className="p-0 h-8 font-medium flex items-center"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              <span className="ml-2">
                                {header.column.getIsSorted() === "asc" ? (
                                  <FaSortUp className="h-4 w-4" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <FaSortDown className="h-4 w-4" />
                                ) : (
                                  <FaSort className="h-4 w-4 opacity-50" />
                                )}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => {
                                if (manualSorting && onSortingChange) {
                                  onSortingChange([
                                    { id: header.column.id, desc: false },
                                  ]);
                                } else {
                                  header.column.toggleSorting(false);
                                }
                              }}
                              className="flex items-center"
                            >
                              <FaSortUp className="mr-2 h-3.5 w-3.5" />
                              <span>Sort Ascending</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (manualSorting && onSortingChange) {
                                  onSortingChange([
                                    { id: header.column.id, desc: true },
                                  ]);
                                } else {
                                  header.column.toggleSorting(true);
                                }
                              }}
                              className="flex items-center"
                            >
                              <FaSortDown className="mr-2 h-3.5 w-3.5" />
                              <span>Sort Descending</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                header.column.toggleVisibility(false)
                              }
                              className="flex items-center"
                            >
                              <BiHide className="mr-2 h-3.5 w-3.5" />
                              <span>Hide</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={
                      onRowClick ? "cursor-pointer hover:bg-muted" : ""
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-2 md:px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>No results found</span>
                      {globalFilter && (
                        <span className="text-sm">
                          Try adjusting your search terms
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Updated Pagination */}
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                if (manualPagination && onPaginationChange) {
                  onPaginationChange({ pageIndex: 0, pageSize: Number(value) });
                } else {
                  table.setPageSize(Number(value));
                }
              }}
            >
              <SelectTrigger className="h-8 w-[70px] cursor-pointer">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end space-x-2">
            <div className="flex items-center text-sm text-muted-foreground">
              {manualPagination ? (
                <>
                  Page {pageIndex + 1} of {pageCount} ({totalCount} total items)
                </>
              ) : (
                <>
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0 flex items-center justify-center"
                onClick={() => {
                  if (manualPagination && onPaginationChange) {
                    onPaginationChange({ pageIndex: pageIndex - 1, pageSize });
                  } else {
                    table.previousPage();
                  }
                }}
                disabled={
                  manualPagination
                    ? pageIndex === 0
                    : !table.getCanPreviousPage()
                }
              >
                <span className="sr-only">Go to previous page</span>
                <FaChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 flex items-center justify-center"
                onClick={() => {
                  if (manualPagination && onPaginationChange) {
                    onPaginationChange({ pageIndex: pageIndex + 1, pageSize });
                  } else {
                    table.nextPage();
                  }
                }}
                disabled={
                  manualPagination
                    ? pageIndex >= pageCount - 1
                    : !table.getCanNextPage()
                }
              >
                <span className="sr-only">Go to next page</span>
                <FaChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
