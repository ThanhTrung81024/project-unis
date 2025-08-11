#!/usr/bin/env python3
"""
Debug script để kiểm tra xử lý dữ liệu
"""

import pandas as pd
import numpy as np
import os
import traceback

def debug_data_processing():
    """Debug quá trình xử lý dữ liệu"""
    
    file_path = "data/raw/UNIS_ORDER.xlsx"
    
    try:
        print(f"📖 Reading file: {file_path}")
        
        # Đọc file dữ liệu
        df = pd.read_excel(file_path)
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
            print(f"❌ Thiếu các cột: {missing_columns}")
            return
        
        # Chỉ giữ các cột cần thiết
        df_v = df[expected_columns].copy()
        print(f"✅ Filtered columns. Shape: {df_v.shape}")
        
        # Xử lý dữ liệu
        df_v = df_v.dropna().reset_index(drop=True)
        print(f"✅ Removed null values. Shape: {df_v.shape}")
        
        # Kiểm tra kiểu dữ liệu
        print(f"📊 Data types:")
        for col in df_v.columns:
            print(f"  {col}: {df_v[col].dtype}")
        
        # Chuẩn hóa đơn vị và ItemCode
        print(f"🔄 Converting Unit and ItemCode...")
        df_v['Unit'] = df_v['Unit'].astype(str).str.lower()
        df_v['ItemCode'] = df_v['ItemCode'].astype(str).str.strip()
        
        print(f"📊 Unit values: {df_v['Unit'].unique()}")
        print(f"📊 ItemCode sample: {df_v['ItemCode'].head().tolist()}")
        
        # Lọc theo điều kiện: chỉ giữ 'viên' và ItemCode khác 'VANCHUYEN'
        df_v_filtered = df_v[(df_v['Unit'] == 'viên') & (df_v['ItemCode'] != 'VANCHUYEN')].copy()
        print(f"✅ Filtered by unit and item code. Shape: {df_v_filtered.shape}")
        
        # Lọc hàng bán (Quantity > 0)
        df_pos = df_v_filtered[df_v_filtered['Quantity'] > 0].copy()
        print(f"✅ Filtered positive quantities. Shape: {df_pos.shape}")
        
        # Gộp dữ liệu theo ItemCode và DocDate
        print(f"🔄 Grouping by ItemCode and DocDate...")
        df_grouped = (
            df_pos.groupby(['ItemCode', 'DocDate'], as_index=False)
            .agg({'Quantity': 'sum'})
        )
        print(f"✅ Grouped by ItemCode and DocDate. Shape: {df_grouped.shape}")
        
        # Sắp xếp theo thời gian
        df_grouped = df_grouped.sort_values('DocDate').reset_index(drop=True)
        
        # Đảm bảo DocDate là datetime
        print(f"🔄 Checking DocDate type...")
        print(f"📊 DocDate dtype: {df_grouped['DocDate'].dtype}")
        print(f"📊 DocDate sample: {df_grouped['DocDate'].head()}")
        
        if not pd.api.types.is_datetime64_any_dtype(df_grouped['DocDate']):
            print(f"🔄 Converting DocDate to datetime...")
            df_grouped['DocDate'] = pd.to_datetime(df_grouped['DocDate'], errors='coerce')
            df_grouped = df_grouped.dropna(subset=['DocDate'])
        
        print(f"✅ DocDate is datetime. Shape: {df_grouped.shape}")
        
        # Loại bỏ sản phẩm bán ít ngày
        print(f"🔄 Removing products with <= 5 days...")
        day_counts = df_grouped.groupby('ItemCode')['DocDate'].nunique()
        few_day_products = day_counts[day_counts <= 5].index
        df_grouped = df_grouped[~df_grouped['ItemCode'].isin(few_day_products)].copy()
        print(f"✅ Removed products with <= 5 days. Shape: {df_grouped.shape}")
        
        # Tạo dữ liệu theo tuần
        print(f"🔄 Creating weekly data...")
        df_grouped['week_start'] = df_grouped['DocDate'].dt.to_period('W').apply(lambda r: r.start_time)
        
        weekly_demand = (
            df_grouped
            .groupby(['ItemCode', 'week_start'], as_index=False)
            .agg({'Quantity': 'sum'})
        )
        
        weekly_demand.columns = ['ItemCode', 'Week', 'TotalQuantity']
        weekly_demand = weekly_demand.sort_values(by=['ItemCode', 'Week']).reset_index(drop=True)
        print(f"✅ Created weekly demand data. Shape: {weekly_demand.shape}")
        
        # Tạo thống kê
        stats = {
            "total_products": len(weekly_demand['ItemCode'].unique()),
            "total_weeks": len(weekly_demand['Week'].unique()),
            "total_records": len(weekly_demand),
            "date_range": {
                "start": weekly_demand['Week'].min().strftime('%Y-%m-%d'),
                "end": weekly_demand['Week'].max().strftime('%Y-%m-%d')
            }
        }
        
        print(f"✅ Processing completed successfully!")
        print(f"📊 Stats: {stats}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    debug_data_processing()
