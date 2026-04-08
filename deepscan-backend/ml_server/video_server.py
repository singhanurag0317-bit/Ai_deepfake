"""
DeepScan — Video Prediction Server (FastAPI)
=============================================
Loads the trained video Keras model and serves predictions.

Endpoint:
  POST /predict/video   – accepts a video file, returns deepfake score
  GET  /health          – health check

Default port: 5500
"""

import os
import traceback
import tempfile

import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf  # noqa: E402

# ─── Compatibility shim for older TF models ─────────────────────────────────
@tf.keras.utils.register_keras_serializable(package="Custom")
class CastToFloat32(tf.keras.layers.Layer):
    def call(self, inputs):
        return tf.cast(inputs, tf.float32)

CUSTOM_OBJECTS = {"CastToFloat32": CastToFloat32}

# ─── Config ──────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINED_MODELS_DIR = os.path.join(BASE_DIR, "..", "trained_models")
# Only models under trained_models/video_prediction_model/ are used for video prediction.
_VIDEO_SUBDIR = "video_prediction_model"
_VIDEO_FILE = os.environ.get("DEEPSCAN_VIDEO_MODEL_FILE", "best_model.keras")
VIDEO_MODEL_PATH = os.path.join(TRAINED_MODELS_DIR, _VIDEO_SUBDIR, _VIDEO_FILE)
IMAGE_SIZE = (64, 64)
VIDEO_SAMPLE_FRAMES = 15

# ─── Load model at module level (sync, before FastAPI starts) ────────────────
video_model = None
print("🔄 Loading video model …")
try:
    video_model = tf.keras.models.load_model(
        VIDEO_MODEL_PATH, compile=False, custom_objects=CUSTOM_OBJECTS
    )
    print(f"✅ Video model loaded from {VIDEO_MODEL_PATH}")
    print(f"   Input shape : {video_model.input_shape}")
    print(f"   Output shape: {video_model.output_shape}")
except Exception as exc:
    print(f"❌ Failed to load video model: {exc}")
    traceback.print_exc()

# ─── FastAPI App ─────────────────────────────────────────────────────────────
app = FastAPI(title="DeepScan Video Prediction Server", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def extract_frames(video_path: str, num_frames: int = VIDEO_SAMPLE_FRAMES) -> list[np.ndarray]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        raise ValueError("Video has no frames")

    indices = np.linspace(0, total_frames - 1, num=min(num_frames, total_frames), dtype=int)

    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if not ret:
            continue
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_resized = cv2.resize(frame_rgb, IMAGE_SIZE)
        frames.append(frame_resized.astype(np.float32) / 255.0)

    cap.release()
    return frames


def interpret_prediction(raw_output: np.ndarray) -> dict:
    """Map model output to fake probability [0,1]. Handles logits or probabilities."""
    raw = np.asarray(raw_output).flatten().astype(np.float64)
    n = raw.size
    if n == 1:
        v = float(raw[0])
        if 0.0 <= v <= 1.0:
            fake_prob = v
        else:
            fake_prob = float(1.0 / (1.0 + np.exp(-np.clip(v, -40.0, 40.0))))
    elif n == 2:
        e = np.exp(raw - np.max(raw))
        p = e / np.sum(e)
        fake_prob = float(p[1])
    else:
        e = np.exp(raw - np.max(raw))
        p = e / np.sum(e)
        fake_prob = float(np.max(p))
    return {"score": round(fake_prob * 100, 2), "raw": raw.tolist()}


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "video_model_loaded": video_model is not None}


@app.post("/predict/video")
async def predict_video(file: UploadFile = File(...)):
    if video_model is None:
        raise HTTPException(status_code=503, detail="Video model not loaded")

    suffix = os.path.splitext(file.filename or "upload.mp4")[1] or ".mp4"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        contents = await file.read()
        tmp.write(contents)
        tmp.close()

        frames = extract_frames(tmp.name)
        if not frames:
            raise HTTPException(status_code=400, detail="Could not extract frames from video")

        frame_scores = []
        for frame in frames:
            tensor = np.expand_dims(frame, axis=0)
            prediction = video_model.predict(tensor, verbose=0)
            result = interpret_prediction(prediction)
            frame_scores.append(result["score"])

        avg_score = round(float(np.mean(frame_scores)), 2)

        return {
            "model_score": avg_score,
            "status": "success",
            "frame_scores": frame_scores,
            "frames_analyzed": len(frame_scores),
        }
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


# ─── Main ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("VIDEO_SERVER_PORT", 5500))
    print(f"🚀 Video Prediction Server starting on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
