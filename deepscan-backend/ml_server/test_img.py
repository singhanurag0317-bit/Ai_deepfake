import os, sys, traceback, h5py
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

path = r"d:\Project\Ai_deepfake-new\deepscan-backend\trained_models\image_prediction_model\model_cp (1).h5"

log = open(r"d:\Project\Ai_deepfake-new\deepscan-backend\ml_server\debug2.log", "w")

# Check h5 structure
log.write("=== H5 File Structure ===\n")
try:
    with h5py.File(path, "r") as f:
        def print_attrs(name, obj):
            log.write(f"  {name}\n")
            for key, val in obj.attrs.items():
                val_str = str(val)[:200]
                log.write(f"    @{key} = {val_str}\n")
        f.visititems(print_attrs)
        log.write(f"\nRoot attrs: {list(f.attrs.keys())}\n")
        for k, v in f.attrs.items():
            log.write(f"  @{k} = {str(v)[:500]}\n")
except Exception as e:
    log.write(f"h5py error: {e}\n")

# Try loading approaches
import tensorflow as tf

@tf.keras.utils.register_keras_serializable(package="Custom")
class CastToFloat32(tf.keras.layers.Layer):
    def call(self, inputs):
        return tf.cast(inputs, tf.float32)

CO = {"CastToFloat32": CastToFloat32}

log.write("\n=== Approach 1: load_model ===\n")
try:
    m = tf.keras.models.load_model(path, compile=False, custom_objects=CO)
    log.write(f"SUCCESS: {m.input_shape} -> {m.output_shape}\n")
except Exception as e:
    log.write(f"FAILED: {e}\n")
    traceback.print_exc(file=log)

log.write("\n=== Approach 2: load_model safe_mode=False ===\n")
try:
    m = tf.keras.models.load_model(path, compile=False, custom_objects=CO, safe_mode=False)
    log.write(f"SUCCESS: {m.input_shape} -> {m.output_shape}\n")
except Exception as e:
    log.write(f"FAILED: {e}\n")
    traceback.print_exc(file=log)

log.write("\nDONE\n")
log.close()
print("Written to debug2.log")
