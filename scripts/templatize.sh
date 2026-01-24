#!/usr/bin/env bash
# templatize.sh - Convert runnable react-template to copier template
#
# This script transforms the working React project into a Copier template.
#
# Usage:
#   ./scripts/templatize.sh [output_dir]
#
# Arguments:
#   output_dir - Target directory for templatized output (default: .templatized)
#
# Strategy:
# - Use .jinja suffix for files that need Jinja2 templating (config files, markdown)
# - Use __PLACEHOLDER__ syntax for TSX files (Jinja2 conflicts with JSX syntax)
# - _tasks.py replaces placeholders after copy

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory (resolve symlinks)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Default output directory
OUTPUT_DIR="${1:-.templatized}"

# Convert to absolute path if relative
if [[ ! "${OUTPUT_DIR}" = /* ]]; then
    OUTPUT_DIR="${PROJECT_ROOT}/${OUTPUT_DIR}"
fi

echo -e "${GREEN}=== React Template - Templatization Script ===${NC}"
echo "Source: ${PROJECT_ROOT}"
echo "Output: ${OUTPUT_DIR}"
echo ""

# Clean output directory if it exists
if [[ -d "${OUTPUT_DIR}" ]]; then
    echo -e "${YELLOW}Removing existing output directory...${NC}"
    rm -rf "${OUTPUT_DIR}"
fi

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Step 1: Copy project excluding dev artifacts
echo -e "${GREEN}[1/5] Copying project (excluding dev artifacts)...${NC}"

EXCLUDE_PATTERNS=(
    ".git"
    "node_modules"
    "dist"
    ".templatized"
    "playwright-report"
    "test-results"
    "package-lock.json"
    ".env.*.local"
    ".DS_Store"
    ".devspace"
    "*.log"
)

# Build rsync exclude arguments
RSYNC_EXCLUDES=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    RSYNC_EXCLUDES+=("--exclude=${pattern}")
done

# Copy using rsync (preserves symlinks, permissions)
rsync -a "${RSYNC_EXCLUDES[@]}" "${PROJECT_ROOT}/" "${OUTPUT_DIR}/"

echo "  Copied $(find "${OUTPUT_DIR}" -type f | wc -l) files"

# Placeholder syntax for TSX files (avoids Jinja2 conflict with JSX)
PLACEHOLDER_NAME="__PROJECT_NAME__"
PLACEHOLDER_SLUG="__PROJECT_SLUG__"
PLACEHOLDER_SLUG_UNDERSCORE="__PROJECT_SLUG_UNDERSCORE__"

# Jinja2 syntax with hex codes to avoid brace interpretation in sed
SED_SLUG='\x7B\x7B project_slug \x7D\x7D'
SED_NAME='\x7B\x7B project_name \x7D\x7D'
SED_SLUG_UNDERSCORE='\x7B\x7B project_slug_underscore \x7D\x7D'

# Step 2: Replace references in config files that become .jinja templates
echo -e "${GREEN}[2/5] Templating config files (.jinja)...${NC}"

# Files to convert to .jinja templates
JINJA_TEMPLATE_FILES=(
    "package.json"
    "devspace.yaml"
    "index.html"
    ".copier-config.json"
)

for file in "${JINJA_TEMPLATE_FILES[@]}"; do
    if [[ -f "${OUTPUT_DIR}/${file}" ]]; then
        # Replace hardcoded values with Jinja2 variables
        if grep -q "react-template" "${OUTPUT_DIR}/${file}" 2>/dev/null; then
            sed -i "s/react-template/${SED_SLUG}/g" "${OUTPUT_DIR}/${file}"
        fi
        if grep -q "react_template" "${OUTPUT_DIR}/${file}" 2>/dev/null; then
            sed -i "s/react_template/${SED_SLUG_UNDERSCORE}/g" "${OUTPUT_DIR}/${file}"
        fi
        if grep -q "React Template" "${OUTPUT_DIR}/${file}" 2>/dev/null; then
            sed -i "s/React Template/${SED_NAME}/g" "${OUTPUT_DIR}/${file}"
        fi
        # Rename to .jinja
        mv "${OUTPUT_DIR}/${file}" "${OUTPUT_DIR}/${file}.jinja"
        echo "  Templated: ${file} -> ${file}.jinja"
    fi
done

# Step 3: Replace references in TSX files with placeholders
echo -e "${GREEN}[3/5] Adding placeholders to TSX files...${NC}"

UI_FILES=(
    "src/components/layout/Header.tsx"
    "src/components/layout/Sidebar.tsx"
    "src/components/layout/MobileSidebar.tsx"
)

for file in "${UI_FILES[@]}"; do
    if [[ -f "${OUTPUT_DIR}/${file}" ]]; then
        if grep -q "React Template" "${OUTPUT_DIR}/${file}" 2>/dev/null; then
            sed -i "s/React Template/${PLACEHOLDER_NAME}/g" "${OUTPUT_DIR}/${file}"
            echo "  Updated: ${file} (placeholder)"
        fi
    fi
done

# Step 4: Update markdown documentation
echo -e "${GREEN}[4/5] Templating markdown files (.jinja)...${NC}"

MD_COUNT=0
for mdfile in "${OUTPUT_DIR}"/*.md; do
    if [[ -f "$mdfile" ]]; then
        # Check for any Jinja2 or project references
        if grep -qE "react-template|React Template|\{\{|\{%" "$mdfile" 2>/dev/null; then
            sed -i "s/react-template/${SED_SLUG}/g" "$mdfile"
            sed -i "s/React Template/${SED_NAME}/g" "$mdfile"
            mv "$mdfile" "${mdfile}.jinja"
            ((MD_COUNT++)) || true
            echo "  Templated: $(basename "$mdfile") -> $(basename "$mdfile").jinja"
        fi
    fi
done
echo "  Updated ${MD_COUNT} markdown files"

# Step 5: Verify output
echo -e "${GREEN}[5/5] Verifying output...${NC}"

# Check .jinja files exist
JINJA_COUNT=$(find "${OUTPUT_DIR}" -name "*.jinja" | wc -l)
echo "  Created ${JINJA_COUNT} .jinja template files"

# Check placeholders in TSX files
PLACEHOLDER_COUNT=$(grep -r "${PLACEHOLDER_NAME}" "${OUTPUT_DIR}/src" 2>/dev/null | wc -l || echo 0)
echo "  Added ${PLACEHOLDER_COUNT} placeholder references in TSX files"

# Verify copier.yaml preserved
if [[ -f "${OUTPUT_DIR}/copier.yaml" ]]; then
    echo "  Preserved: copier.yaml"
else
    echo -e "${RED}  ERROR: copier.yaml not found${NC}"
fi

# Verify _tasks.py preserved
if [[ -f "${OUTPUT_DIR}/_tasks.py" ]]; then
    echo "  Preserved: _tasks.py"
else
    echo -e "${RED}  ERROR: _tasks.py not found${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=== Templatization Complete ===${NC}"
echo ""
echo "Output directory: ${OUTPUT_DIR}"
echo ""
echo "Directory structure:"
ls -la "${OUTPUT_DIR}/" | head -20

echo ""
echo "To test the template:"
echo "  copier copy ${OUTPUT_DIR} /tmp/test-react-project \\"
echo "    --data project_name=\"My Dashboard\" \\"
echo "    --data project_slug=\"my-dashboard\" \\"
echo "    --defaults --trust"
echo ""
echo "To verify the generated project:"
echo "  cd /tmp/test-react-project"
echo "  npm install"
echo "  npm run lint"
echo "  npm run build"
echo "  npm test"
