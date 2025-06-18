import React, { useEffect, useState } from "react";
import PageLayout from "../layouts/PageLayout";
import { useOutletContext } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { LineChart, BarChart } from "../components/ui/chart";
import { Skeleton } from "../components/ui/skeleton";

const Dashboard = () => {
  const { toggleSidebar, isMobile, setRunTour } = useOutletContext();
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    netRevenue: 0,
    totalTransactions: 0,
    averageTransactionValue: 0,
    totalDiscountGiven: 0,
    understockItems: 0,
    overstockItems: 0,
  });
  const [salesData, setSalesData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard summary data
        const dashboardResponse = await fetch(
          `/api/dashboard-summary/?year=${selectedYear}`
        );
        if (!dashboardResponse.ok) {
          throw new Error(
            `Dashboard API returned status: ${dashboardResponse.status}`
          );
        }
        const dashboardData = await dashboardResponse.json();

        // Fetch products data for stock status
        const productsResponse = await fetch(
          "/api/products/?forecast=true&model=weekly"
        );
        if (!productsResponse.ok) {
          throw new Error(
            `Products API returned status: ${productsResponse.status}`
          );
        }
        const productsData = await productsResponse.json();
        const products = Array.isArray(productsData) ? productsData : [];

        // Calculate metrics from dashboard data
        calculateMetrics(dashboardData, products);

        // Prepare chart data from dashboard data
        prepareChartData(dashboardData);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  const calculateMetrics = (dashboardData, products = []) => {
    // Count understock and overstock items from products
    let understockItems = 0;
    let overstockItems = 0;

    products.forEach((product) => {
      if (product?.stock_status?.status === "Understock") {
        understockItems++;
      } else if (product?.stock_status?.status === "Overstock") {
        overstockItems++;
      }
    });

    setMetrics({
      totalProducts: products.length,
      totalSales: dashboardData.total_sales_volume || 0,
      totalRevenue: dashboardData.total_revenue || 0,
      netRevenue: dashboardData.net_revenue || 0,
      totalTransactions: dashboardData.total_transactions || 0,
      averageTransactionValue: dashboardData.average_transaction_value || 0,
      totalDiscountGiven: dashboardData.total_discount_given || 0,
      understockItems,
      overstockItems,
    });
  };

  const prepareChartData = (dashboardData) => {
    const monthlyData = dashboardData.monthly_chart_data || [];

    // Extract month abbreviations and data
    const months = monthlyData.map((item) => item.month_abbr);
    const salesVolume = monthlyData.map((item) => item.sales_volume);
    const revenue = monthlyData.map((item) => item.revenue);
    const netRevenue = monthlyData.map((item) => item.net_revenue);

    // Sales volume chart
    setSalesData({
      labels: months,
      datasets: [
        {
          label: `Sales Volume (${dashboardData.year})`,
          data: salesVolume,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    });

    // Revenue chart
    setRevenueData({
      labels: months,
      datasets: [
        {
          label: `Revenue (${dashboardData.year})`,
          data: revenue,
          backgroundColor: "rgba(124, 58, 237, 0.8)",
          borderRadius: 4,
        },
        {
          label: `Net Revenue (${dashboardData.year})`,
          data: netRevenue,
          backgroundColor: "rgba(34, 197, 94, 0.8)",
          borderRadius: 4,
        },
      ],
    });
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Skeleton loader for cards
  const MetricCardSkeleton = () => (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-[100px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[80px]" />
      </CardContent>
    </Card>
  );

  // Skeleton loader for charts
  const ChartSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[150px] mb-2" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent className="h-80">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <PageLayout
        title="Dashboard"
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold text-red-500 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Dashboard"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="space-y-6 p-4">
        {/* Welcome section with tour button and year selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor your inventory and sales performance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setRunTour(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Tutorial
            </button>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(metrics.totalRevenue)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalTransactions.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card data-tour="understock-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Understock Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {metrics.understockItems}
                  </div>
                </CardContent>
              </Card>
              <Card data-tour="overstock-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Overstock Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">
                    {metrics.overstockItems}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Sales Volume Overview</CardTitle>
                  <CardDescription>
                    Monthly sales volume for {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {salesData && <LineChart data={salesData} />}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>
                    Monthly revenue and net revenue for {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {revenueData && <BarChart data={revenueData} />}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
