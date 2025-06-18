import os
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import OneHotEncoder

MODEL_DIR = Path(__file__).resolve().parent / 'models'

class MonthlyModel:
    """
    XGBoost model for monthly sales predictions
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
        Load all model components for monthly predictions
        """
        try:
            model_path = os.path.join(MODEL_DIR, f'inventory_xgb_monthly_store_{self.store_id}_model.pkl')
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                print(f"Successfully loaded monthly model for store {self.store_id}")
            else:
                print(f"Monthly model file not found at {model_path}")
            
            encoder_path = os.path.join(MODEL_DIR, f'inventory_xgb_monthly_store_{self.store_id}_encoder.pkl')
            if os.path.exists(encoder_path):
                with open(encoder_path, 'rb') as f:
                    self.encoder = pickle.load(f)
                print(f"Successfully loaded monthly encoder")
            else:
                print(f"Monthly encoder file not found at {encoder_path}")
            
            features_path = os.path.join(MODEL_DIR, f'inventory_xgb_monthly_store_{self.store_id}_features.pkl')
            if os.path.exists(features_path):
                with open(features_path, 'rb') as f:
                    self.feature_info = pickle.load(f)
                self.processed_feature_columns = self.feature_info.get('processed_feature_columns_list', [])
                print(f"Successfully loaded monthly model features")
            else:
                print(f"Monthly features file not found at {features_path}")
                
        except Exception as e:
            print(f"Error loading monthly model components: {e}")
    
    def aggregate_to_monthly(self, daily_data):
        """
        Aggregate daily data to monthly data
        
        Args:
            daily_data: DataFrame with daily data
            
        Returns:
            DataFrame with monthly aggregated data
        """
        if daily_data.empty:
            return pd.DataFrame()
            
        df = daily_data.copy()
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'])
        
        df['Year_Month'] = df['Date'].dt.strftime('%Y-%m')
        df['MonthStart'] = pd.to_datetime(df['Date'].dt.strftime('%Y-%m-01'))
        df['MonthEnd'] = (df['MonthStart'] + pd.offsets.MonthEnd(0))
        
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
            'MonthStart': 'first',
            'MonthEnd': 'first'
        }
        
        available_cols = [col for col in agg_funcs.keys() if col in df.columns]
        agg_funcs = {col: agg_funcs[col] for col in available_cols}
        
        monthly_df = df.groupby(['Store ID', 'Product ID', 'Year_Month']).agg(agg_funcs)
        
        if isinstance(monthly_df.columns, pd.MultiIndex):
            monthly_df.columns = [col[0] if col[1] == '' else f"{col[0]}_{col[1]}" for col in monthly_df.columns]
        
        monthly_df = monthly_df.reset_index()
        
        if 'MonthStart_first' in monthly_df.columns:
            monthly_df['MonthStart'] = monthly_df['MonthStart_first']
            monthly_df.drop('MonthStart_first', axis=1, inplace=True)
            
        if 'MonthEnd_first' in monthly_df.columns:
            monthly_df['MonthEnd'] = monthly_df['MonthEnd_first']
            monthly_df.drop('MonthEnd_first', axis=1, inplace=True)
        
        if 'Category' in df.columns:
            category_map = df.drop_duplicates(['Product ID'])
            category_map = category_map[['Product ID', 'Category']]
            monthly_df = monthly_df.merge(category_map, on='Product ID', how='left')
        
        return monthly_df
    
    def prepare_features(self, product_data, target_month_start=None):
        """
        Prepare features for prediction
        
        Args:
            product_data: DataFrame with product data (monthly aggregated)
            target_month_start: Start date of the target month for prediction (YYYY-MM-01)
            
        Returns:
            DataFrame with features ready for prediction
        """
        if self.model is None or self.feature_info is None:
            raise ValueError("Model components not loaded")
        
        if 'MonthStart' not in product_data.columns:
            monthly_data = self.aggregate_to_monthly(product_data)
        else:
            monthly_data = product_data.copy()
        
        if 'MonthStart' in monthly_data.columns:
            monthly_data['MonthStart'] = pd.to_datetime(monthly_data['MonthStart'])
            
        if target_month_start is None:
            if 'MonthStart' in monthly_data.columns and not monthly_data.empty:
                last_month = monthly_data['MonthStart'].max()
                target_month_start = (last_month + pd.DateOffset(months=1)).replace(day=1)
            else:
                today = pd.Timestamp.now().normalize()
                target_month_start = today.replace(day=1)
        else:
            target_month_start = pd.to_datetime(target_month_start)
            target_month_start = target_month_start.replace(day=1)
            
        monthly_lag_features = [f'UnitsSold_lag_{i}_month' for i in range(1, 13)]
        seasonal_lag_features = ['UnitsSold_same_month_last_year']
        rolling_stat_features = [
            'UnitsSold_roll_mean_3_month', 'UnitsSold_roll_std_3_month',
            'UnitsSold_roll_mean_6_month', 'UnitsSold_roll_max_6_month',
            'UnitsSold_roll_mean_12_month'
        ]
        change_features = ['UnitsSold_mom_change', 'UnitsSold_mom_change_lag1', 'UnitsSold_qoq_change']
        inventory_features = ['Inventory_Level_current', 'Inventory_to_Sales_Ratio']
        exog_features = self.feature_info.get('time_varying_categorical_features', [])
        static_cat_features = self.feature_info.get('static_categorical_features', [])
        date_features = self.feature_info.get('date_features', [])
        
        monthly_latest = monthly_data.sort_values(by=['Product ID', 'MonthStart']).groupby('Product ID').last().reset_index()
        
        feature_rows = []
        
        for _, row in monthly_latest.iterrows():
            product_id = row['Product ID']
            product_history = monthly_data[monthly_data['Product ID'] == product_id].sort_values('MonthStart')
            
            feature_row = {}
            
            for col in static_cat_features:
                if col in row:
                    feature_row[col] = row[col]
                else:
                    feature_row[col] = 'Missing'
            
            for i in range(1, 13):
                lag_month_start = (target_month_start - pd.DateOffset(months=i)).replace(day=1)
                lag_row = product_history[product_history['MonthStart'] == lag_month_start]
                lag_value = lag_row['Units Sold'] if not lag_row.empty else pd.Series([0])
                feature_row[f'UnitsSold_lag_{i}_month'] = lag_value.iloc[0] if not lag_value.empty else 0
            
            last_year_month = (target_month_start - pd.DateOffset(months=12)).replace(day=1)
            last_year_row = product_history[product_history['MonthStart'] == last_year_month]
            feature_row['UnitsSold_same_month_last_year'] = last_year_row['Units Sold'].iloc[0] if not last_year_row.empty else 0
            
            three_month_history = product_history[
                (product_history['MonthStart'] >= (target_month_start - pd.DateOffset(months=3))) &
                (product_history['MonthStart'] < target_month_start)
            ]['Units Sold']
            feature_row['UnitsSold_roll_mean_3_month'] = three_month_history.mean() if not three_month_history.empty else 0
            feature_row['UnitsSold_roll_std_3_month'] = three_month_history.std() if not three_month_history.empty and len(three_month_history) > 1 else 0
            
            six_month_history = product_history[
                (product_history['MonthStart'] >= (target_month_start - pd.DateOffset(months=6))) &
                (product_history['MonthStart'] < target_month_start)
            ]['Units Sold']
            feature_row['UnitsSold_roll_mean_6_month'] = six_month_history.mean() if not six_month_history.empty else 0
            feature_row['UnitsSold_roll_max_6_month'] = six_month_history.max() if not six_month_history.empty else 0
            
            twelve_month_history = product_history[
                (product_history['MonthStart'] >= (target_month_start - pd.DateOffset(months=12))) &
                (product_history['MonthStart'] < target_month_start)
            ]['Units Sold']
            feature_row['UnitsSold_roll_mean_12_month'] = twelve_month_history.mean() if not twelve_month_history.empty else 0
            
            if len(product_history) >= 2:
                sorted_history = product_history.sort_values('MonthStart', ascending=False)
                latest_val = sorted_history.iloc[0]['Units Sold']
                prev_val = sorted_history.iloc[1]['Units Sold']
                mom_change = (latest_val - prev_val) / prev_val if prev_val > 0 else 0
                feature_row['UnitsSold_mom_change'] = mom_change
                feature_row['UnitsSold_mom_change_lag1'] = sorted_history.iloc[1].get('UnitsSold_mom_change', 0)
            else:
                feature_row['UnitsSold_mom_change'] = 0
                feature_row['UnitsSold_mom_change_lag1'] = 0
                
            if len(product_history) >= 4:
                sorted_history = product_history.sort_values('MonthStart', ascending=False)
                latest_val = sorted_history.iloc[0]['Units Sold']
                three_months_ago_val = sorted_history.iloc[3]['Units Sold']
                qoq_change = (latest_val - three_months_ago_val) / three_months_ago_val if three_months_ago_val > 0 else 0
                feature_row['UnitsSold_qoq_change'] = qoq_change
            else:
                feature_row['UnitsSold_qoq_change'] = 0
                
            if 'Inventory Level' in row:
                feature_row['Inventory_Level_current'] = row['Inventory Level']
            else:
                feature_row['Inventory_Level_current'] = 0
                
            if 'Units Sold' in row and row['Units Sold'] > 0 and 'Inventory Level' in row:
                feature_row['Inventory_to_Sales_Ratio'] = row['Inventory Level'] / row['Units Sold']
            else:
                feature_row['Inventory_to_Sales_Ratio'] = 0
            
            target_month = target_month_start.month
            target_year = target_month_start.year
            target_quarter = (target_month - 1) // 3 + 1
            
            high_season_months = [11, 12, 1, 7]
            is_high_season = 1 if target_month in high_season_months else 0
            
            feature_row['next_month_Month'] = target_month
            feature_row['next_month_Year'] = target_year
            feature_row['next_month_Quarter'] = target_quarter
            feature_row['next_month_IsHighSeason'] = is_high_season
            
            for col_base in ['Demand Forecast', 'Price', 'Discount', 'Weather Condition', 'Holiday/Promotion', 'Seasonality']:
                if col_base in row:
                    feature_row[f'{col_base}_next_month'] = row[col_base]
            
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

monthly_model = MonthlyModel()