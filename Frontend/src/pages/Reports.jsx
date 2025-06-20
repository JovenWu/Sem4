import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bar, Line, Pie } from "react-chartjs-2";
import { format, subDays } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  // State for date range and period selection
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [period, setPeriod] = useState('daily');
  const [activeTab, setActiveTab] = useState('sales');

  // State for report data
  const [salesData, setSalesData] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [inventoryStatus, setInventoryStatus] = useState(null);
  const [inventoryMovement, setInventoryMovement] = useState(null);
  
  // Loading states
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingMovement, setLoadingMovement] = useState(false);

  // Function to fetch sales report data
  const fetchSalesReport = async () => {
    setLoadingSales(true);
    try {
      // Safely handle the date range
      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(
        `http://localhost:8000/api/reports/sales/?start_date=${startDate}&end_date=${endDate}&period=${period}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
      } else {
        console.error('Failed to fetch sales report');
      }
    } catch (error) {
      console.error('Error fetching sales report:', error);
    } finally {
      setLoadingSales(false);
    }
  };

  // Function to fetch top products data
  const fetchTopProducts = async () => {
    setLoadingTop(true);
    try {
      // Safely handle the date range
      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(
        `http://localhost:8000/api/reports/top_products/?start_date=${startDate}&end_date=${endDate}&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        setTopProducts(data);
      } else {
        console.error('Failed to fetch top products');
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    } finally {
      setLoadingTop(false);
    }
  };

  // Function to fetch inventory status data
  const fetchInventoryStatus = async () => {
    setLoadingInventory(true);
    try {
      const response = await fetch('http://localhost:8000/api/reports/inventory_status/');
      
      if (response.ok) {
        const data = await response.json();
        setInventoryStatus(data);
      } else {
        console.error('Failed to fetch inventory status');
      }
    } catch (error) {
      console.error('Error fetching inventory status:', error);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Function to fetch inventory movement data
  const fetchInventoryMovement = async () => {
    setLoadingMovement(true);
    try {
      // Safely handle the date range
      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(
        `http://localhost:8000/api/reports/inventory_movement/?start_date=${startDate}&end_date=${endDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setInventoryMovement(data);
      } else {
        console.error('Failed to fetch inventory movement');
      }
    } catch (error) {
      console.error('Error fetching inventory movement:', error);
    } finally {
      setLoadingMovement(false);
    }
  };

  // Fetch data when component mounts or when filters change
  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSalesReport();
      fetchTopProducts();
    } else if (activeTab === 'inventory') {
      fetchInventoryStatus();
      fetchInventoryMovement();
    }
  }, [activeTab]);

  // Handle filter changes
  const handleApplyFilters = () => {
    if (activeTab === 'sales') {
      fetchSalesReport();
      fetchTopProducts();
    } else if (activeTab === 'inventory') {
      fetchInventoryMovement();
    }
  };

  // Prepare chart data for sales report
  const salesChartData = salesData?.sales_data ? {
    labels: salesData.sales_data.map(item => item.date),
    datasets: [
      {
        label: 'Total Sales ($)',
        data: salesData.sales_data.map(item => item.total_sales),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      }
    ],
  } : null;

  // Prepare chart data for top products
  const topProductsChartData = topProducts?.top_products ? {
    labels: topProducts.top_products.map(item => item.product__product_name),
    datasets: [
      {
        label: 'Revenue ($)',
        data: topProducts.top_products.map(item => item.total_revenue),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
      }
    ],
  } : null;

  // Prepare chart data for inventory status
  const inventoryStatusChartData = inventoryStatus?.summary ? {
    labels: ['Out of Stock', 'Low Stock', 'In Stock'],
    datasets: [
      {
        data: [
          inventoryStatus.summary.stock_status.out_of_stock,
          inventoryStatus.summary.stock_status.low_stock,
          inventoryStatus.summary.stock_status.in_stock,
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
      }
    ],
  } : null;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>

      <Tabs
        defaultValue="sales"
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
        </TabsList>
        
        {/* Sales Reports Tab */}
        <TabsContent value="sales" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Report Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-grow min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <DateRangePicker 
                    value={dateRange}
                    onValueChange={setDateRange}
                  />
                </div>
                <div className="w-40">
                  <label className="text-sm font-medium mb-2 block">Period</label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleApplyFilters}
                    disabled={loadingSales || loadingTop}
                  >
                    {(loadingSales || loadingTop) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Apply Filters
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Summary */}
          {salesData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Sales</CardTitle>
                  <CardDescription>Period total</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${salesData.summary.total_sales.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Orders</CardTitle>
                  <CardDescription>Number of transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{salesData.summary.total_orders.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Avg Order Value</CardTitle>
                  <CardDescription>Average revenue per order</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${salesData.summary.average_order_value.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
              <CardDescription>
                {salesData ? (
                  `${format(new Date(salesData.start_date), 'MMM dd, yyyy')} - 
                   ${format(new Date(salesData.end_date), 'MMM dd, yyyy')}`
                ) : 'Loading...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loadingSales ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : salesChartData ? (
                <Line 
                  data={salesChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true }
                    },
                    plugins: { 
                      legend: { position: 'top' },
                      title: {
                        display: true,
                        text: `${period.charAt(0).toUpperCase() + period.slice(1)} Sales`
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                {topProducts ? (
                  `Top 10 products by revenue (${format(new Date(topProducts.start_date), 'MMM dd, yyyy')} - 
                   ${format(new Date(topProducts.end_date), 'MMM dd, yyyy')})`
                ) : 'Loading...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  {loadingTop ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : topProductsChartData ? (
                    <Bar 
                      data={topProductsChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: { beginAtZero: true }
                        },
                        plugins: { 
                          legend: { display: false },
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
                <div className="overflow-auto max-h-[400px]">
                  {loadingTop ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : topProducts?.top_products ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.top_products.map((product) => (
                          <TableRow key={product.product__product_id}>
                            <TableCell className="font-medium">{product.product__product_name}</TableCell>
                            <TableCell className="text-right">{product.total_quantity}</TableCell>
                            <TableCell className="text-right">${product.total_revenue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Inventory Reports Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Filters for Inventory Movement */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Movement Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-grow min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <DateRangePicker 
                    value={dateRange}
                    onValueChange={setDateRange}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleApplyFilters}
                    disabled={loadingMovement}
                  >
                    {loadingMovement ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Apply Filters
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Status */}
          {inventoryStatus && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{inventoryStatus.summary.total_products.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{inventoryStatus.summary.total_items.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${inventoryStatus.summary.total_value.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Stock Status</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">In Stock ({inventoryStatus.summary.stock_status.in_stock_percent}%)</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Low Stock ({inventoryStatus.summary.stock_status.low_stock_percent}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm">Out of Stock ({inventoryStatus.summary.stock_status.out_of_stock_percent}%)</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-[350px]">
                    {loadingInventory ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : inventoryStatusChartData ? (
                      <Pie 
                        data={inventoryStatusChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { 
                            legend: { position: 'top' },
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No data available
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Stock Status Summary</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Badge className="bg-green-500">In Stock</Badge>
                          </TableCell>
                          <TableCell className="text-right">{inventoryStatus.summary.stock_status.in_stock}</TableCell>
                          <TableCell className="text-right">{inventoryStatus.summary.stock_status.in_stock_percent}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Badge className="bg-yellow-500">Low Stock</Badge>
                          </TableCell>
                          <TableCell className="text-right">{inventoryStatus.summary.stock_status.low_stock}</TableCell>
                          <TableCell className="text-right">{inventoryStatus.summary.stock_status.low_stock_percent}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Badge className="bg-red-500">Out of Stock</Badge>
                          </TableCell>
                          <TableCell className="text-right">{inventoryStatus.summary.stock_status.out_of_stock}</TableCell>
                          <TableCell className="text-right">{inventoryStatus.summary.stock_status.out_of_stock_percent}%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Inventory Movement */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Movement Report</CardTitle>
              <CardDescription>
                {inventoryMovement ? (
                  `${format(new Date(inventoryMovement.start_date), 'MMM dd, yyyy')} - 
                   ${format(new Date(inventoryMovement.end_date), 'MMM dd, yyyy')}`
                ) : 'Loading...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                {loadingMovement ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : inventoryMovement?.movements ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">In</TableHead>
                        <TableHead className="text-right">Out</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead className="text-right">Cost Value</TableHead>
                        <TableHead className="text-right">Sales Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryMovement.movements.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-right">{item.quantity_in}</TableCell>
                          <TableCell className="text-right">{item.quantity_out}</TableCell>
                          <TableCell className="text-right">
                            <HoverCard>
                              <HoverCardTrigger>
                                <span className={`font-medium ${item.net_quantity > 0 ? 'text-green-600' : item.net_quantity < 0 ? 'text-red-600' : ''}`}>
                                  {item.net_quantity > 0 ? `+${item.net_quantity}` : item.net_quantity}
                                </span>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm font-medium">Movement Details</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>Incoming Stock:</span>
                                    <span>{item.quantity_in}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Outgoing Stock:</span>
                                    <span>{item.quantity_out}</span>
                                  </div>
                                  <Separator className="my-2" />
                                  <div className="flex justify-between font-medium">
                                    <span>Net Change:</span>
                                    <span className={item.net_quantity > 0 ? 'text-green-600' : item.net_quantity < 0 ? 'text-red-600' : ''}>
                                      {item.net_quantity > 0 ? `+${item.net_quantity}` : item.net_quantity}
                                    </span>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </TableCell>
                          <TableCell className="text-right">${item.cost_value.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.sales_value.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
