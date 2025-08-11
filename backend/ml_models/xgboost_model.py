"""
XGBoost Model Implementation
Chuyển từ services/train_xgb.py
"""

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
import os
import json
from datetime import datetime
import traceback

from utils.helpers import generate_id, get_timestamp, ensure_dir
from config.settings import settings

class XGBoostModel:
    """XGBoost Model cho demand forecasting"""
    
    def __init__(self):
        self.paths = {
            'storage': 'storage',
            'models': settings.MODEL_STORAGE_PATH,
            'results': settings.RESULTS_STORAGE_PATH,
            'plots': settings.PLOTS_STORAGE_PATH
        }
        
        # Tạo thư mục nếu chưa có
        for path in self.paths.values():
            ensure_dir(path)
    
    def create_features(self, df):
        """Tạo features cho XGBoost model"""
        try:
            print(f"🔄 Creating features for XGBoost...")
            
            # Đảm bảo Week là datetime
            df['Week'] = pd.to_datetime(df['Week'])
            
            # Sắp xếp theo ItemCode và Week
            df = df.sort_values(['ItemCode', 'Week']).reset_index(drop=True)
            
            # Tạo features cho từng sản phẩm
            features_list = []
            
            for item_code in df['ItemCode'].unique():
                item_data = df[df['ItemCode'] == item_code].copy()
                
                if len(item_data) < 10:  # Bỏ qua sản phẩm có ít dữ liệu
                    continue
                
                # Time-based features
                item_data['week_of_year'] = item_data['Week'].dt.isocalendar().week
                item_data['month'] = item_data['Week'].dt.month
                item_data['quarter'] = item_data['Week'].dt.quarter
                item_data['year'] = item_data['Week'].dt.year
                
                # Lag features
                item_data['lag_1'] = item_data['TotalQuantity'].shift(1)
                item_data['lag_2'] = item_data['TotalQuantity'].shift(2)
                item_data['lag_3'] = item_data['TotalQuantity'].shift(3)
                item_data['lag_4'] = item_data['TotalQuantity'].shift(4)
                
                # Rolling features
                item_data['rolling_mean_4'] = item_data['TotalQuantity'].rolling(window=4).mean()
                item_data['rolling_std_4'] = item_data['TotalQuantity'].rolling(window=4).std()
                item_data['rolling_min_4'] = item_data['TotalQuantity'].rolling(window=4).min()
                item_data['rolling_max_4'] = item_data['TotalQuantity'].rolling(window=4).max()
                
                # Trend features
                item_data['trend'] = np.arange(len(item_data))
                
                # Seasonal features
                item_data['sin_week'] = np.sin(2 * np.pi * item_data['week_of_year'] / 52)
                item_data['cos_week'] = np.cos(2 * np.pi * item_data['week_of_year'] / 52)
                item_data['sin_month'] = np.sin(2 * np.pi * item_data['month'] / 12)
                item_data['cos_month'] = np.cos(2 * np.pi * item_data['month'] / 12)
                
                features_list.append(item_data)
            
            # Gộp tất cả features
            if features_list:
                df_features = pd.concat(features_list, ignore_index=True)
                df_features = df_features.dropna().reset_index(drop=True)
                
                print(f"✅ Features created. Shape: {df_features.shape}")
                return df_features
            else:
                print("❌ No valid products for feature creation")
                return None
                
        except Exception as e:
            print(f"❌ Error in create_features: {str(e)}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            raise
    
    def evaluate_xgb(self, df_prod, test_ratio=0.3, plot=True):
        """Đánh giá XGBoost model cho một sản phẩm"""
        try:
            print(f"🔄 Evaluating XGBoost for product...")
            
            # Tạo features
            df_features = self.create_features(df_prod)
            if df_features is None:
                return None
            
            # Chia train/test
            train_size = int(len(df_features) * (1 - test_ratio))
            train_data = df_features.iloc[:train_size]
            test_data = df_features.iloc[train_size:]
            
            # Features và target
            feature_cols = [
                'week_of_year', 'month', 'quarter', 'year',
                'lag_1', 'lag_2', 'lag_3', 'lag_4',
                'rolling_mean_4', 'rolling_std_4', 'rolling_min_4', 'rolling_max_4',
                'trend', 'sin_week', 'cos_week', 'sin_month', 'cos_month'
            ]
            
            X_train = train_data[feature_cols]
            y_train = train_data['TotalQuantity']
            X_test = test_data[feature_cols]
            y_test = test_data['TotalQuantity']
            
            # Train model
            model = xgb.XGBRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred = model.predict(X_test)
            
            # Metrics
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
            r2 = r2_score(y_test, y_pred)
            
            metrics = {
                'mae': float(mae),
                'rmse': float(rmse),
                'mape': float(mape),
                'r2': float(r2)
            }
            
            # Plot nếu cần
            plot_file = None
            if plot:
                plot_file = self._create_plot(train_data, test_data, y_pred, 'XGBoost')
            
            return {
                'metrics': metrics,
                'plot_file': plot_file,
                'model': model,
                'feature_importance': dict(zip(feature_cols, model.feature_importances_))
            }
            
        except Exception as e:
            print(f"❌ Error in evaluate_xgb: {str(e)}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            raise
    
    def train_all_products(self, data_file, test_ratio=0.3):
        """Train XGBoost cho tất cả sản phẩm"""
        try:
            print(f"🚀 Starting XGBoost training for all products...")
            print(f"📖 Loading data from: {data_file}")
            
            # Load data
            df = pd.read_csv(data_file)
            print(f"✅ Data loaded. Shape: {df.shape}")
            
            # Train cho từng sản phẩm
            results = {}
            overall_metrics = []
            
            for item_code in df['ItemCode'].unique():
                try:
                    print(f"🔄 Training for product: {item_code}")
                    
                    item_data = df[df['ItemCode'] == item_code].copy()
                    result = self.evaluate_xgb(item_data, test_ratio, plot=False)
                    
                    if result:
                        results[item_code] = result['metrics']
                        overall_metrics.append(result['metrics'])
                        
                except Exception as e:
                    print(f"❌ Error training for {item_code}: {str(e)}")
                    continue
            
            # Tính metrics tổng thể
            if overall_metrics:
                avg_metrics = {
                    'mae': np.mean([m['mae'] for m in overall_metrics]),
                    'rmse': np.mean([m['rmse'] for m in overall_metrics]),
                    'mape': np.mean([m['mape'] for m in overall_metrics]),
                    'r2': np.mean([m['r2'] for m in overall_metrics])
                }
            else:
                avg_metrics = {}
            
            # Lưu kết quả
            results_file = self._save_results(results, avg_metrics, 'XGBoost')
            
            print(f"✅ XGBoost training completed!")
            print(f"📊 Trained {len(results)} products")
            print(f"📊 Average metrics: {avg_metrics}")
            
            return {
                'metrics': avg_metrics,
                'results_file': results_file,
                'total_products': len(results)
            }
            
        except Exception as e:
            print(f"❌ Error in train_all_products: {str(e)}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            raise
    
    def predict_single(self, model, features):
        """Predict cho một sản phẩm"""
        try:
            prediction = model.predict([features])
            return float(prediction[0])
        except Exception as e:
            print(f"❌ Error in predict_single: {str(e)}")
            raise
    
    def save_model(self, model, model_id):
        """Lưu model"""
        try:
            model_file = f"{self.paths['models']}/xgboost_{model_id}.json"
            
            # Lưu model parameters
            model_params = {
                'model_type': 'xgboost',
                'parameters': model.get_params(),
                'feature_names': model.feature_names_in_.tolist() if hasattr(model, 'feature_names_in_') else [],
                'saved_at': get_timestamp()
            }
            
            with open(model_file, 'w') as f:
                json.dump(model_params, f, indent=2)
            
            return model_file
            
        except Exception as e:
            print(f"❌ Error in save_model: {str(e)}")
            raise
    
    def load_model(self, model_file):
        """Load model"""
        try:
            with open(model_file, 'r') as f:
                model_params = json.load(f)
            
            # Tạo model mới với parameters đã lưu
            model = xgb.XGBRegressor(**model_params['parameters'])
            
            return model, model_params
            
        except Exception as e:
            print(f"❌ Error in load_model: {str(e)}")
            raise
    
    def _create_plot(self, train_data, test_data, predictions, model_name):
        """Tạo plot cho kết quả"""
        try:
            plt.figure(figsize=(12, 6))
            
            # Plot training data
            plt.plot(train_data['Week'], train_data['TotalQuantity'], 
                    label='Training Data', color='blue', alpha=0.7)
            
            # Plot test data
            plt.plot(test_data['Week'], test_data['TotalQuantity'], 
                    label='Actual Test Data', color='green', alpha=0.7)
            
            # Plot predictions
            plt.plot(test_data['Week'], predictions, 
                    label=f'{model_name} Predictions', color='red', linewidth=2)
            
            plt.title(f'{model_name} Demand Forecasting')
            plt.xlabel('Week')
            plt.ylabel('Total Quantity')
            plt.legend()
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Save plot
            plot_file = f"{self.paths['plots']}/xgboost_forecast_{generate_id()}.png"
            plt.savefig(plot_file, dpi=300, bbox_inches='tight')
            plt.close()
            
            return plot_file
            
        except Exception as e:
            print(f"❌ Error in _create_plot: {str(e)}")
            return None
    
    def _save_results(self, results, overall_metrics, model_name):
        """Lưu kết quả training"""
        try:
            results_data = {
                'model_name': model_name,
                'overall_metrics': overall_metrics,
                'product_results': results,
                'created_at': get_timestamp()
            }
            
            results_file = f"{self.paths['results']}/xgboost_results_{generate_id()}.json"
            
            with open(results_file, 'w') as f:
                json.dump(results_data, f, indent=2, default=str)
            
            return results_file
            
        except Exception as e:
            print(f"❌ Error in _save_results: {str(e)}")
            raise
