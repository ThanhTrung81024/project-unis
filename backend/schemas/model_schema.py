"""
Pydantic schemas cho Models
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ModelBase(BaseModel):
    """Schema cơ bản cho model"""
    name: str
    model_type: str
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class ModelCreate(ModelBase):
    """Schema để tạo model mới"""
    dataset_id: str

class ModelUpdate(BaseModel):
    """Schema để cập nhật model"""
    name: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class ModelResponse(ModelBase):
    """Schema response cho model"""
    id: str
    dataset_id: str
    status: str
    created_at: str
    updated_at: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    model_file: Optional[str] = None
    
    class Config:
        from_attributes = True

class ModelListResponse(BaseModel):
    """Schema response cho danh sách models"""
    success: bool
    models: List[ModelResponse]
    total: int

class PredictionRequest(BaseModel):
    """Schema request để predict"""
    model_id: str
    product_code: str
    weeks_ahead: int = 4

class PredictionResponse(BaseModel):
    """Schema response cho prediction"""
    success: bool
    model_id: str
    product_code: str
    predictions: List[Dict[str, Any]]
    confidence_interval: Optional[Dict[str, Any]] = None
