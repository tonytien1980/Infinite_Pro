FROM python:3.12-slim-bookworm@sha256:392307d22300de8b5986851a12d9176dfc0fc073e65bf6523ebd7dcbeb23564e

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MATERIAL_OCR_ENABLED=true \
    OMP_THREAD_LIMIT=1

RUN apt-get update
RUN apt-get install -y --no-install-recommends \
    poppler-utils=22.12.0-2+deb12u3 \
    tesseract-ocr=5.3.0-2 \
    tesseract-ocr-chi-tra=1:4.1.0-2 \
    tesseract-ocr-eng=1:4.1.0-2
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY requirements.txt constraints.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY app /app/backend/app
