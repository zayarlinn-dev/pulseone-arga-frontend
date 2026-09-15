# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

# Vite inlines every VITE_* value at build time, so these are build args, not
# runtime environment. VITE_API_URL defaults to a RELATIVE path: nginx proxies
# /api to the backend on the same origin, which is what lets one image serve
# any droplet IP without a rebuild. Only override it to point the browser at a
# backend on a different host.
ARG VITE_API_URL=/api/v1
ARG VITE_APP_NAME="PulseOne Hospital Management"
ARG VITE_APP_ADDRESS=""
ARG VITE_APP_PHONE=""

ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_ADDRESS=$VITE_APP_ADDRESS \
    VITE_APP_PHONE=$VITE_APP_PHONE

RUN npm run build

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine

# The upstream is templated so the backend host can move without a rebuild.
# nginx's entrypoint renders /etc/nginx/templates/*.template into conf.d.
# DNS_RESOLVER is Docker's embedded resolver. It is templated rather than
# hardcoded so the image also runs outside a compose network, where the
# resolver differs.
ENV BACKEND_HOST=backend \
    BACKEND_PORT=8080 \
    DNS_RESOLVER=127.0.0.11 \
    TZ=Asia/Yangon

RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/nginx-health >/dev/null 2>&1 || exit 1
