import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Any, Tuple
import os
from datetime import datetime
import json
import traceback
from utils.helpers import generate_id, get_timestamp, ensure_dir, save_json, get_data_paths

class DataService:
    def __init__(self):
        self.paths = get_data_paths()
        # Ensure all directories exist
        for path in self.paths.values():
            ensure_dir(path)
        
    def process_raw_data(self, file_path: str) -> Dict[str, Any]:
        """
        Xử lý dữ liệu thô từ file Excel/CSV
        Dựa trên cấu trúc dữ liệu thực tế: DocDate, BranchCode0, BranchName0, CustomerCode, ItemCode, ItemName, Quantity, Unit
        """
        try:
            print(f"📖 Reading file: {file_path}")
            
            # Đọc file dữ liệu
            if file_path.endswith('.xlsx'):
                print("📊 Reading Excel file...")
                df = pd.read_excel(file_path)
            elif file_path.endswith('.csv'):
                print("📊 Reading CSV file...")
                df = pd.read_csv(file_path)
            else:
                raise ValueError("Unsupported file format")
            
            print(f"✅ File read successfully. Shape: {df.shape}")
            print(f"📋 Columns: {list(df.columns)}")
            
            # Kiểm tra cấu trúc dữ liệu thực tế
            expected_columns = [
                'DocDate',           # Ngày chứng từ
                'BranchCode0',       # Mã chi nhánh
                'BranchName0',       # Tên chi nhánh
                'CustomerCode',      # Mã khách hàng
                'ItemCode',          # Mã hàng
                'ItemName',          # Tên hàng
                'Quantity',          # Số lượng
                'Unit'               # Đơn vị
            ]
            
            # Kiểm tra xem có đủ cột cần thiết không
            missing_columns = [col for col in expected_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Thiếu các cột: {missing_columns}. Các cột có sẵn: {list(df.columns)}")
            
            # Chỉ giữ các cột cần thiết
            df_v = df[expected_columns].copy()
            print(f"✅ Filtered columns. Shape: {df_v.shape}")
            
            # Xử lý dữ liệu
            df_v = df_v.dropna().reset_index(drop=True)
            print(f"✅ Removed null values. Shape: {df_v.shape}")
            
            # Chuẩn hóa đơn vị và ItemCode
            df_v['Unit'] = df_v['Unit'].astype(str).str.lower()
            df_v['ItemCode'] = df_v['ItemCode'].astype(str).str.strip()
            
            # Lọc theo điều kiện: chỉ giữ 'viên' và ItemCode khác 'VANCHUYEN'
            df_v_filtered = df_v[(df_v['Unit'] == 'viên') & (df_v['ItemCode'] != 'VANCHUYEN')].copy()
            print(f"✅ Filtered by unit and item code. Shape: {df_v_filtered.shape}")
            
            # Lọc hàng bán (Quantity > 0)
            df_pos = df_v_filtered[df_v_filtered['Quantity'] > 0].copy()
            print(f"✅ Filtered positive quantities. Shape: {df_pos.shape}")
            
            # Gộp dữ liệu theo ItemCode và DocDate
            df_grouped = (
                df_pos.groupby(['ItemCode', 'DocDate'], as_index=False)
                .agg({'Quantity': 'sum'})
            )
            print(f"✅ Grouped by ItemCode and DocDate. Shape: {df_grouped.shape}")
            
            # Đảm bảo DocDate là datetime trước khi sắp xếp
            if not pd.api.types.is_datetime64_any_dtype(df_grouped['DocDate']):
                df_grouped['DocDate'] = pd.to_datetime(df_grouped['DocDate'], errors='coerce')
                df_grouped = df_grouped.dropna(subset=['DocDate'])
            print(f"✅ DocDate is datetime. Shape: {df_grouped.shape}")
            
            # Sắp xếp theo thời gian
            df_grouped = df_grouped.sort_values('DocDate').reset_index(drop=True)
            
            # Loại bỏ sản phẩm bán ít ngày
            day_counts = df_grouped.groupby('ItemCode')['DocDate'].nunique()
            few_day_products = day_counts[day_counts <= 5].index
            df_grouped = df_grouped[~df_grouped['ItemCode'].isin(few_day_products)].copy()
            print(f"✅ Removed products with <= 5 days. Shape: {df_grouped.shape}")
            
            # Tạo dữ liệu theo tuần
            df_grouped['week_start'] = df_grouped['DocDate'].dt.to_period('W').apply(lambda r: r.start_time)
            
            weekly_demand = (
                df_grouped
                .groupby(['ItemCode', 'week_start'], as_index=False)
                .agg({'Quantity': 'sum'})
            )
            
            weekly_demand.columns = ['ItemCode', 'Week', 'TotalQuantity']
            weekly_demand = weekly_demand.sort_values(by=['ItemCode', 'Week']).reset_index(drop=True)
            print(f"✅ Created weekly demand data. Shape: {weekly_demand.shape}")
            
            # Lưu dữ liệu đã xử lý vào thư mục processed
            processed_file = f"{self.paths['processed']}/weekly_demand_{generate_id()}.csv"
            weekly_demand.to_csv(processed_file, index=False, encoding="utf-8-sig")
            print(f"✅ Saved processed data to: {processed_file}")
            
            # Tạo thống kê
            stats = {
                "total_products": len(weekly_demand['ItemCode'].unique()),
                "total_weeks": len(weekly_demand['Week'].unique()),
                "total_records": len(weekly_demand),
                "date_range": {
                    "start": weekly_demand['Week'].min().strftime('%Y-%m-%d'),
                    "end": weekly_demand['Week'].max().strftime('%Y-%m-%d')
                },
                "processed_file": processed_file
            }
            
            print(f"✅ Processing completed. Stats: {stats}")
            
            return {
                "success": True,
                "data": weekly_demand.to_dict('records'),
                "stats": stats,
                "processed_file": processed_file
            }
            
        except Exception as e:
            print(f"❌ Error in process_raw_data: {str(e)}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_data_summary(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Tạo tóm tắt dữ liệu"""
        summary = {
            "total_products": len(data['ItemCode'].unique()),
            "total_weeks": len(data['Week'].unique()),
            "date_range": {
                "start": data['Week'].min().strftime('%Y-%m-%d'),
                "end": data['Week'].max().strftime('%Y-%m-%d')
            },
            "quantity_stats": {
                "mean": float(data['TotalQuantity'].mean()),
                "std": float(data['TotalQuantity'].std()),
                "min": float(data['TotalQuantity'].min()),
                "max": float(data['TotalQuantity'].max())
            }
        }
        return summary
    
    def create_visualization(self, data: pd.DataFrame, product_code: str = None) -> str:
        """Tạo biểu đồ cho dữ liệu"""
        try:
            plt.figure(figsize=(12, 6))
            
            if product_code:
                # Biểu đồ cho 1 sản phẩm
                product_data = data[data['ItemCode'] == product_code]
                plt.plot(product_data['Week'], product_data['TotalQuantity'], marker='o')
                plt.title(f'Demand Forecast - {product_code}')
            else:
                # Biểu đồ tổng hợp
                for item in data['ItemCode'].unique()[:10]:  # Chỉ vẽ 10 sản phẩm đầu
                    item_data = data[data['ItemCode'] == item]
                    plt.plot(item_data['Week'], item_data['TotalQuantity'], marker='o', label=str(item))
                plt.title('Demand Forecast - Top 10 Products')
                plt.legend()
            
            plt.xlabel('Week')
            plt.ylabel('Total Quantity')
            plt.xticks(rotation=45)
            plt.grid(True)
            plt.tight_layout()
            
            # Lưu biểu đồ vào thư mục plots
            plot_file = f"{self.paths['storage']}/plots/plot_{generate_id()}.png"
            ensure_dir(os.path.dirname(plot_file))
            plt.savefig(plot_file, dpi=300, bbox_inches='tight')
            plt.close()
            
            return plot_file
            
        except Exception as e:
            print(f"❌ Error in create_visualization: {str(e)}")
            raise
    
    def load_raw_data(self, filename: str) -> pd.DataFrame:
        """Load dữ liệu gốc từ thư mục raw"""
        file_path = os.path.join(self.paths['raw'], filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if filename.endswith('.xlsx'):
            return pd.read_excel(file_path)
        elif filename.endswith('.csv'):
            return pd.read_csv(file_path)
        else:
            raise ValueError("Unsupported file format")
    
    def save_processed_data(self, data: pd.DataFrame, filename: str) -> str:
        """Lưu dữ liệu đã xử lý vào thư mục processed"""
        file_path = os.path.join(self.paths['processed'], filename)
        data.to_csv(file_path, index=False, encoding="utf-8-sig")
        return file_path
    
    def list_raw_files(self) -> List[str]:
        """Liệt kê các file dữ liệu gốc"""
        raw_dir = self.paths['raw']
        if not os.path.exists(raw_dir):
            return []
        
        files = []
        for file in os.listdir(raw_dir):
            if file.endswith(('.xlsx', '.csv')):
                files.append(file)
        return files
    
    def list_processed_files(self) -> List[str]:
        """Liệt kê các file dữ liệu đã xử lý"""
        processed_dir = self.paths['processed']
        if not os.path.exists(processed_dir):
            return []
        
        files = []
        for file in os.listdir(processed_dir):
            if file.endswith('.csv'):
                files.append(file)
        return files
