# Multi-stage Dockerfile for React Template
# Stages: dev, build, prod

# ============================================================================
# Stage: base - Common dependencies
# ============================================================================
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ============================================================================
# Stage: dev - Development server with hot reload
# ============================================================================
FROM base AS dev
# Use existing node user (UID 1000, GID 1000)
RUN npm ci
COPY . .
# Set ownership for node user
RUN chown -R node:node /app
USER node
EXPOSE 5173
ENV NODE_ENV=development
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ============================================================================
# Stage: build - Build production assets
# ============================================================================
FROM base AS build
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ============================================================================
# Stage: prod - Production nginx server
# ============================================================================
FROM nginx:alpine AS prod

# Create non-root user
RUN addgroup -g 1000 app && adduser -u 1000 -G app -s /bin/sh -D app

# Copy custom main nginx config (for non-root pid file location)
COPY docker/nginx-main.conf /etc/nginx/nginx.conf

# Copy server config as template (for envsubst processing)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy entrypoint script
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set permissions for non-root user
RUN chown -R app:app /usr/share/nginx/html && \
    chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    touch /tmp/nginx.pid && \
    chown app:app /tmp/nginx.pid && \
    # Allow nginx to write to conf.d
    chown -R app:app /etc/nginx/conf.d

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

USER app

ENTRYPOINT ["/docker-entrypoint.sh"]
