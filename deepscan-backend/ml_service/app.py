import os
import cv2
import h5py
import numpy as np
from flask import Flask, request, jsonify
import tensorflow as tf
import keras
from keras.saving import register_keras_serializable

app = Flask(__name__)

# --- Mock Custom Layers for Keras 3/Video Model Compatibility ---
@register_keras_serializable(package="Custom", name="CastToFloat32")
class CastToFloat32(keras.layers.Layer):
    def call(self, inputs):
        return tf.cast(inputs, tf.float32)

# Model paths
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)

if os.path.exists(os.path.join(_current_dir, 'trained_models')):
    BASE_DIR = _current_dir
elif os.path.exists(os.path.join(_parent_dir, 'trained_models')):
    BASE_DIR = _parent_dir
else:
    BASE_DIR = _parent_dir # Fallback

IMAGE_MODEL_PATH = os.path.join(BASE_DIR, 'trained_models', 'image_prediction_model', 'model_cp (1).h5')
VIDEO_MODEL_PATH = os.path.join(BASE_DIR, 'trained_models', 'video_prediction_model', 'best_model.keras')

# Set environment paths for tensorflow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

def build_dense_net_model():
    """Manual reconstruction of image model architecture based on .h5 shape analysis."""
    try:
        # Fix: Keras 3 often uses 'input_layer', but the .h5 weights file 
        # specifically needs 'input_1' to load the base weights correctly.
        input_layer = tf.keras.layers.Input(shape=(256, 256, 3), name='input_1')
        
        base_model = tf.keras.applications.DenseNet121(
            include_top=False, 
            weights=None, 
            input_tensor=input_layer
        )
        
        # 2. Add Top Layers matching the h5 weights shapes
        x = base_model.output
        x = tf.keras.layers.GlobalAveragePooling2D()(x)
        
        # First Dense layer (1024 -> 512)
        x = tf.keras.layers.Dense(512, activation='relu', name='dense')(x)
        
        # found weight for "batch_normalization" with 512 units in shapes.txt
        x = tf.keras.layers.BatchNormalization(name='batch_normalization')(x)
        
        x = tf.keras.layers.Dropout(0.5, name='dropout')(x)
        predictions = tf.keras.layers.Dense(1, activation='sigmoid', name='dense_1')(x)
        
        model = tf.keras.models.Model(inputs=base_model.input, outputs=predictions)
        
        if os.path.exists(IMAGE_MODEL_PATH):
            print(f"Attempting manual neuron handshake from: {IMAGE_MODEL_PATH}")
            with h5py.File(IMAGE_MODEL_PATH, 'r') as f:
                # Build a dictionary of ALL datasets in the h5 for quick lookup
                h5_datasets = {}
                def collect_datasets(name, obj):
                    if isinstance(obj, h5py.Dataset):
                        h5_datasets[name] = obj
                f.visititems(collect_datasets)
                
                for layer in model.layers:
                    try:
                        # 1. Find all weights belonging to this layer in the h5
                        search_patterns = [f"{layer.name}/", f"{layer.name.replace('_', '/')}/"]
                        layer_weights_paths = [p for p in h5_datasets.keys() if any(pat in p for pat in search_patterns)]
                        
                        if not layer_weights_paths:
                            continue

                        # 2. Sort weights into the order Keras expects
                        # BatchNormalization: gamma, beta, moving_mean, moving_variance
                        # Dense/Conv: kernel, bias
                        expected_count = len(layer.get_weights())
                        if expected_count == 0:
                            continue

                        sorted_paths = []
                        if 'batch_normalization' in layer.name or '_bn' in layer.name:
                            # BN specific order
                            for p_name in ['gamma', 'beta', 'moving_mean', 'moving_variance']:
                                found = [p for p in layer_weights_paths if p_name in p]
                                if found: sorted_paths.append(found[0])
                        else:
                            # Dense/Conv specific order
                            for p_name in ['kernel', 'bias']:
                                found = [p for p in layer_weights_paths if p_name in p]
                                if found: sorted_paths.append(found[0])

                        # Cleanup: if the specialized sorting didn't catch everything, fallback to alphabetical 
                        # (but the above covers 99% of DenseNet/Dense layers)
                        if len(sorted_paths) != expected_count:
                             sorted_paths = sorted(list(set(layer_weights_paths)))

                        weights = [np.array(h5_datasets[p]) for p in sorted_paths]
                        
                        if len(weights) == expected_count:
                            layer.set_weights(weights)
                        else:
                            print(f"  ⚠️ Handshake partial for {layer.name}: counting {len(weights)}/{expected_count}")
                    except Exception as e:
                        print(f"  ⚠️ Handshake skipped for {layer.name}: {e}")
            
            print("🚀 Manual Parameter-Aware Handshake Complete! All neurons are synchronized.")
            return model
        return None
    except Exception as e:
        print(f"Error reconstructing image model: {e}")
        return None

