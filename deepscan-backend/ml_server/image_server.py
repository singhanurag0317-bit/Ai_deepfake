"""
DeepScan — Image Prediction Server (FastAPI)
=============================================
Loads the trained image model from trained_models/image_prediction_model
and serves predictions directly from that model.

Endpoint:
    POST /predict/image   – accepts an image file, returns prediction + confidence
    GET  /health          – health check

Default port: 7000
"""

import os
import traceback
import tempfile

import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import cv2

import torch
import torch.nn as nn
import torch.nn.functional as F
from pytorchcv.model_provider import get_model as ptcv_get_model

# ─── Config ──────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINED_MODELS_DIR = os.path.join(BASE_DIR, "..", "trained_models")
_IMAGE_SUBDIR = "image_prediction_model"
IMAGE_MODELS_DIR = os.path.join(TRAINED_MODELS_DIR, _IMAGE_SUBDIR)


def _env_truthy(name: str, default: bool = False) -> bool:
    value = os.environ.get(name, "")
    if value == "":
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, str(default)).strip())
    except Exception:
        return default


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, str(default)).strip())
    except Exception:
        return default


_size = _env_int("DEEPSCAN_IMAGE_SIZE", 64)
IMAGE_SIZE = (_size, _size)
USE_IMAGENET_NORM = _env_truthy("DEEPSCAN_IMAGE_IMAGENET_NORM", default=True)
# This checkpoint in this project is calibrated with positive class as real.
POSITIVE_CLASS = os.environ.get("DEEPSCAN_IMAGE_POSITIVE_CLASS", "real").strip().lower()
# Calibrated on Human Faces Dataset (AI=4630, Real=5000):
# best balanced-accuracy threshold is 0.07.
DEEPFAKE_THRESHOLD = _env_float("DEEPSCAN_IMAGE_DEEPFAKE_THRESHOLD", 0.07)
VIDEO_POSITIVE_CLASS = os.environ.get("DEEPSCAN_VIDEO_AS_IMAGE_POSITIVE_CLASS", POSITIVE_CLASS).strip().lower()
VIDEO_DEEPFAKE_THRESHOLD = _env_float("DEEPSCAN_VIDEO_AS_IMAGE_DEEPFAKE_THRESHOLD", DEEPFAKE_THRESHOLD)
VIDEO_NUM_SAMPLES = 8
VIDEO_DECISION_THRESHOLD = _env_float("DEEPSCAN_VIDEO_AS_IMAGE_DECISION_THRESHOLD", 0.6)
VIDEO_FACE_SIZE = (_env_int("DEEPSCAN_VIDEO_FACE_SIZE", 224), _env_int("DEEPSCAN_VIDEO_FACE_SIZE", 224))


def _pick_image_model_path() -> str:
    """
    Pick image model in priority order:
      1) DEEPSCAN_IMAGE_MODEL_FILE (if set)
      2) model_v3.pth
            3) first .pth/.pt file in folder (sorted)
    """
    env_file = os.environ.get("DEEPSCAN_IMAGE_MODEL_FILE", "").strip()
    if env_file:
        candidate = env_file
        if not os.path.isabs(candidate):
            candidate = os.path.join(IMAGE_MODELS_DIR, candidate)
        return candidate

    preferred = os.path.join(IMAGE_MODELS_DIR, "model_v3.pth")
    if os.path.isfile(preferred):
        return preferred

    if not os.path.isdir(IMAGE_MODELS_DIR):
        return preferred

    supported_exts = (".pth", ".pt")
    candidates = sorted(
        [
            os.path.join(IMAGE_MODELS_DIR, name)
            for name in os.listdir(IMAGE_MODELS_DIR)
            if name.lower().endswith(supported_exts)
        ]
    )
    return candidates[0] if candidates else preferred


IMAGE_MODEL_PATH = _pick_image_model_path()


class _XceptionHead(nn.Module):
    def __init__(self):
        super().__init__()
        self.b1 = nn.BatchNorm1d(2048)
        self.l = nn.Linear(2048, 512)
        self.b2 = nn.BatchNorm1d(512)
        self.o = nn.Linear(512, 1)

    def forward(self, x):
        x = self.b1(x)
        x = self.l(x)
        x = F.relu(x, inplace=False)
        x = self.b2(x)
        x = self.o(x)
        return x


class _ImageTorchModel(nn.Module):
    def __init__(self):
        super().__init__()
        base_model = ptcv_get_model("xception", pretrained=False)
        # The default pool is AvgPool2d(kernel_size=10), which assumes large inputs.
        # Replace it so 64x64 inference remains valid.
        base_model.features.final_block.pool = nn.AdaptiveAvgPool2d(1)
        self.base = nn.Sequential(base_model.features)
        self.h1 = _XceptionHead()

    def forward(self, x):
        x = self.base(x)
        x = torch.flatten(x, 1)
        x = self.h1(x)
        return x


