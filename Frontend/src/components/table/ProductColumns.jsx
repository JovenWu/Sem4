import { useProductData } from "./ProductDataProvider";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

const ForecastCell = ({ value }) => {
  const { forecastLoading } = useProductData();

  if (forecastLoading) {
    return (
      <div className="flex items-center">
        <Spinner className="h-4 w-4 mr-2" />
      </div>
    );
  }

  if (value && value.includes("units")) {
    return <div className="text-blue-600 font-medium">{value}</div>;
  }

  return <div>{value}</div>;
};

const StatusCell = ({ value }) => {
  let variant = "outline";

  switch (value) {
    case "Overstock":
      variant = "bg-red-50 text-red-700 border-red-200";
      break;
    case "Understock":
      variant = "bg-yellow-50 text-yellow-700 border-yellow-200";
      break;
    case "Optimal Stock":
      variant = "bg-green-50 text-green-700 border-green-200";
      break;
    default:
      variant = "bg-gray-50 text-gray-700 border-gray-200";
  }

  return <Badge className={variant}>{value}</Badge>;
};

export const ProductColumns = [
  {
    accessorKey: "productName",
    header: "Product Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
  },
  {
    accessorKey: "competitorPrice",
    header: "Competitor Price",
  },
  {
    accessorKey: "currentStock",
    header: "Current Stock",
  },
  {
    accessorKey: "status",
    header: "Stock Status",
    cell: ({ getValue }) => <StatusCell value={getValue()} />,
    headerProps: { "data-tour": "stock-status-column" },
  },
  {
    accessorKey: "forecast",
    header: "Forecast",
    cell: ({ getValue }) => <ForecastCell value={getValue()} />,
    headerProps: { "data-tour": "forecast-column" },
  },
];
