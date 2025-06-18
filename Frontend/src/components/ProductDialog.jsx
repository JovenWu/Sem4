import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { useFetchProductById } from "./table/ProductDataProvider";

export function ProductDialog({ product, isOpen, setIsOpen }) {
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchProductById = useFetchProductById();

  useEffect(() => {
    async function loadProductDetails() {
      if (isOpen && product) {
        setLoading(true);
        try {
          const details = await fetchProductById(product.productId);
          setProductDetails(details);
          setError(null);
        } catch (err) {
          setError("Failed to load product details");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }

    loadProductDetails();
  }, [isOpen, product, fetchProductById]);

  if (!product) return null;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Overstock":
        return "bg-red-50 text-red-700 border-red-200";
      case "Understock":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Optimal Stock":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product.productName}</DialogTitle>
          <DialogDescription>Product ID: {product.productId}</DialogDescription>
          <Separator className="mt-2" />
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <div className="text-red-500 py-4 text-center">{error}</div>
        ) : (
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p>{product.category}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <Badge className={getStatusBadgeClass(product.status)}>
                  {product.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Unit Price
                </h3>
                <p>{product.unitPrice}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Competitor Price
                </h3>
                <p>{product.competitorPrice}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Current Stock
                </h3>
                <p>{product.currentStock}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Forecast</h3>
                <p className="text-blue-600">{product.forecast}</p>
              </div>

              {product.predictedSales && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Predicted Sales
                  </h3>
                  <p>{product.predictedSales}</p>
                </div>
              )}

              {product.requiredStock && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Required Stock
                  </h3>
                  <p>{product.requiredStock}</p>
                </div>
              )}

              {product.overstockThreshold && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Overstock Threshold
                  </h3>
                  <p>{product.overstockThreshold}</p>
                </div>
              )}
            </div>

            {productDetails && productDetails.historical_data && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Historical Data
                </h3>
                <div className="text-xs text-gray-500">
                  {/* Here you could add a chart or more detailed information */}
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
