from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional, Dict, Any
import pandas as pd
import os
import asyncio
from datetime import datetime
import traceback

from services.train_service import TrainingService
from schemas.train_schema import TrainRequest, ValidateRequest, ValidationResponse, JobStatus, JobListResponse, JobResult
from utils.helpers import generate_id, get_timestamp
from shared_state import get_datasets
from utils.logger import log_training_start, log_training_complete, log_error

router = APIRouter()
training_service = TrainingService()

# In-memory storage cho training jobs (trong thực tế nên dùng database)
training_jobs = {}

@router.post("/", response_model=Dict[str, Any])
async def train_model(request: TrainRequest, background_tasks: BackgroundTasks):
    """
    Train model mới (chọn loại model)
    GHI CHÚ: Endpoint này gọi code đã có từ forecast1.py, không code lại bên trong
    """
    try:
        print(f"🔄 Starting training job for dataset: {request.dataset_id}")
        
        # Validate dataset exists
        datasets = get_datasets()
        if request.dataset_id not in datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Generate job ID
        job_id = generate_id()
        
        # Create job record
        job_info = {
            "id": job_id,
            "dataset_id": request.dataset_id,
            "model_type": request.model_type,
            "parameters": request.parameters or {},
            "test_ratio": request.test_ratio,
            "status": "pending",
            "created_at": get_timestamp(),
            "started_at": None,
            "completed_at": None,
            "result": None,
            "error": None
        }
        
        training_jobs[job_id] = job_info
        
        # Log training start
        log_training_start(request.model_type, request.dataset_id, job_id)
        
        # Start training in background
        background_tasks.add_task(
            run_training_job,
            job_id,
            request.dataset_id,
            request.model_type,
            request.parameters,
            request.test_ratio
        )
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "Training job started",
            "status": "pending"
        }
        
    except Exception as e:
        log_error("training", e, "train_model")
        raise HTTPException(status_code=500, detail=str(e))

async def run_training_job(job_id: str, dataset_id: str, model_type: str, parameters: Dict, test_ratio: float):
    """
    Chạy training job trong background
    GHI CHÚ: Sử dụng code đã có từ forecast1.py
    """
    try:
        print(f"🔄 Running training job {job_id}...")
        
        # Update job status
        training_jobs[job_id]["status"] = "running"
        training_jobs[job_id]["started_at"] = get_timestamp()
        
        # Load dataset
        datasets = get_datasets()
        dataset_info = datasets[dataset_id]
        data_file = dataset_info["processed_file"]
        
        print(f"📖 Loading data from: {data_file}")
        
        # Train model using service
        result = training_service.train_model(model_type, data_file, test_ratio)
        
        # Update job with results
        training_jobs[job_id]["status"] = "completed"
        training_jobs[job_id]["completed_at"] = get_timestamp()
        training_jobs[job_id]["result"] = result
        
        # Log training complete
        log_training_complete(model_type, job_id, result.get('metrics', {}))
        
        print(f"✅ Training job {job_id} completed successfully!")
        
    except Exception as e:
        print(f"❌ Error in run_training_job: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        training_jobs[job_id]["status"] = "failed"
        training_jobs[job_id]["completed_at"] = get_timestamp()
        training_jobs[job_id]["error"] = str(e)
        log_error("training", e, f"run_training_job_{job_id}")

@router.post("/validate", response_model=ValidationResponse)
async def validate_data(request: ValidateRequest):
    """
    Kiểm tra dữ liệu trước khi train
    """
    try:
        print(f"🔍 Validating dataset: {request.dataset_id}")
        
        datasets = get_datasets()
        if request.dataset_id not in datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        dataset_info = datasets[request.dataset_id]
        data_file = dataset_info["processed_file"]
        
        print(f"📊 Validating data file: {data_file}")
        
        # Validate data using service
        validation_result = training_service.validate_data(data_file)
        
        print(f"✅ Validation completed: {validation_result}")
        
        return ValidationResponse(
            success=True,
            validation=validation_result
        )
        
    except Exception as e:
        log_error("training", e, "validate_data")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs", response_model=JobListResponse)
async def list_training_jobs():
    """
    Danh sách job training
    """
    try:
        job_list = []
        for job_id, job_info in training_jobs.items():
            job_list.append(JobStatus(
                id=job_id,
                dataset_id=job_info["dataset_id"],
                model_type=job_info["model_type"],
                status=job_info["status"],
                created_at=job_info["created_at"],
                started_at=job_info["started_at"],
                completed_at=job_info["completed_at"]
            ))
        
        return JobListResponse(
            success=True,
            jobs=job_list,
            total=len(job_list)
        )
        
    except Exception as e:
        log_error("training", e, "list_training_jobs")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/job/{job_id}/status", response_model=Dict[str, Any])
async def get_job_status(job_id: str):
    """
    Trạng thái training
    """
    try:
        if job_id not in training_jobs:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_info = training_jobs[job_id]
        
        return {
            "success": True,
            "job_id": job_id,
            "status": job_info["status"],
            "created_at": job_info["created_at"],
            "started_at": job_info["started_at"],
            "completed_at": job_info["completed_at"],
            "error": job_info.get("error")
        }
        
    except Exception as e:
        log_error("training", e, f"get_job_status_{job_id}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/job/{job_id}/result", response_model=JobResult)
async def get_job_result(job_id: str):
    """
    Kết quả training, metrics, plots
    """
    try:
        if job_id not in training_jobs:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_info = training_jobs[job_id]
        
        if job_info["status"] != "completed":
            raise HTTPException(status_code=400, detail="Job not completed yet")
        
        result = job_info["result"]
        
        return JobResult(
            success=True,
            job_id=job_id,
            model_type=job_info["model_type"],
            metrics=result.get("metrics", {}),
            results_file=result.get("results_file"),
            plot_file=result.get("plot_file")
        )
        
    except Exception as e:
        log_error("training", e, f"get_job_result_{job_id}")
        raise HTTPException(status_code=500, detail=str(e))
