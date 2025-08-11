from fastapi import APIRouter, HTTPException, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import os
import json
from datetime import datetime

from ml_models.xgboost_model import XGBoostModel
from ml_models.prophet_model import ProphetModel
from utils.helpers import generate_id, get_timestamp

router = APIRouter()

# In-memory storage cho models (trong thực tế nên dùng database)
models = {}
# Tạo model mẫu khi khởi động server để tránh lỗi khi chưa có model nào
from uuid import uuid4
sample_model_id = str(uuid4())
models[sample_model_id] = {
    "id": sample_model_id,
    "name": "Sample XGBoost Model",
    "type": "xgboost",
    "dataset_id": "sample_dataset",
    "status": "ready",
    "metrics": {"mae": 0, "rmse": 0, "mape": 0, "r2": 0},
    "created_at": get_timestamp(),
    "parameters": {},
    "tags": ["sample"],
    "description": "Mẫu model XGBoost để test API"
}

class PredictRequest(BaseModel):
    product_code: str
    date: str  # YYYY-MM-DD format

class BatchPredictRequest(BaseModel):
    products: List[str]
    start_date: str
    end_date: str

@router.get("/")
async def list_models():
    """
    Danh sách model đã train
    """
    try:
        model_list = []
        for model_id, model_info in models.items():
            model_list.append({
                "id": model_id,
                "name": model_info["name"],
                "type": model_info["type"],
                "dataset_id": model_info["dataset_id"],
                "status": model_info["status"],
                "metrics": model_info["metrics"],
                "created_at": model_info["created_at"],
                "deployed_at": model_info.get("deployed_at")
            })
        
        return {
            "success": True,
            "models": model_list,
            "total": len(model_list)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{model_id}")
async def get_model(model_id: str):
    """
    Thông tin chi tiết model (type, metrics, param...)
    """
    try:
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_info = models[model_id]
        
        return {
            "success": True,
            "model": model_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{model_id}")
async def update_model(
    model_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    parameters: Optional[str] = Form(None)
):
    """
    Sửa/đổi tên, mô tả, tag, param
    """
    try:
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_info = models[model_id]
        
        # Update fields
        if name is not None:
            model_info["name"] = name
        if description is not None:
            model_info["description"] = description
        if tags is not None:
            model_info["tags"] = tags.split(",")
        if parameters is not None:
            model_info["parameters"] = json.loads(parameters)
        
        return {
            "success": True,
            "message": "Model updated successfully",
            "model": model_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{model_id}")
async def delete_model(model_id: str):
    """
    Xóa model
    """
    try:
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_info = models[model_id]
        
        # Delete model file if exists
        if "model_file" in model_info and os.path.exists(model_info["model_file"]):
            os.remove(model_info["model_file"])
        
        # Remove from storage
        del models[model_id]
        
        return {
            "success": True,
            "message": "Model deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{model_id}/deploy")
async def deploy_model(model_id: str):
    """
    Deploy model để sử dụng
    """
    try:
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_info = models[model_id]
        model_info["status"] = "deployed"
        model_info["deployed_at"] = get_timestamp()
        
        return {
            "success": True,
            "message": "Model deployed successfully",
            "model": model_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{model_id}/retrain")
async def retrain_model(model_id: str, parameters: Optional[Dict[str, Any]] = None):
    """
    Retrain model với parameters mới
    """
    try:
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_info = models[model_id]
        
        # Get model trainer based on type
        if model_info["type"] == "xgboost":
            trainer = XGBoostModel()
        elif model_info["type"] == "prophet":
            trainer = ProphetModel()
        else:
            raise HTTPException(status_code=400, detail="Unsupported model type")
        
        # Retrain model
        # This is a placeholder - actual retraining logic would go here
        model_info["status"] = "retrained"
        model_info["updated_at"] = get_timestamp()
        
        return {
            "success": True,
            "message": "Model retrained successfully",
            "model": model_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{model_id}/predict")
async def predict_single(request: PredictRequest):
    """
    Predict cho một sản phẩm
    """
    try:
        # This is a placeholder - actual prediction logic would go here
        prediction = {
            "product_code": request.product_code,
            "date": request.date,
            "predicted_quantity": 100.0,
            "confidence": 0.85
        }
        
        return {
            "success": True,
            "prediction": prediction
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{model_id}/batch_predict")
async def batch_predict(request: BatchPredictRequest):
    """
    Predict cho nhiều sản phẩm
    """
    try:
        # This is a placeholder - actual batch prediction logic would go here
        predictions = []
        
        for product in request.products:
            prediction = {
                "product_code": product,
                "start_date": request.start_date,
                "end_date": request.end_date,
                "predicted_quantity": 100.0,
                "confidence": 0.85
            }
            predictions.append(prediction)
        
        return {
            "success": True,
            "predictions": predictions,
            "total": len(predictions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{model_id}/download")
async def download_model(model_id: str):
    """
    Download model file
    """
    try:
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_info = models[model_id]
        
        if "model_file" not in model_info or not os.path.exists(model_info["model_file"]):
            raise HTTPException(status_code=404, detail="Model file not found")
        
        return FileResponse(
            path=model_info["model_file"],
            media_type="application/octet-stream",
            filename=f"model_{model_id}.json"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
