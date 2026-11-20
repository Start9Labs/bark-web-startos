# One image, three processes (barkd, node API, nginx) supervised individually by
# StartOS. The bark-web frontend and its API proxy are built from the upstream
# git tag; barkd and rclone are fetched as release binaries with pinned checksums.

ARG BARK_WEB_VERSION=0.12.0
ARG BARK_WEB_COMMIT=3207f6cd38d8dfca5ddeb1a3bec50043f12a3b74
ARG BARK_VERSION=0.9.0
ARG RCLONE_VERSION=1.76.0

# ---- Upstream source checkout ----
FROM docker.io/debian:bookworm-slim AS source
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/*
ARG BARK_WEB_VERSION
ARG BARK_WEB_COMMIT
# A tag can be moved; the build fails unless it still names the reviewed commit.
RUN git clone --depth 1 --branch v${BARK_WEB_VERSION} \
      https://gitlab.com/ark-bitcoin/bark-web.git /src \
    && test "$(git -C /src rev-parse HEAD)" = "${BARK_WEB_COMMIT}"

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
ARG BARKD_SHA256_AMD64=840d559de5a6b744bac0fedeea66e32d985e01c62763393f1e896e0c53dc1eb4
ARG BARKD_SHA256_ARM64=7dd4b94db8512cf021060c14828d916547326f93a625e78bfeb870ad3eadd344
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
ARG RCLONE_SHA256_AMD64=9db7ee9b725bce7cdd195b9183449a4c6fb93cad3e6578e70b87c0bc7f6062e9
ARG RCLONE_SHA256_ARM64=c486d404ecbc4bb3d54052a0efaf9e652cf0d2c645e4523f7a2aefa112fe029c
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

# ---- Node runtime (glibc build, for the Debian final image) ----
FROM docker.io/node:22-bookworm-slim AS node-runtime

# ---- Final runtime ----
FROM docker.io/debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates nginx \
      sqlite3 inotify-tools jq openssl openssh-client util-linux \
    && rm -rf /var/lib/apt/lists/*

COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node

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
