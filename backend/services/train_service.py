"""
Training Service - Business logic cho training
"""

from typing import Dict, Any, Optional
import traceback

from ml_models.xgboost_model import XGBoostModel
from ml_models.prophet_model import ProphetModel
from utils.helpers import generate_id, get_timestamp
from config.settings import settings

class TrainingService:
    """Service cho training models"""
    
    def __init__(self):
        self.xgboost_trainer = XGBoostModel()
        self.prophet_trainer = ProphetModel()
    
    def train_model(self, model_type: str, data_file: str, test_ratio: float = 0.3) -> Dict[str, Any]:
        """Train model theo loại"""
        try:
            print(f"🔄 Training {model_type} model...")
            
            if model_type == "xgboost":
                result = self.xgboost_trainer.train_all_products(data_file, test_ratio)
            elif model_type == "prophet":
                result = self.prophet_trainer.train_all_products(data_file, test_ratio)
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
            
            return result
            
        except Exception as e:
            print(f"❌ Error in train_model: {str(e)}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            raise
    
    def validate_data(self, data_file: str) -> Dict[str, Any]:
        """Validate dữ liệu trước khi train"""
        try:
            import pandas as pd
            
            df = pd.read_csv(data_file)
            
            validation_result = {
                "total_products": len(df['ItemCode'].unique()),
                "total_weeks": len(df['Week'].unique()),
                "total_records": len(df),
                "missing_values": df.isnull().sum().to_dict(),
                "data_range": {
                    "start": df['Week'].min(),
                    "end": df['Week'].max()
                },
                "quantity_stats": {
                    "mean": float(df['TotalQuantity'].mean()),
                    "std": float(df['TotalQuantity'].std()),
                    "min": float(df['TotalQuantity'].min()),
                    "max": float(df['TotalQuantity'].max())
                }
            }
            
            # Check if data is sufficient for training
            min_products = settings.MIN_PRODUCTS_FOR_TRAINING
            min_weeks = settings.MIN_WEEKS_FOR_TRAINING
            
            validation_result["is_sufficient"] = (
                validation_result["total_products"] >= min_products and
                validation_result["total_weeks"] >= min_weeks
            )
            
            validation_result["recommendations"] = []
            
            if validation_result["total_products"] < min_products:
                validation_result["recommendations"].append(
                    f"Cần ít nhất {min_products} sản phẩm để train model"
                )
            
            if validation_result["total_weeks"] < min_weeks:
                validation_result["recommendations"].append(
                    f"Cần ít nhất {min_weeks} tuần dữ liệu để train model"
                )
            
            return validation_result
            
        except Exception as e:
            print(f"❌ Error in validate_data: {str(e)}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            raise
    
    def get_model_trainer(self, model_type: str):
        """Lấy model trainer theo loại"""
        if model_type == "xgboost":
            return self.xgboost_trainer
        elif model_type == "prophet":
            return self.prophet_trainer
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
