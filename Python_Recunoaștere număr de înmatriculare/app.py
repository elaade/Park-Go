from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import easyocr
import cv2
import numpy as np
import requests
import os
import re
import tempfile
import uuid
import subprocess
import imageio_ffmpeg
from collections import Counter

app = Flask(__name__, static_folder="static")
CORS(app)

MODEL_PATH = "best.pt"

PHP_VERIFY_URL = "http://localhost/verify_plate.php"
PHP_EXIT_URL = "http://localhost/exit_vehicle.php"

CONFIDENCE_THRESHOLD = 0.4
OCR_MIN_SCORE = 0.4
FRAME_SKIP = 10

OUTPUT_DIR = os.path.join("static", "results")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Încarc modelul YOLO...")
model = YOLO(MODEL_PATH)

print("Încarc EasyOCR...")
reader = easyocr.Reader(["en"], gpu=False)


def clean_plate_text(text):
    text = text.upper()
    text = text.replace(" ", "")
    text = text.replace("-", "")
    text = text.replace(".", "")
    text = text.replace("_", "")
    text = re.sub(r"[^A-Z0-9]", "", text)
    return text


def is_possible_plate(text):
    if not text:
        return False

    if len(text) < 5 or len(text) > 10:
        return False

    has_letter = any(c.isalpha() for c in text)
    has_digit = any(c.isdigit() for c in text)

    return has_letter and has_digit


def is_valid_ro_plate(text):
    pattern = r"^[A-Z]{1,2}[0-9]{2,3}[A-Z]{3}$"
    return re.match(pattern, text) is not None


def convert_video_to_browser_mp4(input_path, output_path):
    
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    command = [
        ffmpeg_exe,
        "-y",
        "-i", input_path,
        "-vcodec", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "faststart",
        output_path
    ]

    subprocess.run(command, check=True)


def detect_plate_on_frame(frame):

    if frame is None:
        return None

    image_height, image_width = frame.shape[:2]
    results = model(frame, verbose=False)

    best_plate = ""
    best_ocr_score = 0
    best_yolo_confidence = 0
    best_bbox = None
    best_crop = None

    for result in results:
        boxes = result.boxes

        if boxes is None or len(boxes) == 0:
            continue

        for box in boxes:
            yolo_confidence = float(box.conf[0])

            if yolo_confidence < CONFIDENCE_THRESHOLD:
                continue

            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)

            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(image_width, x2)
            y2 = min(image_height, y2)

            plate_crop = frame[y1:y2, x1:x2]

            if plate_crop.size == 0:
                continue

            gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, None, fx=2, fy=2)

            ocr_results = reader.readtext(gray)

            for detection in ocr_results:
                raw_text = detection[1]
                ocr_score = float(detection[2])
                cleaned = clean_plate_text(raw_text)

                if ocr_score < OCR_MIN_SCORE:
                    continue

                if not is_possible_plate(cleaned):
                    continue

                final_score = ocr_score

                if is_valid_ro_plate(cleaned):
                    final_score += 0.2

                if final_score > best_ocr_score:
                    best_ocr_score = final_score
                    best_plate = cleaned
                    best_yolo_confidence = yolo_confidence
                    best_bbox = {
                        "x1": int(x1),
                        "y1": int(y1),
                        "x2": int(x2),
                        "y2": int(y2),
                        "image_width": int(image_width),
                        "image_height": int(image_height)
                    }
                    best_crop = plate_crop.copy()

    if best_plate:
        return {
            "plate": best_plate,
            "ocr_score": round(best_ocr_score, 2),
            "yolo_confidence": round(best_yolo_confidence, 2),
            "bbox": best_bbox,
            "crop": best_crop
        }

    return None


def recognize_plate_from_image(image):
    detection = detect_plate_on_frame(image)

    if not detection:
        return None

    return {
        "plate": detection["plate"],
        "ocr_score": detection["ocr_score"],
        "yolo_confidence": detection["yolo_confidence"],
        "bbox": detection["bbox"]
    }


