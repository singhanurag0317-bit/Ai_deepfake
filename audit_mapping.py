import tensorflow as tf
import h5py
import numpy as np
import os
from app import image_model, IMAGE_MODEL_PATH

def audit_mapping():
    if not os.path.exists(IMAGE_MODEL_PATH):
        print("Model file not found!")
        return
    
    with h5py.File(IMAGE_MODEL_PATH, 'r') as f:
        # Build a dictionary of ALL datasets in the h5 for quick lookup
        h5_datasets = {}
        def collect_datasets(name, obj):
            if isinstance(obj, h5py.Dataset):
                h5_datasets[name] = obj
        f.visititems(collect_datasets)
        
        matches = 0
        total = 0
        for layer in image_model.layers:
            # Check if this layer has ANY weights
            expected_weights = layer.get_weights()
            if not expected_weights:
                continue
            
            total += 1
            search_patterns = [f"{layer.name}/", f"{layer.name.replace('_', '/')}/"]
            layer_h5_paths = [p for p in h5_datasets.keys() if any(pat in p for pat in search_patterns)]
            
            if layer_h5_paths:
                # Check for magnitude (random vs loaded)
                if abs(expected_weights[0]).sum() > 0:
                    matches += 1
                else:
                    print(f"MISS (Found but ZEROS): {layer.name}")
            else:
                print(f"MISS (No path match): {layer.name}")
        
        print(f"\nAUDIT COMPLETE: {matches}/{total} Active Layers ({(matches/total)*100:.1f}%)")

if __name__ == "__main__":
    audit_mapping()
