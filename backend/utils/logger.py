"""
Logger utility cho ứng dụng
"""

import logging
import os
from datetime import datetime
from config.settings import settings

def setup_logger(name: str, log_file: str, level: str = "INFO") -> logging.Logger:
    """Thiết lập logger"""
    
    # Tạo thư mục logs nếu chưa có
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    # Tạo logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Tạo formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger

# Tạo các loggers chính
api_logger = setup_logger('api', settings.API_LOG_FILE, settings.LOG_LEVEL)
training_logger = setup_logger('training', settings.TRAINING_LOG_FILE, settings.LOG_LEVEL)
prediction_logger = setup_logger('prediction', settings.PREDICTION_LOG_FILE, settings.LOG_LEVEL)

def log_api_request(method: str, endpoint: str, status_code: int, duration: float):
    """Log API request"""
    api_logger.info(f"API Request: {method} {endpoint} - Status: {status_code} - Duration: {duration:.3f}s")

def log_training_start(model_type: str, dataset_id: str, job_id: str):
    """Log bắt đầu training"""
    training_logger.info(f"Training started: {model_type} - Dataset: {dataset_id} - Job: {job_id}")

def log_training_complete(model_type: str, job_id: str, metrics: dict):
    """Log hoàn thành training"""
    training_logger.info(f"Training completed: {model_type} - Job: {job_id} - Metrics: {metrics}")

def log_prediction(model_id: str, product_code: str, predictions_count: int):
    """Log prediction"""
    prediction_logger.info(f"Prediction: Model {model_id} - Product {product_code} - {predictions_count} predictions")

def log_error(logger_name: str, error: Exception, context: str = ""):
    """Log error"""
    logger = globals().get(f"{logger_name}_logger")
    if logger:
        logger.error(f"Error in {context}: {str(error)}", exc_info=True)
