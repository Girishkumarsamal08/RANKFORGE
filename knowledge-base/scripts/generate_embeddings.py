import os
import json

def chunk_text(text, chunk_size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def mock_get_embedding(text):
    # Mocking a 1536-dimensional vector for local simulation
    return [0.015] * 1536

def generate_kb_embeddings():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    exam_dir = os.path.join(base_dir, "exam")
    embeddings_out = []
    
    print(f"Beginning chunking and embedding generation...")
    for root, dirs, files in os.walk(exam_dir):
        for file in files:
            if file.endswith(".json"):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                    
                    # Convert json content to plain text to chunk
                    text_representation = json.dumps(data)
                    chunks = chunk_text(text_representation)
                    
                    for idx, chunk in enumerate(chunks):
                        embeddings_out.append({
                            "source_file": file,
                            "chunk_index": idx,
                            "content": chunk,
                            "embedding": mock_get_embedding(chunk)
                        })
                except Exception as e:
                    print(f"Failed to embed {file_path}: {e}")
                    
    print(f"Generated {len(embeddings_out)} chunks and embeddings.")
    return embeddings_out

if __name__ == "__main__":
    kb_embeddings = generate_kb_embeddings()
