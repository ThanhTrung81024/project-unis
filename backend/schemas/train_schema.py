"""
Pydantic schemas cho Training
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class TrainRequest(BaseModel):
    """Schema request để train model"""
    dataset_id: str
    model_type: str  # "xgboost", "prophet", "lightgbm", "lstm"
    parameters: Optional[Dict[str, Any]] = None
    test_ratio: float = 0.3

class ValidateRequest(BaseModel):
    """Schema request để validate dataset"""
    dataset_id: str

class ValidationResult(BaseModel):
    """Schema response cho validation"""
    total_products: int
    total_weeks: int
    total_records: int
    missing_values: Dict[str, int]
    data_range: Dict[str, str]
    quantity_stats: Dict[str, float]
    is_sufficient: bool
    recommendations: List[str]

class ValidationResponse(BaseModel):
    """Schema response cho validation endpoint"""
    success: bool
    validation: ValidationResult

class JobStatus(BaseModel):
    """Schema cho job status"""
    id: str
    dataset_id: str
    model_type: str
    status: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None

class JobListResponse(BaseModel):
    """Schema response cho danh sách jobs"""
    success: bool
    jobs: List[JobStatus]
    total: int

class JobResult(BaseModel):
    """Schema response cho kết quả training"""
    success: bool
    job_id: str
    model_type: str
    metrics: Dict[str, Any]
    results_file: Optional[str] = None
    plot_file: Optional[str] = None