def draw_detection(frame, detection):
    if not detection or not detection.get("bbox"):
        return frame

    bbox = detection["bbox"]
    plate = detection["plate"]

    x1 = bbox["x1"]
    y1 = bbox["y1"]
    x2 = bbox["x2"]
    y2 = bbox["y2"]

    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)

    label = f"{plate} | YOLO {detection['yolo_confidence']}"
    label_y = max(y1 - 10, 30)

    cv2.putText(
        frame,
        label,
        (x1, label_y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )

    return frame


def recognize_plate_from_video(video_path):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return None

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if fps == 0:
        fps = 25

    output_id = str(uuid.uuid4())

    raw_video_filename = f"raw_processed_{output_id}.mp4"
    processed_video_filename = f"processed_{output_id}.mp4"
    crop_filename = f"crop_{output_id}.jpg"

    raw_video_path = os.path.join(OUTPUT_DIR, raw_video_filename)
    processed_video_path = os.path.join(OUTPUT_DIR, processed_video_filename)
    crop_path = os.path.join(OUTPUT_DIR, crop_filename)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(raw_video_path, fourcc, fps, (width, height))

    if not writer.isOpened():
        cap.release()
        return None

    frame_index = 0
    detections = []

    best_detection = None
    best_score = 0
    last_detection = None

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        frame_index += 1
        output_frame = frame.copy()

        if frame_index % FRAME_SKIP == 0:
            detection = detect_plate_on_frame(frame)

            if detection:
                plate = detection["plate"]
                detections.append(plate)

                score = detection["ocr_score"]

                if score > best_score:
                    best_score = score
                    best_detection = detection

                    if detection.get("crop") is not None:
                        cv2.imwrite(crop_path, detection["crop"])

                last_detection = detection

                print(
                    f"Frame {frame_index} | Plate: {plate} | "
                    f"OCR: {detection['ocr_score']} | YOLO: {detection['yolo_confidence']}"
                )

        if last_detection:
            output_frame = draw_detection(output_frame, last_detection)

        writer.write(output_frame)

    cap.release()
    writer.release()

    if not detections:
        if os.path.exists(raw_video_path):
            os.remove(raw_video_path)

        return None

    try:
        convert_video_to_browser_mp4(raw_video_path, processed_video_path)

        if os.path.exists(raw_video_path):
            os.remove(raw_video_path)

    except Exception as e:
        print("Eroare conversie video pentru browser:", e)

        processed_video_path = raw_video_path
        processed_video_filename = raw_video_filename

    most_common_plate, count = Counter(detections).most_common(1)[0]

    host_url = request.host_url.rstrip("/")

    processed_video_url = f"{host_url}/static/results/{processed_video_filename}"

    crop_url = None
    if os.path.exists(crop_path):
        crop_url = f"{host_url}/static/results/{crop_filename}"

    return {
        "plate": most_common_plate,
        "detections_count": len(detections),
        "frequency": count,
        "best_score_plate": best_detection["plate"] if best_detection else most_common_plate,
        "ocr_score": best_detection["ocr_score"] if best_detection else None,
        "yolo_confidence": best_detection["yolo_confidence"] if best_detection else None,
        "bbox": best_detection.get("bbox") if best_detection else None,
        "processed_video_url": processed_video_url,
        "crop_url": crop_url
    }


def send_plate_to_php(license_plate, php_url):
    license_plate = license_plate.strip().upper()

    php_response = requests.post(php_url, data={
        "plate": license_plate
    })

    print("Placă detectată:", license_plate)
    print("URL PHP:", php_url)
    print("Răspuns PHP:", php_response.text)

    try:
        return php_response.json(), php_response.status_code
    except Exception:
        return {
            "status": "eroare_php_json",
            "raw_response": php_response.text
        }, php_response.status_code


@app.route("/api/ocr", methods=["POST"])
def ocr():
    if "image" not in request.files:
        return jsonify({"status": "no_image"}), 400

    file = request.files["image"]
    in_memory_file = file.read()

    npimg = np.frombuffer(in_memory_file, np.uint8)
    image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    if image is None:
        return jsonify({"status": "invalid_image"}), 400

    detection = recognize_plate_from_image(image)

    if not detection:
        return jsonify({
            "status": "no_plate_detected"
        })

    license_plate = detection["plate"]

    try:
        php_data, php_status = send_plate_to_php(license_plate, PHP_VERIFY_URL)

        return jsonify({
            "status": "plate_detected",
            "plate": license_plate,
            "ocr_score": detection["ocr_score"],
            "yolo_confidence": detection["yolo_confidence"],
            "bbox": detection["bbox"],
            "php_result": php_data
        }), php_status

    except Exception as e:
        return jsonify({
            "status": "eroare_php",
            "plate": license_plate,
            "mesaj": str(e)
        }), 500


@app.route("/api/ocr-video", methods=["POST"])
def ocr_video():
    if "video" not in request.files:
        return jsonify({"status": "no_video"}), 400

    file = request.files["video"]
    suffix = os.path.splitext(file.filename)[1]

    if suffix.lower() not in [".mp4", ".avi", ".mov", ".mkv"]:
        return jsonify({
            "status": "invalid_video_format",
            "message": "Format video neacceptat"
        }), 400

    temp_video_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            file.save(temp_file.name)
            temp_video_path = temp_file.name

        detection = recognize_plate_from_video(temp_video_path)

        if not detection:
            return jsonify({
                "status": "no_plate_detected"
            })

        license_plate = detection["plate"]

        php_data, php_status = send_plate_to_php(license_plate, PHP_VERIFY_URL)

        return jsonify({
            "status": "plate_detected",
            "plate": license_plate,
            "detections_count": detection.get("detections_count"),
            "frequency": detection.get("frequency"),
            "best_score_plate": detection.get("best_score_plate"),
            "ocr_score": detection.get("ocr_score"),
            "yolo_confidence": detection.get("yolo_confidence"),
            "bbox": detection.get("bbox"),
            "processed_video_url": detection.get("processed_video_url"),
            "crop_url": detection.get("crop_url"),
            "php_result": php_data
        }), php_status

    except Exception as e:
        return jsonify({
            "status": "eroare_video",
            "mesaj": str(e)
        }), 500

    finally:
        if temp_video_path and os.path.exists(temp_video_path):
            os.remove(temp_video_path)


@app.route("/api/ocr-exit", methods=["POST"])
def ocr_exit():
    if "image" not in request.files:
        return jsonify({"status": "no_image"}), 400

    file = request.files["image"]
    in_memory_file = file.read()

    npimg = np.frombuffer(in_memory_file, np.uint8)
    image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    if image is None:
        return jsonify({"status": "invalid_image"}), 400

    detection = recognize_plate_from_image(image)

    if not detection:
        return jsonify({
            "status": "no_plate_detected"
        })

    license_plate = detection["plate"]

    try:
        php_data, php_status = send_plate_to_php(license_plate, PHP_EXIT_URL)

        return jsonify({
            "status": "plate_detected",
            "plate": license_plate,
            "ocr_score": detection["ocr_score"],
            "yolo_confidence": detection["yolo_confidence"],
            "bbox": detection["bbox"],
            "php_result": php_data
        }), php_status

    except Exception as e:
        return jsonify({
            "status": "eroare_php",
            "plate": license_plate,
            "mesaj": str(e)
        }), 500


@app.route("/api/ocr-exit-video", methods=["POST"])
def ocr_exit_video():
    if "video" not in request.files:
        return jsonify({"status": "no_video"}), 400

    file = request.files["video"]
    suffix = os.path.splitext(file.filename)[1]

    if suffix.lower() not in [".mp4", ".avi", ".mov", ".mkv"]:
        return jsonify({
            "status": "invalid_video_format",
            "message": "Format video neacceptat"
        }), 400

    temp_video_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            file.save(temp_file.name)
            temp_video_path = temp_file.name

        detection = recognize_plate_from_video(temp_video_path)

        if not detection:
            return jsonify({
                "status": "no_plate_detected"
            })

        license_plate = detection["plate"]

        php_data, php_status = send_plate_to_php(license_plate, PHP_EXIT_URL)

        return jsonify({
            "status": "plate_detected",
            "plate": license_plate,
            "detections_count": detection.get("detections_count"),
            "frequency": detection.get("frequency"),
            "best_score_plate": detection.get("best_score_plate"),
            "ocr_score": detection.get("ocr_score"),
            "yolo_confidence": detection.get("yolo_confidence"),
            "bbox": detection.get("bbox"),
            "processed_video_url": detection.get("processed_video_url"),
            "crop_url": detection.get("crop_url"),
            "php_result": php_data
        }), php_status

    except Exception as e:
        return jsonify({
            "status": "eroare_video",
            "mesaj": str(e)
        }), 500

    finally:
        if temp_video_path and os.path.exists(temp_video_path):
            os.remove(temp_video_path)


@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({
        "status": "ok",
        "message": "Flask YOLO + OCR funcționează"
    })


if __name__ == "__main__":
    app.run(port=5000, debug=True)