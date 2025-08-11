from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import pandas as pd
import os
import json
from datetime import datetime, timedelta

from services.metrics_service import MetricsService
from utils.helpers import get_timestamp

router = APIRouter()

@router.get("/metrics")
async def get_metrics():
    """
    Tổng hợp các chỉ số (RMSE, MAE,...)
    """
    try:
        # Import from other routers
        from routers.datasets import get_datasets
        from routers.models import models
        from routers.train import training_jobs
        
        datasets = get_datasets()
        
        # Calculate overall metrics
        total_datasets = len(datasets)
        total_models = len(models)
        total_jobs = len(training_jobs)
        
        # Get deployed models
        deployed_models = [m for m in models.values() if m.get("status") == "deployed"]
        total_deployed = len(deployed_models)
        
        # Calculate average metrics for deployed models
        avg_metrics = {
            "mae": 0.0,
            "rmse": 0.0,
            "mape": 0.0,
            "r2": 0.0
        }
        
        if deployed_models:
            total_mae = sum(m.get("metrics", {}).get("mae", 0) for m in deployed_models)
            total_rmse = sum(m.get("metrics", {}).get("rmse", 0) for m in deployed_models)
            total_mape = sum(m.get("metrics", {}).get("mape", 0) for m in deployed_models)
            total_r2 = sum(m.get("metrics", {}).get("r2", 0) for m in deployed_models)
            
            avg_metrics["mae"] = total_mae / len(deployed_models)
            avg_metrics["rmse"] = total_rmse / len(deployed_models)
            avg_metrics["mape"] = total_mape / len(deployed_models)
            avg_metrics["r2"] = total_r2 / len(deployed_models)
        
        # Get recent activity
        recent_jobs = []
        for job_id, job_info in list(training_jobs.items())[-5:]:  # Last 5 jobs
            recent_jobs.append({
                "id": job_id,
                "model_type": job_info["model_type"],
                "status": job_info["status"],
                "created_at": job_info["created_at"]
            })
        
        return {
            "success": True,
            "overview": {
                "total_datasets": total_datasets,
                "total_models": total_models,
                "total_jobs": total_jobs,
                "deployed_models": total_deployed
            },
            "average_metrics": avg_metrics,
            "recent_activity": recent_jobs
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance")
async def get_performance():
    """
    Đánh giá hiệu suất trên dữ liệu thực tế
    """
    try:
        # Import from other routers
        from routers.models import models
        
        # Get deployed models
        deployed_models = [m for m in models.values() if m.get("status") == "deployed"]
        
        performance_data = []
        
        for model in deployed_models:
            metrics = model.get("metrics", {})
            
            performance_data.append({
                "model_id": model["id"],
                "model_name": model["name"],
                "model_type": model["type"],
                "mae": metrics.get("mae", 0),
                "rmse": metrics.get("rmse", 0),
                "mape": metrics.get("mape", 0),
                "r2": metrics.get("r2", 0),
                "total_products": metrics.get("total_products", 0)
            })
        
        return {
            "success": True,
            "performance": performance_data,
            "total_models": len(performance_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends")
async def get_trends():
    """
    Xu hướng dự báo theo thời gian
    """
    try:
        # Import from other routers
        from routers.datasets import get_datasets
        
        datasets = get_datasets()
        
        # Get latest dataset
        if not datasets:
            return {
                "success": True,
                "trends": [],
                "message": "No datasets available"
            }
        
        # Get the most recent dataset
        latest_dataset = max(datasets.values(), key=lambda x: x["uploaded_at"])
        
        # Load processed data
        df = pd.read_csv(latest_dataset["processed_file"])
        
        # Calculate trends
        trends = []
        
        # Weekly trends
        df['Week'] = pd.to_datetime(df['Week'])
        weekly_trends = df.groupby('Week')['TotalQuantity'].sum().reset_index()
        
        # Monthly trends
        df['Month'] = df['Week'].dt.to_period('M')
        monthly_trends = df.groupby('Month')['TotalQuantity'].sum().reset_index()
        
        trends.append({
            "type": "weekly",
            "data": weekly_trends.tail(10).to_dict('records')
        })
        
        trends.append({
            "type": "monthly", 
            "data": monthly_trends.tail(6).to_dict('records')
        })
        
        return {
            "success": True,
            "trends": trends,
            "dataset_id": latest_dataset["id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
async def get_alerts():
    """
    Cảnh báo về model performance
    """
    try:
        # Import from other routers
        from routers.models import models
        from routers.train import training_jobs
        
        alerts = []
        
        # Check for failed training jobs
        failed_jobs = [j for j in training_jobs.values() if j["status"] == "failed"]
        if failed_jobs:
            alerts.append({
                "type": "training_failed",
                "severity": "high",
                "message": f"{len(failed_jobs)} training jobs failed",
                "count": len(failed_jobs)
            })
        
        # Check for models with poor performance
        deployed_models = [m for m in models.values() if m.get("status") == "deployed"]
        poor_performance_models = []
        
        for model in deployed_models:
            metrics = model.get("metrics", {})
            mape = metrics.get("mape", 0)
            
            if mape > 50:  # MAPE > 50% is considered poor
                poor_performance_models.append(model["id"])
        
        if poor_performance_models:
            alerts.append({
                "type": "poor_performance",
                "severity": "medium",
                "message": f"{len(poor_performance_models)} models have poor performance (MAPE > 50%)",
                "model_ids": poor_performance_models
            })
        
        # Check for old models
        old_models = []
        current_time = datetime.now()
        
        for model in deployed_models:
            created_at = datetime.fromisoformat(model["created_at"].replace('Z', '+00:00'))
            days_old = (current_time - created_at).days
            
            if days_old > 30:  # Models older than 30 days
                old_models.append(model["id"])
        
        if old_models:
            alerts.append({
                "type": "old_models",
                "severity": "low",
                "message": f"{len(old_models)} models are older than 30 days",
                "model_ids": old_models
            })
        
        return {
            "success": True,
            "alerts": alerts,
            "total_alerts": len(alerts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
async def get_summary():
    """
    Tóm tắt tổng quan hệ thống
    """
    try:
        # Import from other routers
        from routers.datasets import get_datasets
        from routers.models import models
        from routers.train import training_jobs
        
        datasets = get_datasets()
        
        # Calculate summary statistics
        total_datasets = len(datasets)
        total_models = len(models)
        total_jobs = len(training_jobs)
        
        # Job status breakdown
        job_status = {}
        for job in training_jobs.values():
            status = job["status"]
            job_status[status] = job_status.get(status, 0) + 1
        
        # Model type breakdown
        model_types = {}
        for model in models.values():
            model_type = model["type"]
            model_types[model_type] = model_types.get(model_type, 0) + 1
        
        # Recent activity (last 7 days)
        recent_activity = []
        current_time = datetime.now()
        
        for job_id, job_info in training_jobs.items():
            created_at = datetime.fromisoformat(job_info["created_at"].replace('Z', '+00:00'))
            days_ago = (current_time - created_at).days
            
            if days_ago <= 7:
                recent_activity.append({
                    "id": job_id,
                    "type": "training_job",
                    "model_type": job_info["model_type"],
                    "status": job_info["status"],
                    "days_ago": days_ago
                })
        
        return {
            "success": True,
            "summary": {
                "total_datasets": total_datasets,
                "total_models": total_models,
                "total_jobs": total_jobs,
                "job_status_breakdown": job_status,
                "model_type_breakdown": model_types,
                "recent_activity_count": len(recent_activity)
            },
            "recent_activity": recent_activity
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
