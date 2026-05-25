# Sada Speech-to-Text

Creative Arabic-first speech-to-text web UI powered locally by Faster-Whisper.

## GitHub Pages

The project now has a root `index.html`, so GitHub Pages can open the interface directly.

1. Upload the repository to GitHub.
2. Go to `Settings > Pages`.
3. Choose `Deploy from a branch`.
4. Select `main` and `/root`.
5. Open the generated GitHub Pages URL.

Important: GitHub Pages is static hosting only. It can show the UI, but it cannot run Python, Flask, or Faster-Whisper. For real transcription online, deploy the Python backend on a service such as Render, Railway, or Hugging Face Spaces, then point the frontend to that backend.

## Local Full App

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the Python backend and web UI:

```bash
python app.py
```

Open:

```text
http://127.0.0.1:7860
```

## Files

- `index.html`: Static UI entry point for GitHub Pages.
- `static/css/styles.css`: UI styling.
- `static/js/app.js`: Upload, record, copy, download, and API logic.
- `app.py`: Flask backend.
- `speech_to_text.py`: Faster-Whisper transcription engine.
- `requirements.txt`: Python dependencies.
