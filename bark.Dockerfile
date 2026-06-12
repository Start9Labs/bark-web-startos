# One image, three processes (barkd, node API, nginx) supervised individually by
# StartOS. The bark-web frontend and its API proxy are built from the upstream
# git tag; barkd is fetched as a release binary with a pinned checksum.

ARG BARK_WEB_VERSION=0.2.5
ARG BARK_VERSION=0.2.5

# ---- Upstream source checkout ----
FROM docker.io/debian:bookworm-slim AS source
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/*
ARG BARK_WEB_VERSION
RUN git clone --depth 1 --branch v${BARK_WEB_VERSION} \
      https://gitlab.com/ark-bitcoin/labs/bark-web.git /src

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
ARG BARKD_SHA256_AMD64=e9a3464cbd91b8b4fb42ee36aafed70f59fbb143189f0c368c3efa4f06d4490e
ARG BARKD_SHA256_ARM64=778e6aa353fc9a32b51e4ac36c03d945c7288942294f04a918199015517b9255
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

# ---- Final runtime ----
FROM docker.io/debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl nginx \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/web /app/api /data

COPY --from=spa-builder /app/dist /app/web
COPY --from=api-prod-deps /app/api/node_modules /app/api/node_modules
COPY --from=api-prod-deps /app/api/package.json /app/api/package.json
COPY --from=api-builder /app/api/dist /app/api/dist
COPY --from=barkd-fetch /out/barkd /usr/local/bin/barkd

COPY nginx.conf /etc/nginx/sites-available/bark
RUN rm -f /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/bark /etc/nginx/sites-enabled/bark \
    && mkdir -p /var/lib/nginx /var/log/nginx /run/nginx

EXPOSE 8080
