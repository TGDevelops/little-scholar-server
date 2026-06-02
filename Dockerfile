FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG TARGETARCH
ARG CLOUD_SQL_PROXY_VERSION=2.22.0
RUN apk add --no-cache ca-certificates curl openssl \
  && case "$TARGETARCH" in \
    amd64) CLOUD_SQL_PROXY_ARCH=amd64 ;; \
    arm64) CLOUD_SQL_PROXY_ARCH=arm64 ;; \
    *) echo "Unsupported architecture: $TARGETARCH" && exit 1 ;; \
  esac \
  && curl -fsSL -o /usr/local/bin/cloud-sql-proxy \
    "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v${CLOUD_SQL_PROXY_VERSION}/cloud-sql-proxy.linux.${CLOUD_SQL_PROXY_ARCH}" \
  && chmod +x /usr/local/bin/cloud-sql-proxy
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY openapi.yaml ./openapi.yaml
COPY scripts/cloud-sql-entrypoint.sh ./scripts/cloud-sql-entrypoint.sh
RUN chmod +x ./scripts/cloud-sql-entrypoint.sh
EXPOSE 3000
CMD ["./scripts/cloud-sql-entrypoint.sh"]
