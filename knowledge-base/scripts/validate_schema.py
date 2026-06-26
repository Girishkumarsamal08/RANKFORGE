import os
import json

def validate_json_file(file_path, schema_path):
    print(f"Validating {os.path.basename(file_path)} against {os.path.basename(schema_path)}...")
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        with open(schema_path, 'r') as s:
            schema = json.load(s)
        
        # Simple structural fallback validation
        for key in schema.get("required", []):
            if key not in data:
                print(f"❌ Error: Required key '{key}' is missing in {file_path}")
                return False
        
        print(f"✅ {os.path.basename(file_path)} is valid.")
        return True
    except Exception as e:
        print(f"❌ Exception validating {file_path}: {e}")
        return False

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    schema_dir = os.path.join(base_dir, "schemas")
    
    # 1. Validate exam configs
    exam_schema = os.path.join(schema_dir, "exam.schema.json")
    exam_dir = os.path.join(base_dir, "exam")
    for f in os.listdir(exam_dir):
        if f.endswith(".json"):
            validate_json_file(os.path.join(exam_dir, f), exam_schema)

    # 2. Validate syllabus
    syllabus_schema = os.path.join(schema_dir, "syllabus.schema.json")
    syllabus_dir = os.path.join(base_dir, "syllabus")
    for f in os.listdir(syllabus_dir):
        if f.endswith(".json"):
            validate_json_file(os.path.join(syllabus_dir, f), syllabus_schema)

    # 3. Validate cutoffs
    cutoff_schema = os.path.join(schema_dir, "cutoff.schema.json")
    cutoff_dir = os.path.join(base_dir, "cutoffs")
    for f in os.listdir(cutoff_dir):
        if f.endswith(".json"):
            validate_json_file(os.path.join(cutoff_dir, f), cutoff_schema)

if __name__ == "__main__":
    main()
