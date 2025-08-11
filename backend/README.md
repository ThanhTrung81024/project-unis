# Unis Forecast API

Backend API cho hệ thống dự báo nhu cầu sản phẩm sử dụng Machine Learning.

## Cấu trúc dự án

```
backend/
├── main.py                 # Điểm khởi động ứng dụng FastAPI
├── requirements.txt        # Dependencies
├── README.md              # Documentation
├── .gitignore             # Git ignore rules
├── routers/               # API endpoints
│   ├── __init__.py
│   ├── datasets.py        # Quản lý dataset
│   ├── train.py          # Training endpoints
│   ├── models.py         # Quản lý models
│   └── dashboard.py      # Dashboard & metrics
├── services/             # Business logic
│   ├── __init__.py
│   ├── data_service.py   # Xử lý dữ liệu
│   ├── train_xgb.py     # XGBoost training
│   ├── train_prophet.py # Prophet training
│   └── metrics.py       # Tính toán metrics
├── utils/               # Utilities
│   ├── __init__.py
│   └── helpers.py       # Helper functions
├── data/                # Dữ liệu gốc và đã xử lý
│   ├── raw/             # Dữ liệu gốc (Excel/CSV files)
│   │   ├── UNIS_ORDER.xlsx
│   │   └── ...
│   ├── processed/       # Dữ liệu đã xử lý
│   │   ├── weekly_demand.csv
│   │   └── ...
│   └── external/        # Dữ liệu từ bên ngoài
├── storage/             # Lưu trữ files hệ thống
│   ├── datasets/        # Dataset files uploaded via API
│   ├── models/          # Trained model files
│   ├── results/         # Training results & metrics
│   ├── plots/           # Visualization plots
│   └── predictions/     # Prediction outputs
└── logs/               # Log files
    └── .gitkeep
```

## Cài đặt

1. Tạo virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

3. Chạy ứng dụng:
```bash
python main.py
```

API sẽ chạy tại: http://localhost:8000

## API Documentation

### 1. Datasets

#### Upload Dataset
```http
POST /datasets/
Content-Type: multipart/form-data

file: [Excel/CSV file]
name: "UNIS Orders Dataset"
description: "Dataset for demand forecasting"
tags: "sales,forecast,unis"
```

#### List Datasets
```http
GET /datasets/
```

#### Get Dataset Details
```http
GET /datasets/{dataset_id}
```

#### Delete Dataset
```http
DELETE /datasets/{dataset_id}
```

### 2. Training

#### Train Model
```http
POST /train/
Content-Type: application/json

{
  "dataset_id": "uuid",
  "model_type": "xgboost",  // "xgboost", "prophet", "lightgbm", "lstm"
  "parameters": {
    "n_estimators": 100,
    "learning_rate": 0.1
  },
  "test_ratio": 0.3
}
```

#### Validate Data
```http
POST /train/validate
Content-Type: application/json

{
  "dataset_id": "uuid"
}
```

#### Get Training Jobs
```http
GET /train/jobs
```

#### Get Job Status
```http
GET /train/job/{job_id}/status
```

#### Get Job Results
```http
GET /train/job/{job_id}/result
```

### 3. Models

#### List Models
```http
GET /models/
```

#### Get Model Details
```http
GET /models/{model_id}
```

#### Deploy Model
```http
POST /models/{model_id}/deploy
```

#### Retrain Model
```http
POST /models/{model_id}/retrain
```

#### Single Prediction
```http
POST /models/{model_id}/predict
Content-Type: application/json

{
  "product_code": "PROD001",
  "date": "2024-01-15"
}
```

#### Batch Prediction
```http
POST /models/{model_id}/batch_predict
Content-Type: application/json

{
  "products": ["PROD001", "PROD002"],
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

### 4. Dashboard

#### Get Metrics
```http
GET /dashboard/metrics
```

#### Get Performance
```http
GET /dashboard/performance
```

#### Get Trends
```http
GET /dashboard/trends
```

#### Get Alerts
```http
GET /dashboard/alerts
```

## Ghi chú quan trọng

### Về code training models:
- **Tất cả logic train/predict đều sử dụng code từ file `forecast1.py`**
- **KHÔNG code lại bên trong API endpoints**
- Các service classes (`XGBoostTrainer`, `ProphetTrainer`) gọi trực tiếp code từ `forecast1.py`
- Điều này đảm bảo tính nhất quán và tái sử dụng code đã được test

### Xử lý dữ liệu:
- Dữ liệu được xử lý theo logic từ `forecast1.py`
- Lọc sản phẩm có đơn vị 'viên' và không phải 'VANCHUYEN'
- Loại bỏ sản phẩm bán ít ngày (≤ 5 ngày)
- Tạo dữ liệu theo tuần cho forecasting

### Models hỗ trợ:
- **XGBoost**: Gradient boosting cho time series
- **Prophet**: Facebook Prophet cho forecasting
- **LightGBM**: Light gradient boosting (có thể mở rộng)
- **LSTM**: Deep learning (có thể mở rộng)

## Swagger Documentation

Sau khi chạy server, truy cập:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Health Check

```http
GET /health
```

## Storage Structure

### Data Directory (`data/`):
- **`raw/`**: Dữ liệu gốc (Excel/CSV files)
  - `UNIS_ORDER.xlsx` - File dữ liệu gốc
  - Các file dữ liệu khác
- **`processed/`**: Dữ liệu đã xử lý
  - `weekly_demand.csv` - Dữ liệu theo tuần
  - Các file dữ liệu đã xử lý khác
- **`external/`**: Dữ liệu từ bên ngoài

### Storage Directory (`storage/`):
- **`datasets/`**: Dataset files uploaded via API
- **`models/`**: Trained model files (*.json, *.pkl)
- **`results/`**: Training results & metrics (*.csv)
- **`plots/`**: Visualization plots (*.png, *.jpg)
- **`predictions/`**: Prediction outputs (*.csv)

### File Naming Convention:
- **Raw data**: `{dataset_name}.xlsx/csv`
- **Processed data**: `{dataset_name}_processed.csv`
- **Models**: `{model_type}_model_{model_id}.json`
- **Results**: `{model_type}_metrics_{timestamp}.csv`
- **Plots**: `{model_type}_plot_{timestamp}.png`
- **Predictions**: `predictions_{timestamp}.csv`

## 🔧 Troubleshooting

### Lỗi upload file Excel:
1. **Đảm bảo đã cài openpyxl**:
```bash
pip install openpyxl
```

2. **Kiểm tra file Excel có đúng format**:
- Cần có các cột: `GroupCode`, `GroupName`, `Unit`, `Quantity`, `DocDate`
- Cột `DocDate` phải có format: `dd/mm/yyyy`

3. **Test upload bằng script**:
```bash
python test_upload.py
```

### Lỗi cài đặt dependencies:
```bash
# Cài từng package một
pip install fastapi uvicorn
pip install pandas numpy openpyxl
pip install scikit-learn
```

### Lỗi 500 Internal Server Error:
- Kiểm tra logs trong terminal
- Đảm bảo thư mục `storage/` và `data/` đã được tạo
- Kiểm tra quyền ghi file

## Test API

### 1. Test cấu trúc:
```bash
python test_api.py
```

### 2. Test upload file:
```bash
python test_upload.py
```

### 3. Test API đơn giản:
```bash
python main_simple.py
```
