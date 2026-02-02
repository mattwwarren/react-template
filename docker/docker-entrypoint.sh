#!/bin/sh
set -e

# Substitute environment variables in nginx config
envsubst '${API_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx (pid file configured in nginx-main.conf)
exec nginx -g 'daemon off;'
