# Unis Forecast API

Backend API cho hệ thống dự báo nhu cầu sản phẩm sử dụng Machine Learning.


## Cấu trúc dự án

```
backend/
├── main.py                 # Điểm khởi động ứng dụng FastAPI
├── requirements.txt        # Dependencies
├── README.md               # Documentation
├── .gitignore              # Git ignore rules
├── debug_data.py           # Script debug dữ liệu
├── shared_state.py         # Biến dùng chung
├── config/                 # Cấu hình hệ thống
│   ├── __init__.py
│   └── settings.py         # Đường dẫn, biến môi trường
├── routers/                # API endpoints
│   ├── __init__.py
│   ├── datasets.py         # Quản lý dataset
│   ├── train.py            # Training endpoints
│   ├── models.py           # Quản lý models
│   └── dashboard.py        # Dashboard & metrics
├── ml_models/              # Các model machine learning
│   ├── __init__.py
│   ├── prophet_model.py    # Prophet model
│   └── xgboost_model.py    # XGBoost model
├── services/               # Business logic
│   ├── __init__.py
│   ├── data_service.py     # Xử lý dữ liệu
│   ├── metrics_service.py  # Tính toán metrics
│   └── train_service.py    # Train model
├── schemas/                # Định nghĩa schema cho API
│   ├── __init__.py
│   ├── dataset_schema.py
│   ├── model_schema.py
│   └── train_schema.py
├── utils/                  # Utilities
│   ├── __init__.py
│   ├── helpers.py          # Helper functions
│   └── logger.py           # Ghi log
├── data/                   # Dữ liệu gốc và đã xử lý
│   ├── raw/                # Dữ liệu gốc (Excel/CSV files)
│   │   └── UNIS_ORDER.xlsx
│   ├── processed/          # Dữ liệu đã xử lý (csv)
│   │   ├── sample_weekly_demand.csv
│   │   └── weekly_demand_*.csv
│   └── external/           # Dữ liệu từ bên ngoài
├── logs/                   # Log file
│   ├── api.log
│   ├── prediction.log
│   └── training.log
├── storage/                # Lưu trữ files hệ thống
│   ├── datasets/           # Dataset files uploaded via API
│   ├── models/             # Trained model files
│   ├── results/            # Training results & metrics
│   ├── plots/              # Visualization plots
│   └── predictions/        # Kết quả dự báo
└── __pycache__/            # File biên dịch python
```
```http
GET /datasets/
```

## Sơ đồ cấu trúc API Backend

```
/datasets
  ├── GET /datasets/                  # Danh sách dataset
  ├── GET /datasets/{dataset_id}      # Chi tiết dataset
  └── DELETE /datasets/{dataset_id}   # Xóa dataset

/train
  ├── POST /train/                    # Train model
  ├── POST /train/validate            # Validate dữ liệu
  ├── GET  /train/jobs                # Danh sách job train
  ├── GET  /train/job/{job_id}/status # Trạng thái job
  └── GET  /train/job/{job_id}/result # Kết quả job

/models
  ├── GET    /models/                 # Danh sách model
  ├── GET    /models/{model_id}       # Thông tin model
  ├── POST   /models/{model_id}/deploy    # Deploy model
  ├── POST   /models/{model_id}/retrain   # Retrain model
  ├── PATCH  /models/{model_id}           # Sửa thông tin model
  ├── POST   /models/{model_id}/predict   # Dự báo 1 sản phẩm
  ├── POST   /models/{model_id}/batch_predict # Dự báo nhiều sản phẩm
  └── GET    /models/{model_id}/download # Download file model

/dashboard
  ├── GET /dashboard/metrics          # Metrics tổng quan
  ├── GET /dashboard/performance      # Hiệu suất model
  ├── GET /dashboard/trends           # Xu hướng
  └── GET /dashboard/alerts           # Cảnh báo

/health
  └── GET /health                     # Kiểm tra trạng thái server

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
