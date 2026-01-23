#!/bin/bash
# Generate TypeScript types from shared OpenAPI spec
# Spec is exported by fastapi-template to ../specs/openapi.json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SPECS_DIR="${PROJECT_DIR}/../specs"
OUTPUT_DIR="${PROJECT_DIR}/src/api/generated"

OPENAPI_FILE="${SPECS_DIR}/openapi.json"

if [ ! -f "$OPENAPI_FILE" ]; then
    echo "Error: OpenAPI spec not found at $OPENAPI_FILE"
    echo "Run 'cd ../fastapi-template && ./scripts/export-openapi.sh' first"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Generating TypeScript types from $OPENAPI_FILE..."
npx openapi-typescript "$OPENAPI_FILE" -o "${OUTPUT_DIR}/types.ts"

echo "Types generated at ${OUTPUT_DIR}/types.ts"
