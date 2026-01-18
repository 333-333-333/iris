#!/usr/bin/env bash
# Sync skill metadata to AGENTS.md Auto-invoke sections
# Usage: ./sync.sh [--dry-run] [--scope <scope>]
#
# This script is project-agnostic. It discovers scopes dynamically:
# - "root" scope maps to AGENTS.md in the repository root
# - Other scopes map to <scope>/AGENTS.md directories
#
# Skills define their scope in metadata.scope (e.g., scope: [root, ui, api])
#
# Compatible with bash 3.x (macOS default) and bash 4+

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
SKILLS_DIR="$REPO_ROOT/skills"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Options
DRY_RUN=false
FILTER_SCOPE=""

# Temp directory for scope data (bash 3.x compatible alternative to associative arrays)
TEMP_DIR=""

cleanup() {
	if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
		rm -rf "$TEMP_DIR"
	fi
}
trap cleanup EXIT

# Parse arguments
while [[ $# -gt 0 ]]; do
	case $1 in
	--dry-run)
		DRY_RUN=true
		shift
		;;
	--scope)
		FILTER_SCOPE="$2"
		shift 2
		;;
	--help | -h)
		echo "Usage: $0 [--dry-run] [--scope <scope>]"
		echo ""
		echo "Options:"
		echo "  --dry-run    Show what would change without modifying files"
		echo "  --scope      Only sync specific scope (root, or any directory with AGENTS.md)"
		echo ""
		echo "Scopes are discovered dynamically from skill metadata."
		echo "  - 'root' maps to ./AGENTS.md"
		echo "  - Other scopes map to ./<scope>/AGENTS.md"
		exit 0
		;;
	*)
		echo -e "${RED}Unknown option: $1${NC}"
		exit 1
		;;
	esac
done

# Map scope to AGENTS.md path (project-agnostic)
get_agents_path() {
	local scope="$1"
	if [ "$scope" = "root" ]; then
		echo "$REPO_ROOT/AGENTS.md"
	else
		# Check if directory exists with AGENTS.md
		if [ -f "$REPO_ROOT/$scope/AGENTS.md" ]; then
			echo "$REPO_ROOT/$scope/AGENTS.md"
		else
			echo ""
		fi
	fi
}

# Extract YAML frontmatter field using awk
extract_field() {
	local file="$1"
	local field="$2"
	awk -v field="$field" '
        /^---$/ { in_frontmatter = !in_frontmatter; next }
        in_frontmatter && $1 == field":" {
            # Handle single line value
            sub(/^[^:]+:[[:space:]]*/, "")
            if ($0 != "" && $0 != ">") {
                gsub(/^["'\'']|["'\'']$/, "")  # Remove quotes
                print
                exit
            }
            # Handle multi-line value
            getline
            while (/^[[:space:]]/ && !/^---$/) {
                sub(/^[[:space:]]+/, "")
                printf "%s ", $0
                if (!getline) break
            }
            print ""
            exit
        }
    ' "$file" | sed 's/[[:space:]]*$//'
}

# Extract nested metadata field
#
# Supports either:
#   auto_invoke: "Single Action"
# or:
#   auto_invoke:
#     - "Action A"
#     - "Action B"
#
# For list values, this returns a pipe-delimited string: "Action A|Action B"
extract_metadata() {
	local file="$1"
	local field="$2"

	awk -v field="$field" '
        function trim(s) {
            sub(/^[[:space:]]+/, "", s)
            sub(/[[:space:]]+$/, "", s)
            return s
        }

        /^---$/ { in_frontmatter = !in_frontmatter; next }

        in_frontmatter && /^metadata:/ { in_metadata = 1; next }
        in_frontmatter && in_metadata && /^[a-z]/ && !/^[[:space:]]/ { in_metadata = 0 }

        in_frontmatter && in_metadata && $1 == field":" {
            # Remove "field:" prefix
            sub(/^[^:]+:[[:space:]]*/, "")

            # Single-line scalar: auto_invoke: "Action"
            if ($0 != "") {
                v = $0
                gsub(/^["'\'']|["'\'']$/, "", v)
                gsub(/^\[|\]$/, "", v)  # legacy: allow inline [a, b]
                print trim(v)
                exit
            }

            # Multi-line list:
            # auto_invoke:
            #   - "Action A"
            #   - "Action B"
            out = ""
            while (getline) {
                # Stop when leaving metadata block
                if (!in_frontmatter) break
                if (!in_metadata) break
                if ($0 ~ /^[a-z]/ && $0 !~ /^[[:space:]]/) break

                # On multi-line list, only accept "- item" lines. Anything else ends the list.
                line = $0
                if (line ~ /^[[:space:]]*-[[:space:]]*/) {
                    sub(/^[[:space:]]*-[[:space:]]*/, "", line)
                    line = trim(line)
                    gsub(/^["'\'']|["'\'']$/, "", line)
                    if (line != "") {
                        if (out == "") out = line
                        else out = out "|" line
                    }
                } else {
                    break
                }
            }

            if (out != "") print out
            exit
        }
    ' "$file"
}

echo -e "${BLUE}Skill Sync - Updating AGENTS.md Auto-invoke sections${NC}"
echo "========================================================"
echo ""

# Create temp directory for scope data
TEMP_DIR=$(mktemp -d)
SCOPES_DIR="$TEMP_DIR/scopes"
mkdir -p "$SCOPES_DIR"

