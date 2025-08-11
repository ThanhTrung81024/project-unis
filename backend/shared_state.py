"""
Shared state management cho các routers
"""

from typing import Dict, Any

# Global storage cho datasets
datasets: Dict[str, Any] = {}

def get_datasets() -> Dict[str, Any]:
    """Lấy datasets"""
    return datasets

def update_datasets(new_datasets: Dict[str, Any]):
    """Cập nhật datasets"""
    global datasets
    datasets.update(new_datasets)

def add_dataset(dataset_id: str, dataset_info: Dict[str, Any]):
    """Thêm dataset mới"""
    global datasets
    datasets[dataset_id] = dataset_info

def remove_dataset(dataset_id: str):
    """Xóa dataset"""
    global datasets
    if dataset_id in datasets:
        del datasets[dataset_id]

def get_dataset(dataset_id: str) -> Dict[str, Any]:
    """Lấy dataset theo ID"""
    return datasets.get(dataset_id)
