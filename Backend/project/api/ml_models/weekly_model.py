import os
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import OneHotEncoder

MODEL_DIR = Path(__file__).resolve().parent / 'models'

class WeeklyModel:
    """
    XGBoost model for weekly sales predictions
    """
    def __init__(self, store_id=None):
        self.store_id = store_id if store_id is not None else 1
        self.model = None
        self.encoder = None
        self.feature_info = None
        self.processed_feature_columns = None
        self.load_model_components()
    
    def load_model_components(self):
        """
        Load all model components for weekly predictions
        """
        try:
            model_path = os.path.join(MODEL_DIR, f'inventory_xgb_weekly_store_{self.store_id}_model.pkl')
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                print(f"Successfully loaded weekly model for store {self.store_id}")
            else:
                print(f"Weekly model file not found at {model_path}")
            
            encoder_path = os.path.join(MODEL_DIR, f'inventory_xgb_weekly_store_{self.store_id}_encoder.pkl')
            if os.path.exists(encoder_path):
                with open(encoder_path, 'rb') as f:
                    self.encoder = pickle.load(f)
                print(f"Successfully loaded weekly encoder")
            else:
                print(f"Weekly encoder file not found at {encoder_path}")
            
            features_path = os.path.join(MODEL_DIR, f'inventory_xgb_weekly_store_{self.store_id}_features.pkl')
            if os.path.exists(features_path):
                with open(features_path, 'rb') as f:
                    self.feature_info = pickle.load(f)
                self.processed_feature_columns = self.feature_info.get('processed_feature_columns_list', [])
                print(f"Successfully loaded weekly model features")
            else:
                print(f"Weekly features file not found at {features_path}")
                
        except Exception as e:
            print(f"Error loading weekly model components: {e}")
    
    def aggregate_to_weekly(self, daily_data):
        """
        Aggregate daily data to weekly data
        
        Args:
            daily_data: DataFrame with daily data
            
        Returns:
            DataFrame with weekly aggregated data
        """
        if daily_data.empty:
            return pd.DataFrame()
            
        df = daily_data.copy()
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'])
        
        df['WeekStart'] = df['Date'] - pd.to_timedelta(df['Date'].dt.dayofweek, unit='D')
        df['Year_Week'] = df['Date'].dt.isocalendar().year.astype(str) + "-" + \
                          df['Date'].dt.isocalendar().week.astype(str).str.zfill(2)
        
        agg_funcs = {
            'Units Sold': 'sum',
            'Demand Forecast': 'mean',
            'Price': 'mean',
            'Discount': 'mean',
            'Inventory Level': 'mean',
            'Weather Condition': lambda x: x.mode()[0] if not x.mode().empty else "Unknown",
            'Holiday/Promotion': lambda x: 1 if (x==1).any() else 0,
            'Seasonality': lambda x: x.mode()[0] if not x.mode().empty else "Unknown",
            'Date': 'max',
            'WeekStart': 'first'
        }
        
        available_cols = [col for col in agg_funcs.keys() if col in df.columns]
        agg_funcs = {col: agg_funcs[col] for col in available_cols}
        
        weekly_df = df.groupby(['Store ID', 'Product ID', 'Year_Week']).agg(agg_funcs).reset_index()
        
        if 'Category' in df.columns:
            category_map = df.drop_duplicates(['Product ID'])
            category_map = category_map[['Product ID', 'Category']]
            weekly_df = weekly_df.merge(category_map, on='Product ID', how='left')
        
        return weekly_df
    
    def prepare_features(self, product_data, target_week_start=None):
        """
        Prepare features for prediction
        
        Args:
            product_data: DataFrame with product data (weekly aggregated)
            target_week_start: Start date of the target week for prediction
            
        Returns:
            DataFrame with features ready for prediction
        """
        if self.model is None or self.feature_info is None:
            raise ValueError("Model components not loaded")
        
        if 'WeekStart' not in product_data.columns:
            weekly_data = self.aggregate_to_weekly(product_data)
        else:
            weekly_data = product_data.copy()
        
        if 'WeekStart' in weekly_data.columns:
            weekly_data['WeekStart'] = pd.to_datetime(weekly_data['WeekStart'])
            
        if target_week_start is None:
            if 'WeekStart' in weekly_data.columns and not weekly_data.empty:
                last_week = weekly_data['WeekStart'].max()
                target_week_start = last_week + pd.Timedelta(days=7)
            else:
                today = pd.Timestamp.now().normalize()
                target_week_start = today - pd.Timedelta(days=today.dayofweek)
        else:
            target_week_start = pd.to_datetime(target_week_start)
            target_week_start = target_week_start - pd.Timedelta(days=target_week_start.dayofweek)
            
        static_cat_features = self.feature_info.get('static_categorical_features', [])
        time_varying_cat_features = self.feature_info.get('time_varying_categorical_features', [])
        numerical_features = self.feature_info.get('numerical_features', [])
        date_features = self.feature_info.get('date_features', [])
        
        weekly_latest = weekly_data.sort_values(by=['Product ID', 'WeekStart']).groupby('Product ID').last().reset_index()
        
        feature_rows = []
        
        for _, row in weekly_latest.iterrows():
            product_id = row['Product ID']
            product_history = weekly_data[weekly_data['Product ID'] == product_id].sort_values('WeekStart')
            
            feature_row = {}
            
            for col in static_cat_features:
                if col in row:
                    feature_row[col] = row[col]
                else:
                    feature_row[col] = 'Missing'
            
            for i in range(1, 5):
                lag_week_start = target_week_start - pd.Timedelta(weeks=i)
                lag_row = product_history[product_history['WeekStart'] == lag_week_start]
                lag_value = lag_row['Units Sold'] if not lag_row.empty else pd.Series([0])
                feature_row[f'UnitsSold_lag_{i}_week'] = lag_value.iloc[0] if not lag_value.empty else 0
            
            
            recent_weeks = product_history[
                (product_history['WeekStart'] >= (target_week_start - pd.Timedelta(weeks=4))) &
                (product_history['WeekStart'] < target_week_start)
            ]['Units Sold']
            
            feature_row['UnitsSold_roll_mean_4_week'] = recent_weeks.mean() if not recent_weeks.empty else 0
            feature_row['UnitsSold_roll_std_4_week'] = recent_weeks.std() if not recent_weeks.empty and len(recent_weeks) > 1 else 0
            
            
            if 'Inventory Level' in row:
                feature_row['InventoryLevel_current_week'] = row['Inventory Level']
            else:
                feature_row['InventoryLevel_current_week'] = 0
            
            
            target_month = target_week_start.month
            target_year = target_week_start.year
            target_week_of_year = target_week_start.isocalendar().week
            target_quarter = (target_month - 1) // 3 + 1
            
            feature_row['next_week_Month'] = target_month
            feature_row['next_week_Year'] = target_year
            feature_row['next_week_WeekOfYear'] = target_week_of_year
            feature_row['next_week_Quarter'] = target_quarter
            
            for col_base in ['Demand Forecast', 'Price', 'Discount', 'Weather Condition', 'Holiday/Promotion', 'Seasonality']:
                if col_base in row:
                    feature_row[f'{col_base}_next_week'] = row[col_base]
            
            feature_rows.append(feature_row)
        
        X_base = pd.DataFrame(feature_rows)
        
        if self.encoder is not None:
            cat_cols = self.feature_info.get('categorical_columns', [])
            cat_cols = [col for col in cat_cols if col in X_base.columns]
            
            num_cols = [col for col in X_base.columns if col not in cat_cols]
            X_num = X_base[num_cols].copy()
            
            for col in X_num.select_dtypes(include=np.number).columns:
                if X_num[col].isnull().any():
                    X_num[col] = X_num[col].fillna(X_num[col].median() if not X_num[col].empty else 0)
            
            if cat_cols:
                X_cat = X_base[cat_cols].copy()
                for col in cat_cols:
                    X_cat[col] = X_cat[col].astype(str).fillna('Missing')
                
                X_cat_encoded = self.encoder.transform(X_cat)
                
                cat_feature_names = self.encoder.get_feature_names_out(cat_cols)
                
                X_cat_df = pd.DataFrame(X_cat_encoded, columns=cat_feature_names, index=X_num.index)
                
                X = pd.concat([X_num, X_cat_df], axis=1)
            else:
                X = X_num
            
            X = X.fillna(0)
            
            for col in self.processed_feature_columns:
                if col not in X.columns:
                    X[col] = 0
            
            X = X[self.processed_feature_columns]
        else:
            for col in X_base.select_dtypes(include=np.number).columns:
                if X_base[col].isnull().any():
                    X_base[col] = X_base[col].fillna(X_base[col].median() if not X_base[col].empty else 0)
            X = X_base
        
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
    
weekly_model = WeeklyModel()