# Collect skills by scope (using files instead of associative arrays for bash 3.x compat)
while IFS= read -r skill_file; do
	[ -f "$skill_file" ] || continue

	skill_name=$(extract_field "$skill_file" "name")
	scope_raw=$(extract_metadata "$skill_file" "scope")

	auto_invoke_raw=$(extract_metadata "$skill_file" "auto_invoke")
	# Protect pipes in auto_invoke (we use | to separate entries)
	auto_invoke=${auto_invoke_raw//|/;;}

	# Skip if no scope or auto_invoke defined
	[ -z "$scope_raw" ] || [ -z "$auto_invoke" ] && continue

	# Parse scope (can be comma-separated or space-separated, remove brackets)
	scope_clean=$(echo "$scope_raw" | tr -d '[]')
	IFS=', ' read -ra scopes <<<"$scope_clean"

	for scope in "${scopes[@]}"; do
		scope=$(echo "$scope" | tr -d '[:space:]')
		[ -z "$scope" ] && continue

		# Filter by scope if specified
		[ -n "$FILTER_SCOPE" ] && [ "$scope" != "$FILTER_SCOPE" ] && continue

		# Append to scope's skill list (file-based storage)
		echo "$skill_name:$auto_invoke" >>"$SCOPES_DIR/$scope"
	done
done < <(find "$SKILLS_DIR" -mindepth 2 -maxdepth 2 -name SKILL.md -print 2>/dev/null | sort)

# Process each scope
for scope_file in "$SCOPES_DIR"/*; do
	[ -f "$scope_file" ] || continue

	scope=$(basename "$scope_file")
	agents_path=$(get_agents_path "$scope")

	if [ -z "$agents_path" ] || [ ! -f "$agents_path" ]; then
		echo -e "${YELLOW}Warning: No AGENTS.md found for scope '$scope'${NC}"
		continue
	fi

	# Determine display name for output
	if [ "$scope" = "root" ]; then
		display_name="AGENTS.md"
	else
		display_name="$scope/AGENTS.md"
	fi

	echo -e "${BLUE}Processing: $scope -> $display_name${NC}"

	# Build the Auto-invoke table
	auto_invoke_section="### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|"

	# Collect rows for sorting
	rows_file="$TEMP_DIR/rows_$scope"
	: >"$rows_file"

	while IFS= read -r entry; do
		skill_name="${entry%%:*}"
		actions_raw="${entry#*:}"

		# Restore pipes in actions
		actions_raw=${actions_raw//;;/|}

		# Split on pipe
		echo "$actions_raw" | tr '|' '\n' | while IFS= read -r action; do
			action=$(echo "$action" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
			[ -z "$action" ] && continue
			printf "%s\t%s\n" "$action" "$skill_name" >>"$rows_file"
		done
	done <"$scope_file"

	# Sort rows by action, then skill, and append to section
	while IFS=$'\t' read -r action skill_name; do
		[ -z "$action" ] && continue
		auto_invoke_section="$auto_invoke_section
| $action | \`$skill_name\` |"
	done < <(LC_ALL=C sort -t $'\t' -k1,1 -k2,2 "$rows_file")

	if $DRY_RUN; then
		echo -e "${YELLOW}[DRY RUN] Would update $agents_path with:${NC}"
		echo "$auto_invoke_section"
		echo ""
	else
		# Write new section to temp file
		section_file="$TEMP_DIR/section"
		echo "$auto_invoke_section" >"$section_file"

		# Check if Auto-invoke section exists
		if grep -q "### Auto-invoke Skills" "$agents_path"; then
			# Replace existing section (up to next --- or ## heading)
			awk -v section_file="$section_file" '
                /^### Auto-invoke Skills/ {
                    while ((getline line < section_file) > 0) print line
                    close(section_file)
                    skip = 1
                    next
                }
                skip && /^(---|## )/ {
                    skip = 0
                    print ""
                }
                !skip { print }
            ' "$agents_path" >"$agents_path.tmp"
			mv "$agents_path.tmp" "$agents_path"
			echo -e "${GREEN}  Updated Auto-invoke section${NC}"
		else
			# Insert after Skills Reference blockquote
			awk -v section_file="$section_file" '
                /^>.*SKILL\.md\)$/ && !inserted {
                    print
                    getline
                    if (/^$/) {
                        print ""
                        while ((getline line < section_file) > 0) print line
                        close(section_file)
                        print ""
                        inserted = 1
                        next
                    }
                }
                { print }
            ' "$agents_path" >"$agents_path.tmp"
			mv "$agents_path.tmp" "$agents_path"
			echo -e "${GREEN}  Inserted Auto-invoke section${NC}"
		fi
	fi
done

echo ""
echo -e "${GREEN}Done!${NC}"

# Show skills without metadata
echo ""
echo -e "${BLUE}Skills missing sync metadata:${NC}"
missing=0
while IFS= read -r skill_file; do
	[ -f "$skill_file" ] || continue
	skill_name=$(extract_field "$skill_file" "name")
	scope_raw=$(extract_metadata "$skill_file" "scope")
	auto_invoke_raw=$(extract_metadata "$skill_file" "auto_invoke")

	if [ -z "$scope_raw" ] || [ -z "$auto_invoke_raw" ]; then
		echo -e "  ${YELLOW}$skill_name${NC} - missing: ${scope_raw:+}${scope_raw:-scope} ${auto_invoke_raw:+}${auto_invoke_raw:-auto_invoke}"
		missing=$((missing + 1))
	fi
done < <(find "$SKILLS_DIR" -mindepth 2 -maxdepth 2 -name SKILL.md -print 2>/dev/null | sort)

if [ $missing -eq 0 ]; then
	echo -e "  ${GREEN}All skills have sync metadata${NC}"
fi
