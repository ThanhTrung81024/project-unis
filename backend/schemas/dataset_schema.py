"""
Pydantic schemas cho Dataset
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DatasetBase(BaseModel):
    """Schema cơ bản cho dataset"""
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class DatasetCreate(DatasetBase):
    """Schema để tạo dataset mới"""
    pass

class DatasetUpdate(BaseModel):
    """Schema để cập nhật dataset"""
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class DatasetResponse(DatasetBase):
    """Schema response cho dataset"""
    id: str
    filename: str
    uploaded_at: str
    stats: Dict[str, Any]
    processed_file: str
    
    class Config:
        from_attributes = True

class DatasetListResponse(BaseModel):
    """Schema response cho danh sách dataset"""
    success: bool
    datasets: List[DatasetResponse]
    total: int
