"""
Metrics Service - Tính toán các metrics đánh giá model
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

class MetricsService:
    """Service cho tính toán metrics"""
    
    @staticmethod
    def calculate_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Tính Mean Absolute Error"""
        return mean_absolute_error(y_true, y_pred)
    
    @staticmethod
    def calculate_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Tính Root Mean Square Error"""
        return np.sqrt(mean_squared_error(y_true, y_pred))
    
    @staticmethod
    def calculate_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Tính Mean Absolute Percentage Error"""
        return np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    
    @staticmethod
    def calculate_r2(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Tính R-squared"""
        return r2_score(y_true, y_pred)
    
    @staticmethod
    def calculate_all_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Tính tất cả metrics"""
        return {
            'mae': MetricsService.calculate_mae(y_true, y_pred),
            'rmse': MetricsService.calculate_rmse(y_true, y_pred),
            'mape': MetricsService.calculate_mape(y_true, y_pred),
            'r2': MetricsService.calculate_r2(y_true, y_pred)
        }
    
    @staticmethod
    def calculate_rolling_metrics(y_true: np.ndarray, y_pred: np.ndarray, window: int = 4) -> Dict[str, List[float]]:
        """Tính rolling metrics"""
        if len(y_true) < window:
            return {}
        
        rolling_mae = []
        rolling_rmse = []
        rolling_mape = []
        
        for i in range(window, len(y_true)):
            y_true_window = y_true[i-window:i]
            y_pred_window = y_pred[i-window:i]
            
            rolling_mae.append(MetricsService.calculate_mae(y_true_window, y_pred_window))
            rolling_rmse.append(MetricsService.calculate_rmse(y_true_window, y_pred_window))
            rolling_mape.append(MetricsService.calculate_mape(y_true_window, y_pred_window))
        
        return {
            'rolling_mae': rolling_mae,
            'rolling_rmse': rolling_rmse,
            'rolling_mape': rolling_mape
        }
    
    @staticmethod
    def compare_models(model_results: Dict[str, Dict[str, float]]) -> Dict[str, Any]:
        """So sánh performance của các models"""
        comparison = {
            'best_model': None,
            'best_metric': None,
            'best_value': float('inf'),
            'comparison_table': {}
        }
        
        for model_name, metrics in model_results.items():
            comparison['comparison_table'][model_name] = metrics
            
            # Tìm model tốt nhất dựa trên MAE (càng thấp càng tốt)
            if metrics['mae'] < comparison['best_value']:
                comparison['best_model'] = model_name
                comparison['best_metric'] = 'mae'
                comparison['best_value'] = metrics['mae']
        
        return comparison
    
    @staticmethod
    def find_best_model(model_results: Dict[str, Dict[str, float]], metric: str = 'mae') -> str:
        """Tìm model tốt nhất theo metric"""
        if not model_results:
            return None
        
        best_model = None
        best_value = float('inf') if metric in ['mae', 'rmse', 'mape'] else float('-inf')
        
        for model_name, metrics in model_results.items():
            if metric not in metrics:
                continue
                
            current_value = metrics[metric]
            
            if metric in ['mae', 'rmse', 'mape']:
                if current_value < best_value:
                    best_value = current_value
                    best_model = model_name
            else:  # r2, accuracy, etc.
                if current_value > best_value:
                    best_value = current_value
                    best_model = model_name
        
        return best_model
