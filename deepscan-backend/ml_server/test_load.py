import os, sys, traceback
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
import tensorflow as tf

print(f"TF version: {tf.__version__}")

# Compatibility shim
@tf.keras.utils.register_keras_serializable(package="Custom")
class CastToFloat32(tf.keras.layers.Layer):
    def call(self, inputs):
        return tf.cast(inputs, tf.float32)

CUSTOM_OBJECTS = {"CastToFloat32": CastToFloat32}

IMG_PATH = os.path.join(os.path.dirname(__file__), "..", "trained_models", "image_prediction_model", "model_cp (1).h5")
VID_PATH = os.path.join(os.path.dirname(__file__), "..", "trained_models", "video_prediction_model", "best_model.keras")

print(f"\nImage model path: {os.path.abspath(IMG_PATH)}")
print(f"  Exists: {os.path.exists(IMG_PATH)}")

print(f"\nVideo model path: {os.path.abspath(VID_PATH)}")
print(f"  Exists: {os.path.exists(VID_PATH)}")

print("\n--- Loading image model ---")
try:
    m1 = tf.keras.models.load_model(IMG_PATH, compile=False, custom_objects=CUSTOM_OBJECTS)
    print(f"  SUCCESS: input={m1.input_shape}, output={m1.output_shape}")
except Exception as e:
    print(f"  FAILED: {e}")

print("\n--- Loading video model ---")
try:
    m2 = tf.keras.models.load_model(VID_PATH, compile=False, custom_objects=CUSTOM_OBJECTS)
    print(f"  SUCCESS: input={m2.input_shape}, output={m2.output_shape}")
except Exception as e:
    print(f"  FAILED: {e}")
