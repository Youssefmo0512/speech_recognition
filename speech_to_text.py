import os
from functools import lru_cache

import arabic_reshaper
from bidi.algorithm import get_display
from faster_whisper import WhisperModel


def format_arabic(text):
    """Reshapes and fixes Arabic text orientation for terminal display."""
    if not text:
        return ""
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


@lru_cache(maxsize=3)
def get_model(model_size="base"):
    """Loads and caches Whisper models so repeated web requests are faster."""
    return WhisperModel(model_size, device="auto", compute_type="int8")


def transcribe_audio_details(file_path, model_size="base", language=None):
    """Transcribes audio and returns structured data for CLI and web usage."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file was not found: {file_path}")

    model = get_model(model_size)
    transcription_options = {"beam_size": 5}
    if language:
        transcription_options["language"] = language

    raw_segments, info = model.transcribe(file_path, **transcription_options)

    segments = []
    for segment in raw_segments:
        text = segment.text.strip()
        if text:
            segments.append(
                {
                    "start": round(segment.start, 2),
                    "end": round(segment.end, 2),
                    "text": text,
                }
            )

    full_text = " ".join(segment["text"] for segment in segments)
    return {
        "text": full_text,
        "segments": segments,
        "language": info.language,
        "language_probability": round(info.language_probability, 4),
        "duration": getattr(info, "duration", None),
        "model_size": model_size,
    }


def transcribe_audio(file_path, model_size="base"):
    """Transcribes audio file with optimized settings and prints CLI output."""
    try:
        print(format_arabic(f"Processing: {file_path} ..."))
        result = transcribe_audio_details(file_path, model_size=model_size)
    except FileNotFoundError:
        print(format_arabic(f"Audio file was not found: {file_path}"))
        return ""

    print(format_arabic(f"Detected language: {result['language']} ({result['language_probability']:.2f})"))
    print("-" * 30)

    for segment in result["segments"]:
        print(f"[{segment['start']:.2f}s -> {segment['end']:.2f}s] {format_arabic(segment['text'])}")

    with open("output.txt", "w", encoding="utf-8") as output_file:
        output_file.write(result["text"])

    return result["text"]


if __name__ == "__main__":
    audio_files = ["audio.wav", "long_voice_test.wav", "noisy_audio.wav", "arabic_test.wav"]

    for audio in audio_files:
        if os.path.exists(audio):
            transcribe_audio(audio)
        elif audio == "audio.wav":
            print(format_arabic("audio.wav was not found. Run generate_sample_audio.py first."))
