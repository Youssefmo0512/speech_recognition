import os
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from speech_to_text import transcribe_audio_details


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac", ".webm", ".mp4"}
MODEL_SIZES = {"tiny", "base", "small", "medium", "large-v3"}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024
UPLOAD_DIR.mkdir(exist_ok=True)


def is_allowed_file(filename):
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.post("/api/transcribe")
def transcribe():
    audio_file = request.files.get("audio")
    if not audio_file or not audio_file.filename:
        return jsonify({"error": "Please upload or record an audio file first."}), 400

    if not is_allowed_file(audio_file.filename):
        return jsonify({"error": "Unsupported file type. Use WAV, MP3, M4A, OGG, FLAC, WEBM, or MP4."}), 400

    model_size = request.form.get("model_size", "base")
    if model_size not in MODEL_SIZES:
        model_size = "base"

    language = request.form.get("language") or None
    safe_name = secure_filename(audio_file.filename)
    suffix = Path(safe_name).suffix or ".wav"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=UPLOAD_DIR) as temp_file:
            temp_path = temp_file.name
            audio_file.save(temp_file)

        result = transcribe_audio_details(temp_path, model_size=model_size, language=language)
        result["filename"] = safe_name
        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "7860"))
    app.run(debug=False, host="127.0.0.1", port=port)
