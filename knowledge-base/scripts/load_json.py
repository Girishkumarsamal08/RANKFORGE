import os
import json

def load_json_kb(directory_name):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(base_dir, directory_name)
    data_store = {}
    
    if not os.path.exists(target_dir):
        print(f"Directory {target_dir} not found.")
        return data_store

    print(f"Loading JSON dataset from: {target_dir}")
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith(".json"):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, target_dir)
                try:
                    with open(file_path, 'r') as f:
                        data_store[rel_path] = json.load(f)
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")
    
    print(f"Loaded {len(data_store)} JSON files from {directory_name}")
    return data_store

if __name__ == "__main__":
    exam_data = load_json_kb("exam")
    print(f"Successfully loaded {len(exam_data)} exam configuration datasets.")
