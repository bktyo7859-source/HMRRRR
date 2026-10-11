FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies, GCC, Make, Python, Node.js
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    make \
    python3 \
    python3-pip \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project files
COPY . /app

# Install Python requirements
RUN python3 -m pip install --no-cache-dir fastapi uvicorn websockets pydantic

# Build C++ IPC Engine
RUN cd cpp && make clean && make -j4

# Install frontend dependencies and build Next.js
RUN cd frontend && npm install && npm run build

EXPOSE 8000 3000

CMD ["/bin/bash", "./scripts/run.sh"]
