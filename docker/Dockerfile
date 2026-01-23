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
RUN npm ci
COPY . .
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

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Set ownership
RUN chown -R app:app /usr/share/nginx/html && \
    chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R app:app /var/run/nginx.pid

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/health || exit 1

EXPOSE 80

# Run as non-root (nginx needs to start as root briefly, then drops privileges)
CMD ["nginx", "-g", "daemon off;"]
