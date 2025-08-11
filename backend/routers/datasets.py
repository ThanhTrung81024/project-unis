from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
import pandas as pd
import os
import shutil
from datetime import datetime
import traceback

from services.data_service import DataService
from utils.helpers import generate_id, get_timestamp, ensure_dir, validate_file_extension, get_data_paths
from shared_state import add_dataset, remove_dataset, get_datasets

router = APIRouter()
data_service = DataService()
paths = get_data_paths()

@router.post("/")
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None)
):
    """
    Upload dataset (xlsx/csv)
    """
    try:
        print(f"📁 Uploading file: {file.filename}")
        
        # Validate file extension
        if not validate_file_extension(file.filename, ['.xlsx', '.csv']):
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file .xlsx hoặc .csv")
        
        # Generate dataset ID
        dataset_id = generate_id()
        
        # Save uploaded file to storage/datasets
        file_path = f"{paths['storage']}/datasets/{dataset_id}_{file.filename}"
        ensure_dir(os.path.dirname(file_path))
        
        print(f"💾 Saving file to: {file_path}")
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"✅ File saved successfully")
        
        # Process data using existing code from forecast1.py
        print(f"🔄 Processing data...")
        result = data_service.process_raw_data(file_path)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=f"Lỗi xử lý dữ liệu: {result['error']}")
        
        print(f"✅ Data processed successfully")
        
        # Create dataset record
        dataset_info = {
            "id": dataset_id,
            "name": name,
            "description": description,
            "tags": tags.split(",") if tags else [],
            "filename": file.filename,
            "file_path": file_path,
            "uploaded_at": get_timestamp(),
            "stats": result["stats"],
            "processed_file": result["processed_file"]
        }
        
        # Add to shared state
        add_dataset(dataset_id, dataset_info)
        
        print(f"✅ Dataset created with ID: {dataset_id}")
        
        return {
            "success": True,
            "dataset_id": dataset_id,
            "message": "Dataset uploaded successfully",
            "stats": result["stats"]
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"❌ Error in upload_dataset: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/")
async def list_datasets():
    """
    Danh sách dataset
    """
    try:
        datasets = get_datasets()
        dataset_list = []
        for dataset_id, dataset_info in datasets.items():
            dataset_list.append({
                "id": dataset_id,
                "name": dataset_info["name"],
                "description": dataset_info["description"],
                "tags": dataset_info["tags"],
                "filename": dataset_info["filename"],
                "uploaded_at": dataset_info["uploaded_at"],
                "stats": dataset_info["stats"]
            })
        
        return {
            "success": True,
            "datasets": dataset_list,
            "total": len(dataset_list)
        }
        
    except Exception as e:
        print(f"❌ Error in list_datasets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    """
    Chi tiết dataset
    """
    try:
        datasets = get_datasets()
        if dataset_id not in datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        dataset_info = datasets[dataset_id]
        
        return {
            "success": True,
            "dataset": dataset_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """
    Xóa dataset
    """
    try:
        datasets = get_datasets()
        if dataset_id not in datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        dataset_info = datasets[dataset_id]
        
        # Delete files
        if os.path.exists(dataset_info["file_path"]):
            os.remove(dataset_info["file_path"])
        
        if os.path.exists(dataset_info["processed_file"]):
            os.remove(dataset_info["processed_file"])
        
        # Remove from shared state
        remove_dataset(dataset_id)
        
        return {
            "success": True,
            "message": "Dataset deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in delete_dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{dataset_id}")
async def update_dataset(
    dataset_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None)
):
    """
    Cập nhật thông tin dataset
    """
    try:
        datasets = get_datasets()
        if dataset_id not in datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        dataset_info = datasets[dataset_id]
        
        # Update fields
        if name is not None:
            dataset_info["name"] = name
        if description is not None:
            dataset_info["description"] = description
        if tags is not None:
            dataset_info["tags"] = tags.split(",") if tags else []
        
        # Update in shared state
        add_dataset(dataset_id, dataset_info)
        
        return {
            "success": True,
            "message": "Dataset updated successfully",
            "dataset": dataset_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in update_dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_id}/download")
async def download_dataset(dataset_id: str):
    """
    Download dataset file
    """
    try:
        datasets = get_datasets()
        if dataset_id not in datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        dataset_info = datasets[dataset_id]
        file_path = dataset_info["file_path"]
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=file_path,
            filename=dataset_info["filename"],
            media_type="application/octet-stream"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in download_dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_id}/visualization")
async def get_dataset_visualization(dataset_id: str, product_code: Optional[str] = None):
    """
    Tạo biểu đồ cho dataset
    """
    try:
        datasets = get_datasets()
        if dataset_id not in datasets:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        dataset_info = datasets[dataset_id]
        df = pd.read_csv(dataset_info["processed_file"])
        
        # Create visualization
        plot_file = data_service.create_visualization(df, product_code)
        
        return FileResponse(
            path=plot_file,
            media_type="image/png"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_dataset_visualization: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/raw/list")
async def list_raw_files():
    """
    Liệt kê các file dữ liệu gốc
    """
    try:
        files = data_service.list_raw_files()
        
        return {
            "success": True,
            "files": files,
            "total": len(files)
        }
        
    except Exception as e:
        print(f"❌ Error in list_raw_files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/processed/list")
async def list_processed_files():
    """
    Liệt kê các file dữ liệu đã xử lý
    """
    try:
        files = data_service.list_processed_files()
        
        return {
            "success": True,
            "files": files,
            "total": len(files)
        }
        
    except Exception as e:
        print(f"❌ Error in list_processed_files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