def _load_torch_image_model(weights_path: str):
    if not os.path.isfile(weights_path):
        raise RuntimeError(f"Image model file not found: {weights_path}")
    if not weights_path.lower().endswith((".pt", ".pth")):
        raise RuntimeError(
            "Unsupported image model format. Only .pt/.pth are allowed for image inference."
        )

    state = torch.load(weights_path, map_location="cpu")
    if not isinstance(state, dict):
        raise RuntimeError("Unsupported .pth format: expected state_dict dictionary")

    model = _ImageTorchModel().eval()
    missing, unexpected = model.load_state_dict(state, strict=False)
    if missing or unexpected:
        raise RuntimeError(
            f"State dict mismatch. missing={len(missing)} unexpected={len(unexpected)}"
        )
    return model


# ─── Load model at module level (sync, before FastAPI starts) ────────────────
image_model = None
print("[ImageModel] Loading image model ...")
try:
    image_model = _load_torch_image_model(IMAGE_MODEL_PATH)
    print(f"[ImageModel] Loaded successfully from: {IMAGE_MODEL_PATH}")
    print(f"[ImageModel] Input shape: [N, 3, {IMAGE_SIZE[0]}, {IMAGE_SIZE[1]}]")
    print("[ImageModel] Output shape: [N, 1]")
    print(
        "[ImageModel] Calibration: "
        f"positive_class={POSITIVE_CLASS}, deepfake_threshold={DEEPFAKE_THRESHOLD}, "
        f"imagenet_norm={USE_IMAGENET_NORM}"
    )
    print(
        "[VideoAsImage] Calibration: "
        f"positive_class={VIDEO_POSITIVE_CLASS}, deepfake_threshold={VIDEO_DEEPFAKE_THRESHOLD}, "
        f"samples={VIDEO_NUM_SAMPLES}, decision_threshold={VIDEO_DECISION_THRESHOLD}, "
        f"face_size={VIDEO_FACE_SIZE[0]}"
    )
except Exception as exc:
    print(f"[ImageModel] Failed to load model: {exc}")
    traceback.print_exc()

