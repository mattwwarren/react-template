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
echo -e "${GREEN}[1/7] Copying project (excluding dev artifacts)...${NC}"

EXCLUDE_PATTERNS=(
    ".git"
    "node_modules"
    "dist"
    ".templatized"
    "playwright-report"
    "test-results"
    "coverage"
    "package-lock.json"
    ".env.*.local"
    ".DS_Store"
    ".devspace"
    "*.log"
    # Template infrastructure files (not for generated projects)
    ".github/workflows/publish-template.yml"
    ".github/workflows/validate-template.yml"
    "scripts/templatize.sh"
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
DEFAULT_PORT='5173'
PORT_TEMPLATE='{{ port }}'

# Fail loudly if an expected substitution didn't land (the source file drifted
# away from the literal the sed targets, so the copier answer would silently
# stop reaching generated output).
assert_templated() {
    local file="$1" expected="$2"
    if ! grep -qF "${expected}" "${file}"; then
        echo -e "${RED}ERROR: expected '${expected}' in ${file} after templating (source drifted?)${NC}"
        exit 1
    fi
}

# Step 2: Replace references in config files that become .jinja templates
echo -e "${GREEN}[2/7] Templating config files (.jinja)...${NC}"

# Files to convert to .jinja templates
JINJA_TEMPLATE_FILES=(
    "package.json"
    "devspace.yaml"
    "docker/Dockerfile"
    "index.html"
    ".copier-config.json"
    "playwright.config.ts"
    "playwright.integration.config.ts"
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
        if grep -q "A React frontend application" "${OUTPUT_DIR}/${file}" 2>/dev/null; then
            sed -i 's#"description": "A React frontend application"#"description": {{ description | tojson }}#g' "${OUTPUT_DIR}/${file}"
        fi
        if [[ "${file}" == "devspace.yaml" ]]; then
            # Wire k8s dev-container env defaults to the same copier answers as
            # .env.development (ticket #14). Only the VITE_USE_MOCKS literal and
            # the API_URL var default are templated; `value: ${API_URL}` is
            # DevSpace runtime interpolation and API_URL keeps `source: env`,
            # so an invocation-time env var still overrides the rendered default.
            sed -i "s|value: \"false\"|value: \"{{ 'true' if use_mocks else 'false' }}\"|" "${OUTPUT_DIR}/${file}"
            sed -i "s|default: \"http://fastapi-template.warren-enterprises-ltd.svc.cluster.local\"|default: \"{{ api_url }}\"|" "${OUTPUT_DIR}/${file}"
            assert_templated "${OUTPUT_DIR}/${file}" "value: \"{{ 'true' if use_mocks else 'false' }}\""
            assert_templated "${OUTPUT_DIR}/${file}" "default: \"{{ api_url }}\""
        fi
        if [[ "${file}" == "package.json" ]]; then
            assert_templated "${OUTPUT_DIR}/${file}" "\"description\": {{ description | tojson }}"
        fi
        # Rename to .jinja
        mv "${OUTPUT_DIR}/${file}" "${OUTPUT_DIR}/${file}.jinja"
        echo "  Templated: ${file} -> ${file}.jinja"
    fi
done

# Step 3: Wire non-identity copier answers into env files and vite config
echo -e "${GREEN}[3/7] Wiring copier answers into env and vite config (.jinja)...${NC}"

# .env.example MUST stay in lockstep with .env.development: _tasks.py copies it
# to .env.development.local, which Vite loads with higher precedence, so an
# unwired .env.example would silently override the wired .env.development.
ENV_TEMPLATE_FILES=(
    ".env.development"
    ".env.example"
)

for file in "${ENV_TEMPLATE_FILES[@]}"; do
    target="${OUTPUT_DIR}/${file}"
    if [[ -f "${target}" ]]; then
        sed -i \
            -e "s|^VITE_API_URL=.*|VITE_API_URL={{ api_url }}|" \
            -e "s|^VITE_WS_URL=.*|VITE_WS_URL={{ api_url }}|" \
            -e "s|^VITE_USE_MOCKS=.*|VITE_USE_MOCKS={{ 'true' if use_mocks else 'false' }}|" \
            -e "s|^VITE_AUTH_PROVIDER=.*|VITE_AUTH_PROVIDER={{ auth_provider if auth_enabled and auth_provider != 'none' else 'mock' }}|" \
            "${target}"
        assert_templated "${target}" "VITE_API_URL={{ api_url }}"
        assert_templated "${target}" "VITE_WS_URL={{ api_url }}"
        assert_templated "${target}" "VITE_USE_MOCKS={{ 'true' if use_mocks else 'false' }}"
        assert_templated "${target}" "VITE_AUTH_PROVIDER={{ auth_provider if auth_enabled and auth_provider != 'none' else 'mock' }}"
        mv "${target}" "${target}.jinja"
        echo "  Templated: ${file} -> ${file}.jinja"
    fi
done

# vite.config.ts: dev-server port only. The /api proxy target deliberately stays
# on raw process.env (see ARCHITECTURE.md Known gap).
if [[ -f "${OUTPUT_DIR}/vite.config.ts" ]]; then
    sed -i "s|port: ${DEFAULT_PORT},|port: ${PORT_TEMPLATE},|" "${OUTPUT_DIR}/vite.config.ts"
    assert_templated "${OUTPUT_DIR}/vite.config.ts" "port: ${PORT_TEMPLATE},"
    mv "${OUTPUT_DIR}/vite.config.ts" "${OUTPUT_DIR}/vite.config.ts.jinja"
    echo "  Templated: vite.config.ts -> vite.config.ts.jinja"
fi

# Step 4: Replace references in TSX files with placeholders
echo -e "${GREEN}[4/7] Adding placeholders to TSX files...${NC}"

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

# Step 5: Update markdown documentation and other files
echo -e "${GREEN}[5/7] Templating markdown and config files (.jinja)...${NC}"

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
echo "  Updated ${MD_COUNT} markdown files at root"

# .claude/ directory - agent definitions, skills, shared configs
if [[ -d "${OUTPUT_DIR}/.claude" ]]; then
    CLAUDE_COUNT=0
    while IFS= read -r -d '' file; do
        if grep -qE "react-template|React Template" "$file" 2>/dev/null; then
            sed -i "s/react-template/${SED_SLUG}/g" "$file"
            sed -i "s/React Template/${SED_NAME}/g" "$file"
            ((CLAUDE_COUNT++)) || true
        fi
    done < <(find "${OUTPUT_DIR}/.claude" -type f \( -name "*.md" -o -name "*.yaml" -o -name "*.yml" \) -print0 2>/dev/null)
    echo "  Updated ${CLAUDE_COUNT} files in .claude/"
fi

# deployment/ directory - Kubernetes manifests
if [[ -d "${OUTPUT_DIR}/deployment" ]]; then
    DEPLOY_COUNT=0
    while IFS= read -r -d '' file; do
        if grep -qE "react-template|react_template" "$file" 2>/dev/null; then
            sed -i "s/react-template/${SED_SLUG}/g" "$file"
            sed -i "s/react_template/${SED_SLUG_UNDERSCORE}/g" "$file"
            # Rename so copier renders it (_templates_suffix: ".jinja");
            # otherwise the Jinja above ships verbatim.
            mv "$file" "${file}.jinja"
            ((DEPLOY_COUNT++)) || true
        fi
    done < <(find "${OUTPUT_DIR}/deployment" -type f \( -name "*.yaml" -o -name "*.yml" \) -print0 2>/dev/null)
    echo "  Templated ${DEPLOY_COUNT} files in deployment/ (.jinja)"
fi

# tests/ directory - test files that reference project name.
# Only .ts/.js: these get real Jinja + a .jinja rename. .tsx is excluded because
# JSX {{ }} object literals would collide with Jinja rendering.
if [[ -d "${OUTPUT_DIR}/tests" ]]; then
    TEST_COUNT=0
    while IFS= read -r -d '' file; do
        if grep -qE "react-template|React Template" "$file" 2>/dev/null; then
            sed -i "s/react-template/${SED_SLUG}/g" "$file"
            sed -i "s/React Template/${SED_NAME}/g" "$file"
            mv "$file" "${file}.jinja"
            ((TEST_COUNT++)) || true
        fi
    done < <(find "${OUTPUT_DIR}/tests" -type f \( -name "*.ts" -o -name "*.js" \) -print0 2>/dev/null)
    echo "  Templated ${TEST_COUNT} test files (.jinja)"
fi

# Step 6: Verify output
echo -e "${GREEN}[6/7] Verifying output...${NC}"

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

# Step 7: Verify no remaining hardcoded references
echo -e "${GREEN}[7/7] Checking for remaining react-template references...${NC}"

# Search for remaining references in non-.jinja files (excluding expected placeholders)
REMAINING_REFS=$(find "${OUTPUT_DIR}" -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" \
       -o -name "*.md" -o -name "*.html" -o -name "*.css" \) \
    -not -name "*.jinja" \
    -not -path "*/.git/*" \
    -not -path "*/node_modules/*" \
    -exec grep -l -E "react-template|react_template|React Template" {} \; 2>/dev/null || true)

if [[ -n "${REMAINING_REFS}" ]]; then
    echo -e "${RED}ERROR: Found remaining template references in:${NC}"
    echo "${REMAINING_REFS}" | while read -r file; do
        echo "  - ${file}"
        # Show the lines with references
        grep -n -E "react-template|react_template|React Template" "$file" 2>/dev/null | head -3 | sed 's/^/      /'
    done
    echo ""
    echo -e "${YELLOW}These files may need to be added to templatize.sh${NC}"
    exit 1
else
    echo "  No remaining hardcoded references found"
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
