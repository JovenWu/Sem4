import os
import pickle
import pandas as pd
import numpy as np
from pathlib import Path

MODEL_DIR = Path(__file__).resolve().parent / 'models'

class DailyModel:
    """
    XGBoost model for daily sales predictions
    """
    def __init__(self, store_id=None):
        self.store_id = store_id if store_id is not None else 1
        self.model = None
        self.feature_info = None
        self.encoder_info = None
        self.processed_feature_columns = None
        self.load_model_components()
    
    def load_model_components(self):
        """
        Load all model components for daily predictions
        """
        try:
            model_path = os.path.join(MODEL_DIR, f'inventory_xgb_daily_store_{self.store_id}_model.pkl')
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                print(f"Successfully loaded daily model for store {self.store_id}")
            else:
                print(f"Daily model file not found at {model_path}")
            
            features_path = os.path.join(MODEL_DIR, f'inventory_xgb_daily_store_{self.store_id}_features.pkl')
            if os.path.exists(features_path):
                with open(features_path, 'rb') as f:
                    self.feature_info = pickle.load(f)
                self.processed_feature_columns = self.feature_info.get('processed_feature_columns_list', [])
                print(f"Successfully loaded daily model features")
            else:
                print(f"Daily features file not found at {features_path}")
            
            encoder_path = os.path.join(MODEL_DIR, f'inventory_xgb_daily_store_{self.store_id}_encoder.pkl')
            if os.path.exists(encoder_path):
                with open(encoder_path, 'rb') as f:
                    self.encoder_info = pickle.load(f)
                print(f"Successfully loaded daily model encoder")
            else:
                print(f"Daily encoder file not found at {encoder_path}")
                
        except Exception as e:
            print(f"Error loading daily model components: {e}")
    
    def prepare_features(self, product_data, target_date=None):
        """
        Prepare features for prediction
        
        Args:
            product_data: DataFrame with product data including historical data
            target_date: Target date for prediction
            
        Returns:
            DataFrame with features ready for prediction
        """
        if self.model is None or self.feature_info is None:
            raise ValueError("Model components not loaded")
        
        df = product_data.copy()
        
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'])
            
        if target_date is None:
            if 'Date' in df.columns and not df.empty:
                target_date = df['Date'].max() + pd.Timedelta(days=1)
            else:
                target_date = pd.Timestamp.now().normalize()
        else:
            target_date = pd.to_datetime(target_date)
            
        static_cat_features = self.feature_info.get('static_categorical_features', [])
        time_varying_cat_features = self.feature_info.get('time_varying_categorical_features', [])
        numerical_features = self.feature_info.get('numerical_features', [])
        date_features = self.feature_info.get('date_features', [])
        
        df_latest = df.sort_values(by=['Product ID', 'Date']).groupby('Product ID').last().reset_index()
        
        feature_rows = []
        
        for _, row in df_latest.iterrows():
            product_id = row['Product ID']
            product_history = df[df['Product ID'] == product_id].sort_values('Date')
            
            feature_row = {}
            
            for col in static_cat_features:
                if col in row:
                    feature_row[col] = row[col]
                else:
                    feature_row[col] = 'Missing'
            
            for i in range(1, 8):
                lag_date = target_date - pd.Timedelta(days=i)
                lag_value = product_history[product_history['Date'] == lag_date]['Units Sold']
                feature_row[f'UnitsSold_lag_{i}'] = lag_value.iloc[0] if not lag_value.empty else 0
            
            recent_sales = product_history[
                (product_history['Date'] >= (target_date - pd.Timedelta(days=7))) &
                (product_history['Date'] < target_date)
            ]['Units Sold']
            
            feature_row['UnitsSold_roll_mean_7_lag1'] = recent_sales.mean() if not recent_sales.empty else 0
            feature_row['UnitsSold_roll_std_7_lag1'] = recent_sales.std() if not recent_sales.empty and len(recent_sales) > 1 else 0
            
            if 'Inventory Level' in row:
                feature_row['InventoryLevel_t'] = row['Inventory Level']
            else:
                feature_row['InventoryLevel_t'] = 0
            
            feature_row['t+1_DayOfWeek'] = target_date.dayofweek
            feature_row['t+1_Month'] = target_date.month
            feature_row['t+1_Year'] = target_date.year
            feature_row['t+1_DayOfYear'] = target_date.dayofyear
            feature_row['t+1_WeekOfYear'] = target_date.isocalendar().week
            feature_row['t+1_IsWeekend'] = int(target_date.dayofweek >= 5)
            
            for col_base in ['Demand Forecast', 'Price', 'Discount', 'Weather Condition', 'Holiday/Promotion', 'Seasonality']:
                if col_base in row:
                    feature_row[f'{col_base}_t+1'] = row[col_base]
            
            feature_rows.append(feature_row)
        
        X = pd.DataFrame(feature_rows)
        
        if self.encoder_info and 'all_categorical_to_ohe' in self.encoder_info:
            cat_cols = self.encoder_info['all_categorical_to_ohe']
            for col in cat_cols:
                if col in X.columns:
                    X[col] = X[col].astype(str).fillna('Missing')
            
            X = pd.get_dummies(X, columns=cat_cols, dummy_na=False, dtype=int)
        
        if self.processed_feature_columns:
            missing_cols = [col for col in self.processed_feature_columns if col not in X.columns]
            for col in missing_cols:
                X[col] = 0
                
            X = X[self.processed_feature_columns]
        
        return X
    
    def predict(self, X):
        """
        Make predictions using the model
        
        Args:
            X: DataFrame with prepared features
            
        Returns:
            Array of predictions
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        predictions = self.model.predict(X)
        return np.maximum(0, predictions)

daily_model = DailyModel()
