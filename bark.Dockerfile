# One image, three processes (barkd, node API, nginx) supervised individually by
# StartOS. The bark-web frontend and its API proxy are built from the upstream
# git tag; barkd and rclone are fetched as release binaries with pinned checksums.

ARG BARK_WEB_VERSION=0.9.0
ARG BARK_VERSION=0.7.1
ARG RCLONE_VERSION=1.75.1

# ---- Upstream source checkout ----
FROM docker.io/debian:bookworm-slim AS source
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/*
ARG BARK_WEB_VERSION
RUN git clone --depth 1 --branch v${BARK_WEB_VERSION} \
      https://gitlab.com/ark-bitcoin/bark-web.git /src

# ---- SPA build ----
FROM docker.io/node:22-alpine AS spa-builder
WORKDIR /app
COPY --from=source /src ./
RUN npm ci && npm run build

# ---- API build ----
FROM docker.io/node:22-alpine AS api-builder
WORKDIR /app/api
COPY --from=source /src/api ./
RUN npm ci && npm run build

# ---- API runtime deps (prod only) ----
FROM docker.io/node:22-alpine AS api-prod-deps
WORKDIR /app/api
COPY --from=source /src/api ./
RUN npm ci --omit=dev

# ---- barkd binary fetch ----
FROM docker.io/debian:bookworm-slim AS barkd-fetch
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
ARG BARK_VERSION
ARG TARGETARCH
ARG BARKD_SHA256_AMD64=8067b9aab31e250e5580620e3fd0be61f5b778860346d2433b11eae9992db85a
ARG BARKD_SHA256_ARM64=b9604e1dc4ec409d49ac842aa39dd77e0177f7b3c409a63f255f5b36d2941dd7
WORKDIR /out
RUN case "${TARGETARCH}" in \
      amd64) ARCH="x86_64"; SHA="${BARKD_SHA256_AMD64}" ;; \
      arm64) ARCH="arm64";  SHA="${BARKD_SHA256_ARM64}" ;; \
      *)     echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
    esac && \
    curl -fsSL --retry 5 --retry-all-errors --retry-delay 3 \
      "https://gitlab.com/ark-bitcoin/bark/-/releases/bark-${BARK_VERSION}/downloads/barkd-${BARK_VERSION}-linux-${ARCH}" -o barkd && \
    echo "${SHA}  barkd" | sha256sum -c - && \
    chmod +x barkd

# ---- rclone binary fetch ----
FROM docker.io/debian:bookworm-slim AS rclone-fetch
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
ARG RCLONE_VERSION
ARG TARGETARCH
ARG RCLONE_SHA256_AMD64=09c9f7606ed9e31eecc1eec26a89992cf2931a8d2d1a5f0ae2bb1c11630ffb15
ARG RCLONE_SHA256_ARM64=773f3a76615f91f7d4654183a537afddce3343c8d99ac1d74984f060f2ade2d9
WORKDIR /out
RUN case "${TARGETARCH}" in \
      amd64) SHA="${RCLONE_SHA256_AMD64}" ;; \
      arm64) SHA="${RCLONE_SHA256_ARM64}" ;; \
      *)     echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
    esac && \
    curl -fsSL --retry 5 --retry-all-errors --retry-delay 3 \
      "https://downloads.rclone.org/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-linux-${TARGETARCH}.deb" -o rclone.deb && \
    echo "${SHA}  rclone.deb" | sha256sum -c - && \
    dpkg-deb -x rclone.deb extract && \
    install -m 0755 extract/usr/bin/rclone rclone

# ---- Final runtime ----
FROM docker.io/debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl nginx \
      sqlite3 inotify-tools jq openssl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/web /app/api /data

COPY --from=spa-builder /app/dist /app/web
COPY --from=api-prod-deps /app/api/node_modules /app/api/node_modules
COPY --from=api-prod-deps /app/api/package.json /app/api/package.json
COPY --from=api-builder /app/api/dist /app/api/dist
COPY --from=barkd-fetch /out/barkd /usr/local/bin/barkd
COPY --from=rclone-fetch /out/rclone /usr/local/bin/rclone

# Continuous external backup agent (see startos/main.ts, backup-agent.sh).
COPY backup-agent.sh /usr/local/bin/backup-agent.sh
RUN chmod +x /usr/local/bin/backup-agent.sh

COPY nginx.conf /etc/nginx/sites-available/bark
RUN rm -f /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/bark /etc/nginx/sites-enabled/bark \
    && mkdir -p /var/lib/nginx /var/log/nginx /run/nginx

ENV UI_AUTH=true

EXPOSE 8080
