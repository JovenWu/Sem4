import React, { useState, useEffect } from "react";
import PageLayout from "../layouts/PageLayout";
import { useOutletContext } from "react-router-dom";
import * as z from "zod";
import DataTable from "@/components/table/DataTable";
import { SalesColumns } from "@/components/table/SalesColumns";
import { toast } from "sonner";
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
  transaction_date: z.date({ required_error: "Date is required" }),
  items: z
    .array(itemSchema)
    .min(1, { message: "At least one item is required" }),
});

const SalesHistory = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const buildApiUrl = (params = {}) => {
    const url = new URL("/api/sales-transactions/", window.location.origin);

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
    const userRole = localStorage.getItem("userRole");
    if (!canAccess("salesHistory", userRole)) {
      window.location.assign("/app/unauthorized");
      return;
    }
    fetchSalesData();
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, sorting]);

  const handlePaginationChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleGlobalFilterChange = (value) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleSortingChange = (newSorting) => {
    setSorting(newSorting);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const formattedSalesData = salesData.map((transaction) => {
    return {
      transaction_id: transaction.transaction_id,
      transaction_date: transaction.transaction_date,
      customer: transaction.customer,
      items: transaction.items.map((item) => ({
        product_id: item.product_id,
        quantity_sold: item.quantity_sold,
        unit_price_at_sale: item.unit_price_at_sale,
        discount_applied: item.discount_applied,
        promotion_marker: item.promotion_marker,
      })),
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    };
  });

  return (
    <PageLayout
      title="Sales History"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Sales History
            </h2>
            <p className="text-muted-foreground">
              View your sales history here
            </p>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error}
          </div>
        )}
        <DataTable
          columns={SalesColumns}
          data={formattedSalesData}
          filterPlaceholder="Filter sales history..."
          data-tour="sales-table"
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

export default SalesHistory;
