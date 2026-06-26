import os
import csv

def import_csv_kb(filename):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "rank_prediction", filename)
    
    if not os.path.exists(file_path):
        print(f"CSV file not found: {file_path}")
        return []
    
    rows = []
    print(f"Importing data from: {file_path}")
    try:
        with open(file_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
    except Exception as e:
        print(f"Error importing {file_path}: {e}")
        
    print(f"Imported {len(rows)} data rows from {filename}")
    return rows

if __name__ == "__main__":
    ranks = import_csv_kb("historical_rank_mapping.csv")
    print(f"Sample data imported: {ranks[:1]}")
