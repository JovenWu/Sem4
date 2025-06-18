import os
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
from .daily_model import daily_model
from .weekly_model import weekly_model
from .monthly_model import monthly_model
from ..models import Products, SalesRecords
from django.db.models import Sum, Count

MODEL_DIR = Path(__file__).resolve().parent / "models"

class MultiModelPredictor:    
    """
    A class that manages multiple prediction models (daily, weekly, monthly)
    and handles predictions based on the specified time-horizon.
    """
    def __init__(self):
        self.models = {
            "daily": daily_model,
            "weekly": weekly_model,
            "monthly": monthly_model        }
    def _calculate_simple_moving_average(self, product_id, reference_date, days=30):
        """
        Calculate moving average
        
        Args:
            product_id: Product ID
            reference_date: Reference date for calculation  
            days: Number of days to look back for moving average
            
        Returns:
            float: Moving average
        """
        from datetime import timedelta
        
        if isinstance(reference_date, str):
            reference_date = pd.to_datetime(reference_date).date()
        elif hasattr(reference_date, 'date'):
            reference_date = reference_date.date()
        
        end_date = reference_date
        start_date = end_date - timedelta(days=days)
        
        total_sales = SalesRecords.objects.filter(
            product_id=product_id,
            transaction_date__date__gte=start_date,
            transaction_date__date__lt=end_date
        ).aggregate(total=Sum('quantity_sold'))['total'] or 0
        
        moving_average = total_sales / days
        return round(moving_average, 2)
    
    def get_product_data(self, product_ids, days_history=90, time_horizon="daily"):
        """
        Collect product data from Django models for the specified products
        
        Args:
            product_ids: List of product IDs to collect data for
            days_history: Number of days of historical data to collect
            time_horizon: Time horizon for demand forecast scaling ("daily", "weekly", "monthly")
            
        Returns:
            pandas.DataFrame: Product data
        """
        products = Products.objects.select_related("category").filter(product_id__in=product_ids)
        if not products:
            raise ValueError(f"No products found with IDs: {product_ids}")
        
        end_date = pd.Timestamp.now().normalize()
        start_date = end_date - pd.Timedelta(days=days_history)
        
        sales_query = SalesRecords.objects.select_related("product", "product__category").filter(
            product__product_id__in=product_ids,
            transaction_date__date__gte=start_date.date(),
            transaction_date__date__lte=end_date.date()
        ).order_by("transaction_date")
        data_rows = []
        product_demand_forecasts = {}
        
        scale_factor = {
            "daily": 1.5,
            "weekly": 7.5,
            "monthly": 30
        }.get(time_horizon, 1)
        
        for product in products:
            daily_average = self._calculate_simple_moving_average(
                product.product_id, end_date.date()
            )
            scaled_forecast = daily_average * scale_factor
            product_demand_forecasts[product.product_id] = scaled_forecast
        
        for sale in sales_query:
            demand_forecast = product_demand_forecasts.get(sale.product.product_id, 0.0)
            
            row = {
                "Date": sale.transaction_date.date(),
                "Store ID": 1,
                "Product ID": sale.product.product_id,
                "Category": sale.product.category.name if sale.product.category else "Unknown",
                "Inventory Level": sale.product.current_stock,
                "Units Sold": sale.quantity_sold,
                "Price": sale.unit_price_at_sale,
                "Discount": sale.discount_applied,
                "Weather Condition": "Normal",
                "Holiday/Promotion": 1 if sale.promotion_marker else 0,
                "Seasonality": "Regular",
                "Demand Forecast": demand_forecast
            }
            data_rows.append(row)
        
        df = pd.DataFrame(data_rows)
        for product in products:
            if product.product_id not in df["Product ID"].values:
                demand_forecast = product_demand_forecasts.get(product.product_id, 0.0)
                
                placeholder_row = {
                    "Date": end_date.date(),
                    "Store ID": 1,
                    "Product ID": product.product_id,
                    "Category": product.category.name if product.category else "Unknown",
                    "Inventory Level": product.current_stock,
                    "Units Sold": 0,
                    "Price": product.unit_price,
                    "Discount": 0,
                    "Weather Condition": "Normal",
                    "Holiday/Promotion": 0,
                    "Seasonality": "Regular",
                    "Demand Forecast": demand_forecast
                }
                df = pd.concat([df, pd.DataFrame([placeholder_row])], ignore_index=True)
        
        df["Date"] = pd.to_datetime(df["Date"])
        df = df.sort_values(by=["Product ID", "Date"])
        
        return df
    
    def predict_future_sales(self, product_ids, time_horizon="daily", n_periods=1, last_date=None):
        """
        Make predictions using the specified model type
        
        Args:
            product_ids (list): List of product IDs to predict
            time_horizon (str): "daily", "weekly", or "monthly"
            n_periods (int): Number of periods to predict
            last_date (str): The last known date in YYYY-MM-DD format
            
        Returns:
            DataFrame with predictions
        """
        if time_horizon not in self.models:
            raise ValueError(f"Model for {time_horizon} predictions not available")
        
        model = self.models[time_horizon]
        if not model:
            raise ValueError(f"Model for {time_horizon} predictions not available")
        product_data = self.get_product_data(product_ids, time_horizon=time_horizon)
        
        target_date = pd.to_datetime(last_date) if last_date else None
        
        dates = []
        if target_date is None:
            target_date = pd.Timestamp.now().normalize()
            
        if time_horizon == "daily":
            for i in range(n_periods):
                dates.append(target_date + pd.Timedelta(days=i+1))
        elif time_horizon == "weekly":
            for i in range(n_periods):
                dates.append(target_date + pd.Timedelta(weeks=i+1))
        elif time_horizon == "monthly":
            for i in range(n_periods):
                dates.append(target_date + pd.Timedelta(days=(i+1)*30))
                
        features = model.prepare_features(product_data, target_date)
        
        predictions = None
        try:
            predictions = model.predict(features)
        except Exception as e:
            print(f"Error making predictions with {time_horizon} model: {str(e)}")
            raise
        
        results = []
        if predictions is not None:
            prediction_per_period = predictions / n_periods
            
            for product_idx, product_id in enumerate(product_ids):
                for date_idx, date in enumerate(dates):
                    results.append({
                        "Date": date.strftime("%Y-%m-%d"),
                        "Product_ID": product_id,
                        "Predicted_Units_Sold": float(prediction_per_period[product_idx]),
                        "Model_Type": time_horizon
                    })
        
        return pd.DataFrame(results)

