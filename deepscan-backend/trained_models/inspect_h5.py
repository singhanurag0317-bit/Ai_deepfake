import h5py
import sys

path = '/app/trained_models/image_prediction_model/model_cp (1).h5'
try:
    with h5py.File(path, 'r') as f:
        print("Keys:", list(f.keys()))
        if 'model_config' in f.attrs:
            print("Model Config found!")
        else:
            print("No model_config attribute.")
        if 'layer_names' in f.attrs:
            print("Layer names:", f.attrs['layer_names'])
except Exception as e:
    print("Error:", str(e))