# ─── FastAPI App ─────────────────────────────────────────────────────────────
app = FastAPI(title="DeepScan Image Prediction Server", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def preprocess_rgb_array(arr_rgb: np.ndarray) -> np.ndarray:
    arr = arr_rgb.astype(np.float32) / 255.0

    # Xception backbones are typically trained with ImageNet normalization.
    if USE_IMAGENET_NORM:
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        arr = (arr - mean) / std

    arr = np.transpose(arr, (2, 0, 1))
    return np.expand_dims(arr, axis=0)


def preprocess_image(image_path: str) -> np.ndarray:
    img = Image.open(image_path).convert("RGB").resize(IMAGE_SIZE)
    arr_rgb = np.array(img, dtype=np.float32)
    return preprocess_rgb_array(arr_rgb)


def _load_face_detector() -> cv2.CascadeClassifier:
    cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
    detector = cv2.CascadeClassifier(cascade_path)
    if detector.empty():
        raise RuntimeError(f"Could not load face detector at: {cascade_path}")
    return detector


FACE_DETECTOR = _load_face_detector()


def _uniform_sample_indices(total_frames: int, fps: float, sample_count: int) -> tuple[list[int], float]:
    if total_frames <= 0:
        raise RuntimeError("Video has no frames")

    duration_seconds = float(total_frames / max(fps, 1e-6))
    n = max(1, int(sample_count))

    # Uniform timestamps: t_i = (i * T) / (N + 1), for i = 1..N
    timestamps = [(i * duration_seconds) / (n + 1) for i in range(1, n + 1)]
    indices: list[int] = []
    for ts in timestamps:
        idx = int(round(ts * fps))
        idx = max(0, min(total_frames - 1, idx))
        indices.append(idx)

    if not indices:
        indices = [total_frames // 2]
    return indices, duration_seconds


def _extract_face_or_full_frame(frame_bgr: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    faces = FACE_DETECTOR.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
    )

    if len(faces) == 0:
        roi = frame_bgr
    else:
        x, y, w, h = max(faces, key=lambda r: int(r[2]) * int(r[3]))
        roi = frame_bgr[y : y + h, x : x + w]

    if roi.size == 0:
        roi = frame_bgr

    roi_rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
    return cv2.resize(roi_rgb, VIDEO_FACE_SIZE)


def preprocess_video_frames_around_second(
    video_path: str,
    sample_count: int = VIDEO_NUM_SAMPLES,
) -> tuple[list[np.ndarray], list[int], float, float]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = float(cap.get(cv2.CAP_PROP_FPS))
    if fps <= 0:
        fps = 30.0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        raise RuntimeError("Video has no frames")

    indices, duration_seconds = _uniform_sample_indices(
        total_frames=total_frames,
        fps=fps,
        sample_count=max(1, int(sample_count)),
    )

    tensors: list[np.ndarray] = []
    used_indices: list[int] = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            continue
        frame_rgb = _extract_face_or_full_frame(frame)
        tensors.append(preprocess_rgb_array(frame_rgb))
        used_indices.append(int(idx))

    cap.release()

    if not tensors:
        raise RuntimeError("Could not extract frames from video")

    return tensors, used_indices, fps, duration_seconds


def run_image_inference(tensor: np.ndarray) -> np.ndarray:
    with torch.no_grad():
        t = torch.from_numpy(tensor).to(dtype=torch.float32)
        pred = image_model(t)
        return pred.detach().cpu().numpy()


def _positive_probability(raw_output: np.ndarray) -> float:
    raw = np.asarray(raw_output).flatten().astype(np.float64)
    n = raw.size

    if n == 1:
        v = float(raw[0])
        if 0.0 <= v <= 1.0:
            return v
        return float(1.0 / (1.0 + np.exp(-np.clip(v, -40.0, 40.0))))

    if n == 2:
        e = np.exp(raw - np.max(raw))
        p = e / np.sum(e)
        return float(p[1])

    e = np.exp(raw - np.max(raw))
    p = e / np.sum(e)
    return float(np.max(p))


def deepfake_probability(raw_output: np.ndarray, positive_class: str = POSITIVE_CLASS) -> float:
    if positive_class not in ("real", "deepfake"):
        raise RuntimeError("positive_class must be either 'real' or 'deepfake'")

    positive_prob = _positive_probability(raw_output)
    deepfake_prob = positive_prob if positive_class == "deepfake" else (1.0 - positive_prob)
    return float(np.clip(deepfake_prob, 0.0, 1.0))


def interpret_prediction(
    raw_output: np.ndarray,
    threshold: float = DEEPFAKE_THRESHOLD,
    positive_class: str = POSITIVE_CLASS,
) -> tuple[str, float, float]:
    """
    Convert model output into:
        prediction ('real'|'deepfake')
        predicted-class confidence [0,1]
        deepfake probability [0,1]
    """
    deepfake_prob = deepfake_probability(raw_output, positive_class=positive_class)

    prediction = "deepfake" if deepfake_prob >= threshold else "real"
    confidence = deepfake_prob if prediction == "deepfake" else (1.0 - deepfake_prob)
    confidence = float(round(confidence, 6))
    return prediction, confidence, deepfake_prob


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "image_model_loaded": image_model is not None,
        "image_model_path": IMAGE_MODEL_PATH,
        "runtime": "torch",
    }


@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    if image_model is None:
        raise HTTPException(status_code=503, detail="Image model not loaded")

    suffix = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        contents = await file.read()
        tmp.write(contents)
        tmp.close()

        tensor = preprocess_image(tmp.name)
        prediction = run_image_inference(tensor)
        label, confidence, deepfake_prob = interpret_prediction(
            prediction,
            threshold=DEEPFAKE_THRESHOLD,
            positive_class=POSITIVE_CLASS,
        )

        print(
            f"[ImageModel] Prediction executed for {file.filename or 'upload'} | "
            f"prediction={label} confidence={confidence} deepfake_probability={deepfake_prob}"
        )

        return {
            "prediction": label,
            "confidence": confidence,
            "deepfake_probability": float(round(deepfake_prob, 6)),
        }
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


@app.post("/predict/video-as-image")
async def predict_video_as_image(file: UploadFile = File(...)):
    if image_model is None:
        raise HTTPException(status_code=503, detail="Image model not loaded")

    suffix = os.path.splitext(file.filename or "upload.mp4")[1] or ".mp4"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        contents = await file.read()
        tmp.write(contents)
        tmp.close()

        tensors, frame_indices, fps, duration_seconds = preprocess_video_frames_around_second(
            tmp.name,
            sample_count=VIDEO_NUM_SAMPLES,
        )

        frame_deepfake_probs: list[float] = []
        for tensor in tensors:
            raw_output = run_image_inference(tensor)
            frame_deepfake_probs.append(
                deepfake_probability(raw_output, positive_class=VIDEO_POSITIVE_CLASS)
            )

        score_values = np.array(frame_deepfake_probs, dtype=np.float64)
        deepfake_prob = float(np.mean(score_values))

        # Fixed decision rule requested for multi-frame video-as-image mode.
        decision_threshold = float(VIDEO_DECISION_THRESHOLD)
        label = "deepfake" if deepfake_prob > decision_threshold else "real"
        confidence = deepfake_prob if label == "deepfake" else (1.0 - deepfake_prob)
        confidence = float(round(confidence, 6))

        center_idx = frame_indices[len(frame_indices) // 2]

        return {
            "prediction": label,
            "confidence": confidence,
            "deepfake_probability": float(round(deepfake_prob, 6)),
            "sampled_second": float(round(center_idx / fps, 3)),
            "sampled_frame_index": int(center_idx),
            "sampled_frame_indices": [int(i) for i in frame_indices],
            "frames_analyzed": int(len(frame_indices)),
            "mode": "video_as_image",
            "video_duration_seconds": float(round(duration_seconds, 3)),
            "calibration_threshold": float(VIDEO_DEEPFAKE_THRESHOLD),
            "decision_threshold": float(round(decision_threshold, 6)),
            "aggregation": "mean",
            "frame_deepfake_probabilities": [float(round(v, 6)) for v in frame_deepfake_probs],
        }
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
    port = int(os.environ.get("IMAGE_SERVER_PORT", 7000))
    print(f"🚀 Image Prediction Server starting on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