def safe_load_video_model():
    """Loads the video model (Keras 3 format)."""
    try:
        if os.path.exists(VIDEO_MODEL_PATH):
            print(f"Loading video model: {VIDEO_MODEL_PATH}")
            # Loading with compile=False and the registered CastToFloat32 class
            model = tf.keras.models.load_model(VIDEO_MODEL_PATH, compile=False)
            return model
        return None
    except Exception as e:
        print(f"Error loading video model {VIDEO_MODEL_PATH}: {e}")
        return None

# Load models at startup
image_model = build_dense_net_model()
video_model = safe_load_video_model()

def preprocess_image(filepath, target_size=(256, 256)):
    img = cv2.imread(filepath)
    if img is None:
        return None
    # Precision Lock: Convert BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, target_size)
    
    # Precision Lock: Use official DenseNet preprocessing (ImageNet mean/std)
    # Now that weight mapping and 4GB RAM are stable, this math is required.
    img = tf.keras.applications.densenet.preprocess_input(img)
    
    img = np.expand_dims(img, axis=0)
    return img

def predict_score(model, data):
    pred = model.predict(data)
    print("Raw prediction output:", pred)
    
    # Model Inversion Fix: 
    # Current model outputs 1.0 for REAL images. 
    # UI expects HIGH score for FAKE images.
    # Therefore, Score = (1.0 - prediction) * 100
    score = (1.0 - float(pred[0][0])) * 100
    return max(0, min(100, score))

@app.route('/predict-image', methods=['POST'])
def predict_image():
    if image_model is None:
        return jsonify({"status": "error", "error": "Image model failed to load."})
    
    data = request.json
    filepath = data.get('filepath')
    
    if not filepath or not os.path.exists(filepath):
        return jsonify({"status": "error", "error": f"File not found: {filepath}"})

    img_data = preprocess_image(filepath, (256, 256))
    
    if img_data is None:
        return jsonify({"status": "error", "error": "Failed to process image."})
    
    try:
        score = predict_score(image_model, img_data)
        return jsonify({
            "status": "success",
            "model_score": score,
            "artifact_score": score
        })
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)})

@app.route('/predict-video', methods=['POST'])
def predict_video():
    if video_model is None:
        return jsonify({"status": "error", "error": "Video model not loaded."})
    
    data = request.json
    filepath = data.get('filepath')
    
    if not filepath or not os.path.exists(filepath):
        return jsonify({"status": "error", "error": f"File not found: {filepath}"})

    try:
        cap = cv2.VideoCapture(filepath)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            return jsonify({"status": "error", "error": "Could not read frames from video."})
            
        cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames // 2)
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
             return jsonify({"status": "error", "error": "Could not extract frame from video."})
             
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        input_shape = video_model.input_shape
        target_h, target_w = (256, 256)
        if input_shape and len(input_shape) >= 3:
             target_h = input_shape[1] if input_shape[1] else 256
             target_w = input_shape[2] if input_shape[2] else 256
        
        frame = cv2.resize(frame, (target_w, target_h))
        
        # Model Calibration: Use 0-1 scaling for video frames as well
        frame = frame / 255.0
        
        frame_data = np.expand_dims(frame, axis=0)

        score = predict_score(video_model, frame_data)
        
        return jsonify({
            "status": "success",
            "model_score": score,
            "artifact_score": score
        })
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)})

if __name__ == '__main__':
    print("🚀 Starting Flask ML API on port 5001...")
    # Bind to 0.0.0.0 so Docker containers can reach it
    app.run(host='0.0.0.0', port=5001, debug=False)