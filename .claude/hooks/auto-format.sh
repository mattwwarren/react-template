#!/bin/bash
# PostToolUse hook: Auto-format TypeScript/JavaScript files after Edit/Write
#
# This hook runs automatically after Edit or Write tool usage.
# It receives JSON input via stdin containing tool execution details.
# Uses Biome for fast (~100x faster than ESLint+Prettier) lint + format.

# Read JSON input from stdin and extract file path
FILE_PATH=$(jq -r '.tool_input.file_path' <&0)

# Only process TypeScript, JavaScript, and JSON files
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]] || \
   [[ "$FILE_PATH" == *.js ]] || [[ "$FILE_PATH" == *.jsx ]] || \
   [[ "$FILE_PATH" == *.json ]]; then

    # Change to project directory
    cd "$CLAUDE_PROJECT_DIR" || exit 1

    # Run Biome check with auto-fix and format in one pass
    if npx biome check --write "$FILE_PATH" 2>&1; then
        echo "Biome: formatted $FILE_PATH" >&2
    else
        echo "Biome: some violations remain in $FILE_PATH" >&2
    fi

    # Exit 0 (non-blocking) even if Biome found unfixable violations
    # This allows Claude to continue working and address issues iteratively
    exit 0
else
    # Not a supported file, skip formatting
    exit 0
fi
