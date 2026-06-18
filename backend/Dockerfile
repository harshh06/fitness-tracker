FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port (Cloud Run sets PORT env var automatically)
EXPOSE 8080

# Run uvicorn using shell format to resolve the PORT env var
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
