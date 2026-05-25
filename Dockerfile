FROM python:3.10-slim

WORKDIR /app

# Install ffmpeg which is required for audio processing
RUN apt-get update && apt-get install -y ffmpeg libsndfile1 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create uploads directory with correct permissions
RUN mkdir -p uploads && chmod 777 uploads

# Expose port 7860 (Hugging Face Spaces default)
ENV PORT=7860
EXPOSE 7860

CMD ["gunicorn", "-b", "0.0.0.0:7860", "--timeout", "300", "app:app"]
