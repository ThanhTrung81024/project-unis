import os
import uuid
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
import pandas as pd

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_id() -> str:
    """Generate unique ID"""
    return str(uuid.uuid4())

def get_timestamp() -> str:
    """Get current timestamp"""
    return datetime.now().isoformat()

def ensure_dir(directory: str) -> None:
    """Ensure directory exists"""
    os.makedirs(directory, exist_ok=True)

def save_json(data: Dict[str, Any], filepath: str) -> None:
    """Save data to JSON file"""
    ensure_dir(os.path.dirname(filepath))
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_json(filepath: str) -> Dict[str, Any]:
    """Load data from JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """Validate file extension"""
    return any(filename.lower().endswith(ext) for ext in allowed_extensions)

def get_file_size_mb(filepath: str) -> float:
    """Get file size in MB"""
    return os.path.getsize(filepath) / (1024 * 1024)

def log_operation(operation: str, details: Dict[str, Any] = None):
    """Log operation with details"""
    log_data = {
        "timestamp": get_timestamp(),
        "operation": operation,
        "details": details or {}
    }
    logger.info(f"Operation: {operation} - {details}")
    return log_data

def get_data_paths():
    """Get standard data paths"""
    return {
        "raw": "data/raw",
        "processed": "data/processed", 
        "external": "data/external",
        "storage": "storage"
    }
