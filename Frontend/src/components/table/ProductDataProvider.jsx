import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";

const ProductDataContext = createContext(null);

export function useProductData() {
  return useContext(ProductDataContext);
}

export function ProductDataProvider({ children, forecastDays = null }) {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for client-side operations
  const [forecastLoading, setForecastLoading] = useState(false);
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

  // Debounced search
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client-side filtering function
  const filterProducts = (products, searchTerm) => {
    if (!searchTerm) return products;

    const lowercaseSearch = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.productName.toLowerCase().includes(lowercaseSearch) ||
        product.category.toLowerCase().includes(lowercaseSearch) ||
        product.status.toLowerCase().includes(lowercaseSearch) ||
        product.productId.toLowerCase().includes(lowercaseSearch)
    );
  };

  // Client-side sorting function
  const sortProducts = (products, sorting) => {
    if (!sorting || sorting.length === 0) return products;

    return [...products].sort((a, b) => {
      for (const sort of sorting) {
        let aVal = a[sort.id];
        let bVal = b[sort.id];

        // Handle numeric values (remove $ and convert to number)
        if (sort.id === "unitPrice" || sort.id === "competitorPrice") {
          aVal = parseFloat(aVal.replace("$", ""));
          bVal = parseFloat(bVal.replace("$", ""));
        } else if (sort.id === "currentStock") {
          aVal = parseInt(aVal);
          bVal = parseInt(bVal);
        }

        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        if (aVal < bVal) comparison = -1;

        if (comparison !== 0) {
          return sort.desc ? -comparison : comparison;
        }
      }
      return 0;
    });
  };

  // Client-side pagination function
  const paginateProducts = (products, pageIndex, pageSize) => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return products.slice(startIndex, endIndex);
  };

  // Apply client-side operations
  useEffect(() => {
    if (allProducts.length > 0 && forecastDays) {
      // Filter products
      const filtered = filterProducts(allProducts, globalFilter);

      // Sort products
      const sorted = sortProducts(filtered, sorting);

      // Update pagination info
      const totalFiltered = sorted.length;
      const calculatedPageCount = Math.ceil(
        totalFiltered / pagination.pageSize
      );
      setPageCount(calculatedPageCount);
      setTotalCount(totalFiltered);

      // Paginate products
      const paginated = paginateProducts(
        sorted,
        pagination.pageIndex,
        pagination.pageSize
      );
      setProducts(paginated);
    }
  }, [allProducts, globalFilter, sorting, pagination, forecastDays]);

  // Build API URL with pagination, search, sorting, and forecast parameters
  const buildApiUrl = useCallback((baseUrl, params = {}) => {
    const url = new URL(baseUrl, window.location.origin);

    // Add pagination
    url.searchParams.set("page", (params.pageIndex + 1).toString());
    url.searchParams.set("page_size", params.pageSize.toString());

    // Add search
    if (params.search && params.search.trim()) {
      url.searchParams.set("search", params.search.trim());
    }

    // Add sorting
    if (params.sorting && params.sorting.length > 0) {
      const orderBy = params.sorting
        .map((sort) => {
          const field =
            sort.id === "productName"
              ? "product_name"
              : sort.id === "unitPrice"
              ? "unit_price"
              : sort.id === "currentStock"
              ? "current_stock"
              : sort.id === "competitorPrice"
              ? "competitor_price"
              : sort.id;
          return sort.desc ? `-${field}` : field;
        })
        .join(",");
      url.searchParams.set("ordering", orderBy);
    }

    // Add forecast parameter
    if (params.forecast) {
      url.searchParams.set("forecast", "true");
      if (params.forecastModel) {
        url.searchParams.set("model", params.forecastModel);
      }
    }

    return url.toString();
  }, []);

  const fetchProductData = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        setError(null);

        // For forecast requests, we'll get all data and handle pagination client-side
        // For non-forecast requests, we'll use server-side pagination
        const useClientSidePagination = !!forecastDays;

        const apiUrl = buildApiUrl("/api/products/", {
          pageIndex: useClientSidePagination
            ? 0
            : params.pageIndex ?? pagination.pageIndex,
          pageSize: useClientSidePagination
            ? 1000
            : params.pageSize ?? pagination.pageSize, // Large number to get all
          search: useClientSidePagination ? "" : params.search ?? globalFilter,
          sorting: useClientSidePagination ? [] : params.sorting ?? sorting,
          forecast: !!forecastDays,
          forecastModel: forecastDays,
        });

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Error fetching products: ${response.statusText}`);
        }

        const data = await response.json();

        // Check if data has the expected structure
        if (!data || typeof data !== "object") {
          throw new Error("Invalid response format: Expected object");
        }

        // Handle different response formats
        let results = [];
        let totalPages = 0;
        let totalCount = 0;

        if (Array.isArray(data)) {
          // Direct array response (forecast API)
          results = data;
          totalPages = Math.ceil(data.length / pagination.pageSize);
          totalCount = data.length;
        } else if (data.results && Array.isArray(data.results)) {
          // Paginated response (regular API)
          results = data.results;
          totalPages =
            data.total_pages ||
            Math.ceil((data.count || 0) / pagination.pageSize);
          totalCount = data.count || 0;
        } else {
          // Unexpected format
          console.warn("Unexpected API response format:", data);
          results = [];
          totalPages = 0;
          totalCount = 0;
        }

        // Transform the data with proper null checks
        const transformedData = results.map((product) => ({
          productName: product?.product_name || "Unknown Product",
          productId: product?.product_id || "N/A",
          category: product?.category || "Uncategorized",
          unitPrice: `$${(product?.unit_price || 0).toFixed(2)}`,
          competitorPrice: `$${(product?.competitor_price || 0).toFixed(2)}`,
          currentStock: (product?.current_stock || 0).toString(),
          status:
            product?.stock_status?.status ||
            getStockStatus(product?.current_stock || 0),
          forecast: product?.forecast
            ? `${product.forecast.total_predicted_units || 0} units`
            : forecastDays
            ? "Loading forecast..."
            : "No forecast selected",
          // Additional forecast data with null checks
          pendingOrders: product?.stock_status?.pending_orders || 0,
          totalAvailable:
            product?.stock_status?.total_available ||
            product?.current_stock ||
            0,
          predictedSales: product?.stock_status?.predicted_sales || "N/A",
          requiredStock: product?.stock_status?.required_stock
            ? product.stock_status.required_stock.toFixed(1)
            : "N/A",
          overstockThreshold: product?.stock_status?.overstock_threshold
            ? product.stock_status.overstock_threshold.toFixed(1)
            : "N/A",
        }));

        if (useClientSidePagination) {
          // Store all products for client-side operations
          setAllProducts(transformedData);
          // Client-side pagination will be handled by useEffect
        } else {
          // Server-side pagination
          setProducts(transformedData);
          setPageCount(totalPages);
          setTotalCount(totalCount);
          setAllProducts([]); // Clear all products when using server-side
        }
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch product data:", err);
        setProducts([]);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [
      buildApiUrl,
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
      forecastDays,
    ]
  );

  // Helper function to determine stock status when not provided by backend
  const getStockStatus = (stock) => {
    if (stock === 0) return "Out of Stock";
    if (stock < 50) return "Understock";
    if (stock > 200) return "Overstock";
    return "Optimal Stock";
  };

  // Initial load and when dependencies change
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  // Handle pagination changes
  const handlePaginationChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  // Handle search changes
  const handleGlobalFilterChange = useCallback((value) => {
    setSearchQuery(value);
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Handle sorting changes
  const handleSortingChange = useCallback((newSorting) => {
    setSorting(newSorting);
    // Reset to first page when sorting
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const fetchProductById = async (productId) => {
    try {
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error(`Error fetching product: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`Failed to fetch product ${productId}:`, err);
      throw err;
    }
  };

  return (
    <ProductDataContext.Provider
      value={{
        products,
        loading,
        forecastLoading,
        error,
        fetchProductById,
        // Server-side pagination props
        pagination,
        pageCount,
        totalCount,
        globalFilter: searchQuery,
        sorting,
        handlePaginationChange,
        handleGlobalFilterChange,
        handleSortingChange,
        refetch: () => fetchProductData(),
      }}
    >
      {children}
    </ProductDataContext.Provider>
  );
}

export function useFetchProductById() {
  const context = useContext(ProductDataContext);
  if (!context) {
    throw new Error(
      "useFetchProductById must be used within a ProductDataProvider"
    );
  }
  return context.fetchProductById;
}
