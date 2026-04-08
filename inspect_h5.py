import h5py
import os

IMAGE_MODEL_PATH = '/app/trained_models/image_prediction_model/model_cp (1).h5'

def inspect_h5():
    if not os.path.exists(IMAGE_MODEL_PATH):
        print("Model file not found!")
        return
    
    with h5py.File(IMAGE_MODEL_PATH, 'r') as f:
        print(f"Top level keys: {list(f.keys())}")
        
        count = 0
        def p(n, o):
            nonlocal count
            if isinstance(o, h5py.Dataset) and count < 50:
                print(f"PATH: {n}, SHAPE: {o.shape}")
                count += 1
        f.visititems(p)

if __name__ == "__main__":
    inspect_h5()
