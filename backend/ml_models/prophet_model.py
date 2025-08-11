"""
Prophet Model Implementation
Chuyển từ services/train_prophet.py
"""

import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
import os
import json
from datetime import datetime
import traceback

from utils.helpers import generate_id, get_timestamp, ensure_dir
from config.settings import settings

class ProphetModel:
    """Prophet Model cho demand forecasting"""
    
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
    
    def evaluate_prophet(self, df_prod, test_ratio=0.3, plot=True):
        """Đánh giá Prophet model cho một sản phẩm"""
        try:
            print(f"🔄 Evaluating Prophet for product...")
            
            # Đảm bảo Week là datetime
            df_prod['Week'] = pd.to_datetime(df_prod['Week'])
            
            # Sắp xếp theo thời gian
            df_prod = df_prod.sort_values('Week').reset_index(drop=True)
            
            # Chuẩn bị dữ liệu cho Prophet
            prophet_data = df_prod[['Week', 'TotalQuantity']].copy()
            prophet_data.columns = ['ds', 'y']
            
            # Chia train/test
            train_size = int(len(prophet_data) * (1 - test_ratio))
            train_data = prophet_data.iloc[:train_size]
            test_data = prophet_data.iloc[train_size:]
            
            # Train Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode='multiplicative'
            )
            
            model.fit(train_data)
            
            # Make predictions
            future = model.make_future_dataframe(periods=len(test_data))
            forecast = model.predict(future)
            
            # Extract predictions for test period
            test_predictions = forecast.iloc[train_size:]['yhat'].values
            actual_values = test_data['y'].values
            
            # Calculate metrics
            mae = mean_absolute_error(actual_values, test_predictions)
            rmse = np.sqrt(mean_squared_error(actual_values, test_predictions))
            mape = np.mean(np.abs((actual_values - test_predictions) / actual_values)) * 100
            r2 = r2_score(actual_values, test_predictions)
            
            metrics = {
                'mae': float(mae),
                'rmse': float(rmse),
                'mape': float(mape),
                'r2': float(r2)
            }
            
            # Plot nếu cần
            plot_file = None
            if plot:
                plot_file = self._create_plot(train_data, test_data, test_predictions, 'Prophet')
            
            return {
                'metrics': metrics,
                'plot_file': plot_file,
                'model': model,
                'forecast': forecast
            }
            
        except Exception as e:
            print(f"❌ Error in evaluate_prophet: {str(e)}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            raise
    
    def train_all_products(self, data_file, test_ratio=0.3):
        """Train Prophet cho tất cả sản phẩm"""
        try:
            print(f"🚀 Starting Prophet training for all products...")
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
                    result = self.evaluate_prophet(item_data, test_ratio, plot=False)
                    
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
            results_file = self._save_results(results, avg_metrics, 'Prophet')
            
            print(f"✅ Prophet training completed!")
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
    
    def predict_single(self, model, future_dates):
        """Predict cho một sản phẩm"""
        try:
            future = pd.DataFrame({'ds': future_dates})
            forecast = model.predict(future)
            return forecast['yhat'].values
        except Exception as e:
            print(f"❌ Error in predict_single: {str(e)}")
            raise
    
    def save_model(self, model, model_id):
        """Lưu model"""
        try:
            model_file = f"{self.paths['models']}/prophet_{model_id}.json"
            
            # Lưu model parameters
            model_params = {
                'model_type': 'prophet',
                'parameters': {
                    'yearly_seasonality': model.yearly_seasonality,
                    'weekly_seasonality': model.weekly_seasonality,
                    'daily_seasonality': model.daily_seasonality,
                    'seasonality_mode': model.seasonality_mode
                },
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
            model = Prophet(**model_params['parameters'])
            
            return model, model_params
            
        except Exception as e:
            print(f"❌ Error in load_model: {str(e)}")
            raise
    
    def _create_plot(self, train_data, test_data, predictions, model_name):
        """Tạo plot cho kết quả"""
        try:
            plt.figure(figsize=(12, 6))
            
            # Plot training data
            plt.plot(train_data['ds'], train_data['y'], 
                    label='Training Data', color='blue', alpha=0.7)
            
            # Plot test data
            plt.plot(test_data['ds'], test_data['y'], 
                    label='Actual Test Data', color='green', alpha=0.7)
            
            # Plot predictions
            plt.plot(test_data['ds'], predictions, 
                    label=f'{model_name} Predictions', color='red', linewidth=2)
            
            plt.title(f'{model_name} Demand Forecasting')
            plt.xlabel('Date')
            plt.ylabel('Total Quantity')
            plt.legend()
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Save plot
            plot_file = f"{self.paths['plots']}/prophet_forecast_{generate_id()}.png"
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
            
            results_file = f"{self.paths['results']}/prophet_results_{generate_id()}.json"
            
            with open(results_file, 'w') as f:
                json.dump(results_data, f, indent=2, default=str)
            
            return results_file
            
        except Exception as e:
            print(f"❌ Error in _save_results: {str(e)}")
            raise