predictor = MultiModelPredictor()

def get_product_sales_prediction(product_ids, time_horizon="weekly", periods=1, last_date=None):
    """
    Get sales predictions for products
    
    Args:
        product_ids (list): List of product IDs
        time_horizon (str): "daily", "weekly" or "monthly"
        periods (int): Number of periods to predict
        last_date (str): Last known date in YYYY-MM-DD format
        
    Returns:
        dict or DataFrame: Prediction results
    """
    try:
        predictions_df = predictor.predict_future_sales(
            product_ids=product_ids,
            time_horizon=time_horizon,
            n_periods=periods,
            last_date=last_date
        )
        
        if predictions_df.empty:
            return {"error": "No predictions could be generated"}
        
        summary_df = summarize_predictions(predictions_df)
        
        return summary_df.to_dict(orient="records")
    except Exception as e:
        print(f"Error making prediction: {e}")
        return {"error": str(e)}

def summarize_predictions(predictions_df):
    """
    Summarize predictions by product
    
    Args:
        predictions_df (DataFrame): DataFrame with predictions
        
    Returns:
        DataFrame: Summarized predictions
    """
    if predictions_df.empty:
        return pd.DataFrame(columns=["Product_ID", "Total_Predicted_Units_Sold", "Forecast_Periods", "Model_Type"])
    
    predictions_df["Predicted_Units_Sold"] = pd.to_numeric(predictions_df["Predicted_Units_Sold"], errors="coerce")
    predictions_df.dropna(subset=["Predicted_Units_Sold"], inplace=True)
    
    summary = predictions_df.groupby(["Product_ID", "Model_Type"], as_index=False)["Predicted_Units_Sold"].sum()
    summary.rename(columns={"Predicted_Units_Sold": "Total_Predicted_Units_Sold"}, inplace=True)
    
    period_counts = predictions_df.groupby(["Product_ID", "Model_Type"], as_index=False)["Date"].nunique()
    period_counts.rename(columns={"Date": "Forecast_Periods"}, inplace=True)
    
    result = pd.merge(summary, period_counts, on=["Product_ID", "Model_Type"], how="left")
    
    result["Actual_Forecast_Days"] = result.apply(
        lambda row: row["Forecast_Periods"] * (1 if row["Model_Type"] == "daily" else 
                                              7 if row["Model_Type"] == "weekly" else 30), 
        axis=1
    )
    
    result["Total_Predicted_Units_Sold"] = result["Total_Predicted_Units_Sold"].round(0).astype(int)
    
    return result
