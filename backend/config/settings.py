"""
Cấu hình hệ thống - đọc từ biến môi trường
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    """Cấu hình hệ thống từ biến môi trường"""
    
    # Database
    DATABASE_URL: Optional[str] = "sqlite:///./unis_forecast.db"
    
    # API Keys
    API_KEY: Optional[str] = "your_api_key_here"
    
    # Model Configuration
    MODEL_STORAGE_PATH: str = "storage/models"
    RESULTS_STORAGE_PATH: str = "storage/results"
    PLOTS_STORAGE_PATH: str = "storage/plots"
    PREDICTIONS_STORAGE_PATH: str = "storage/predictions"
    
    # Data Paths
    RAW_DATA_PATH: str = "data/raw"
    PROCESSED_DATA_PATH: str = "data/processed"
    EXTERNAL_DATA_PATH: str = "data/external"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    API_LOG_FILE: str = "logs/api.log"
    TRAINING_LOG_FILE: str = "logs/training.log"
    PREDICTION_LOG_FILE: str = "logs/prediction.log"
    
    # Training Configuration
    DEFAULT_TEST_RATIO: float = 0.3
    MIN_PRODUCTS_FOR_TRAINING: int = 5
    MIN_WEEKS_FOR_TRAINING: int = 8
    
    class Config:
        case_sensitive = False

# Tạo instance settings
settings = Settings()
