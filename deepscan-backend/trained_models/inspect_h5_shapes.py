import h5py

path = '/app/trained_models/image_prediction_model/model_cp (1).h5'
with h5py.File(path, 'r') as f:
    print("ALL DATASETS:")
    
    def visit_func(name, node):
        if isinstance(node, h5py.Dataset):
            print(f"{name}: {node.shape}")
            
    f.visititems(visit_func)
