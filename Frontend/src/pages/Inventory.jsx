import React, { useState } from "react";
import PageLayout from "@/layouts/PageLayout";
import { useOutletContext } from "react-router-dom";
import DataTable from "../components/table/DataTable";
import { ProductColumns } from "@/components/table/ProductColumns";
import {
  ProductDataProvider,
  useProductData,
} from "@/components/table/ProductDataProvider";
import { Button } from "@/components/ui/button";
import { FiBarChart2 } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductDialog } from "@/components/ProductDialog";

function InventoryTable({ setForecastDays, initialForecastDays }) {
  const {
    products,
    loading,
    error,
    pagination,
    pageCount,
    totalCount,
    globalFilter,
    sorting,
    handlePaginationChange,
    handleGlobalFilterChange,
    handleSortingChange,
  } = useProductData();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [forecastDays, setLocalForecastDays] = useState(
    initialForecastDays || "weekly"
  );

  const handleRowClick = (product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleForecastChange = (value) => {
    const days = value === "None" ? null : value;
    setLocalForecastDays(days);
    setForecastDays(days);
  };

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-500 mb-2">Error loading product data: {error}</p>
        <p className="text-sm text-gray-600 mb-4">
          Please check your network connection and try again.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Inventory Forecasting
          </h2>
          <p className="text-muted-foreground">
            Manage your products and stocks here
          </p>
        </div>
        <div data-tour="forecast-dropdown">
          <Select
            value={forecastDays?.toString() || "None"}
            onValueChange={handleForecastChange}
          >
            <SelectTrigger className="w-[180px] flex gap-2">
              <FiBarChart2 className="w-4 h-4" />
              <SelectValue placeholder="Forecast Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">No Forecast</SelectItem>
              <SelectItem value="daily">1 Day Forecast</SelectItem>
              <SelectItem value="weekly">7 Day Forecast</SelectItem>
              <SelectItem value="monthly">30 Day Forecast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={ProductColumns}
        data={products}
        filterPlaceholder="Filter products..."
        onRowClick={handleRowClick}
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
        globalFilter={globalFilter}
        sorting={sorting}
      />
      <ProductDialog
        product={selectedProduct}
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
      />
    </>
  );
}

const Inventory = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [forecastDays, setForecastDays] = useState("weekly");

  return (
    <PageLayout
      title="Inventory"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <ProductDataProvider forecastDays={forecastDays}>
          <InventoryTable
            setForecastDays={setForecastDays}
            initialForecastDays={forecastDays}
          />
        </ProductDataProvider>
      </div>
    </PageLayout>
  );
};

export default Inventory;
