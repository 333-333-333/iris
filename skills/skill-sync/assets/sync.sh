#!/usr/bin/env bash
# Sync skill metadata to AGENTS.md sections (skill tables + auto-invoke)
# Usage: ./sync.sh [--dry-run] [--scope <scope>]
#
# This script is project-agnostic. It discovers scopes dynamically:
# - "root" scope maps to AGENTS.md in the repository root
# - Other scopes map to <scope>/AGENTS.md directories
#
# For root scope, updates 4 HTML-marker sections:
#   GENERIC-SKILLS, GENERIC-AUTO-INVOKE, PROJECT-SKILLS, PROJECT-AUTO-INVOKE
#
# For non-root scopes, updates a single "### Auto-invoke Skills" section.
#
# Skills define their type in metadata.type (generic | project | meta).
# Meta skills (skill-creator, skill-sync) are NOT synced — they are managed
# manually in the Meta-Skills section of AGENTS.md.
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
                gsub(/^["'\''"]|["'\''"]$/, "")  # Remove quotes
                print
                exit
            }
            # Handle multi-line value (>)
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

            # Single-line scalar
            if ($0 != "") {
                v = $0
                gsub(/^["'\''"]|["'\''"]$/, "", v)
                gsub(/^\[|\]$/, "", v)
                print trim(v)
                exit
            }

            # Multi-line list
            out = ""
            while (getline) {
                if (!in_frontmatter) break
                if (!in_metadata) break
                if ($0 ~ /^[a-z]/ && $0 !~ /^[[:space:]]/) break

                line = $0
                if (line ~ /^---$/) break
                if (line ~ /^[[:space:]]*-[[:space:]]+/) {
                    sub(/^[[:space:]]*-[[:space:]]*/, "", line)
                    line = trim(line)
                    gsub(/^["'\''"]|["'\''"]$/, "", line)
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

# Extract description (first sentence only, strip "Trigger:" suffix)
extract_description() {
	local file="$1"
	local desc
	desc=$(extract_field "$file" "description")
	# Take first sentence (up to "Trigger:" or end)
	desc=$(echo "$desc" | sed 's/[[:space:]]*Trigger:.*//')
	# Remove trailing period and whitespace
	desc=$(echo "$desc" | sed 's/\.[[:space:]]*$//')
	echo "$desc"
}

# Replace content between HTML markers in a file
# Usage: replace_marker_section <file> <marker_name> <new_content>
replace_marker_section() {
	local file="$1"
	local marker="$2"
	local content="$3"
	local start_marker="<!-- ${marker}:START - Do not remove. Auto-generated by skill-sync -->"
	local end_marker="<!-- ${marker}:END -->"

	# Write content to temp file (avoids awk -v multiline issues on macOS)
	local content_file="$TEMP_DIR/marker_content_$$"
	echo "$content" >"$content_file"

	awk -v start_marker="$start_marker" -v end_marker="$end_marker" -v content_file="$content_file" '
		$0 == start_marker {
			print
			while ((getline line < content_file) > 0) print line
			close(content_file)
			skip = 1
			next
		}
		$0 == end_marker {
			print
			skip = 0
			next
		}
		!skip { print }
	' "$file" >"$file.tmp"
	mv "$file.tmp" "$file"
}

echo -e "${BLUE}Skill Sync - Updating AGENTS.md sections${NC}"
echo "========================================================"
echo ""

# Create temp directory for scope data
TEMP_DIR=$(mktemp -d)
SCOPES_DIR="$TEMP_DIR/scopes"
mkdir -p "$SCOPES_DIR"

# Collect skills by scope
while IFS= read -r skill_file; do
	[ -f "$skill_file" ] || continue

	skill_name=$(extract_field "$skill_file" "name")
	scope_raw=$(extract_metadata "$skill_file" "scope")
	auto_invoke_raw=$(extract_metadata "$skill_file" "auto_invoke")
	skill_type=$(extract_metadata "$skill_file" "type")
	skill_desc=$(extract_description "$skill_file")

	# Skip meta skills (managed manually)
	[ "$skill_type" = "meta" ] && continue

	# Skip if no scope or auto_invoke defined
	[ -z "$scope_raw" ] || [ -z "$auto_invoke" ] && [ -z "$auto_invoke_raw" ] && continue

	# Default type to project if not set
	[ -z "$skill_type" ] && skill_type="project"

	# Protect pipes in auto_invoke
	auto_invoke=${auto_invoke_raw//|/;;}

	# Parse scope
	scope_clean=$(echo "$scope_raw" | tr -d '[]')
	IFS=', ' read -ra scopes <<<"$scope_clean"

	for scope in "${scopes[@]}"; do
		scope=$(echo "$scope" | tr -d '[:space:]')
		[ -z "$scope" ] && continue

		# Filter by scope if specified
		[ -n "$FILTER_SCOPE" ] && [ "$scope" != "$FILTER_SCOPE" ] && continue

		# Store: type|name|description|auto_invoke
		echo "${skill_type}|${skill_name}|${skill_desc}|${auto_invoke}" >>"$SCOPES_DIR/$scope"
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

	if [ "$scope" = "root" ]; then
		display_name="AGENTS.md"
	else
		display_name="$scope/AGENTS.md"
	fi

	echo -e "${BLUE}Processing: $scope -> $display_name${NC}"

	if [ "$scope" = "root" ]; then
		# === ROOT SCOPE: Update 4 HTML-marker sections ===

		# Separate skills by type
		generic_skills_file="$TEMP_DIR/generic_skills"
		project_skills_file="$TEMP_DIR/project_skills"
		generic_invoke_file="$TEMP_DIR/generic_invoke"
		project_invoke_file="$TEMP_DIR/project_invoke"
		: >"$generic_skills_file"
		: >"$project_skills_file"
		: >"$generic_invoke_file"
		: >"$project_invoke_file"

		while IFS='|' read -r skill_type skill_name skill_desc auto_invoke_raw; do
			# Restore pipes
			auto_invoke_raw=${auto_invoke_raw//;;/|}

			if [ "$skill_type" = "generic" ]; then
				echo "${skill_name}|${skill_desc}" >>"$generic_skills_file"
				echo "$auto_invoke_raw" | tr '|' '\n' | while IFS= read -r action; do
					action=$(echo "$action" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
					[ -z "$action" ] && continue
					printf "%s\t%s\n" "$action" "$skill_name" >>"$generic_invoke_file"
				done
			else
				echo "${skill_name}|${skill_desc}" >>"$project_skills_file"
				echo "$auto_invoke_raw" | tr '|' '\n' | while IFS= read -r action; do
					action=$(echo "$action" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
					[ -z "$action" ] && continue
					printf "%s\t%s\n" "$action" "$skill_name" >>"$project_invoke_file"
				done
			fi
		done <"$scope_file"

		# Build GENERIC-SKILLS table
		generic_skills_content="| Skill | Description | URL |
|-------|-------------|-----|"
		while IFS='|' read -r name desc; do
			[ -z "$name" ] && continue
			generic_skills_content="$generic_skills_content
| \`$name\` | $desc | [SKILL.md](skills/$name/SKILL.md) |"
		done < <(LC_ALL=C sort -t'|' -k1,1 "$generic_skills_file")

		# Build PROJECT-SKILLS table
		project_skills_content="| Skill | Description | URL |
|-------|-------------|-----|"
		while IFS='|' read -r name desc; do
			[ -z "$name" ] && continue
			project_skills_content="$project_skills_content
| \`$name\` | $desc | [SKILL.md](skills/$name/SKILL.md) |"
		done < <(LC_ALL=C sort -t'|' -k1,1 "$project_skills_file")

		# Build GENERIC-AUTO-INVOKE table
		generic_invoke_content="| Action | Skill |
|--------|-------|"
		while IFS=$'\t' read -r action skill_name; do
			[ -z "$action" ] && continue
			generic_invoke_content="$generic_invoke_content
| $action | \`$skill_name\` |"
		done < <(LC_ALL=C sort -t$'\t' -k1,1 -k2,2 "$generic_invoke_file")

		# Build PROJECT-AUTO-INVOKE table
		project_invoke_content="| Action | Skill |
|--------|-------|"
		while IFS=$'\t' read -r action skill_name; do
			[ -z "$action" ] && continue
			project_invoke_content="$project_invoke_content
| $action | \`$skill_name\` |"
		done < <(LC_ALL=C sort -t$'\t' -k1,1 -k2,2 "$project_invoke_file")

		if $DRY_RUN; then
			echo -e "${YELLOW}[DRY RUN] Would update $agents_path with:${NC}"
			echo ""
			echo "--- GENERIC-SKILLS ---"
			echo "$generic_skills_content"
			echo ""
			echo "--- GENERIC-AUTO-INVOKE ---"
			echo "$generic_invoke_content"
			echo ""
			echo "--- PROJECT-SKILLS ---"
			echo "$project_skills_content"
			echo ""
			echo "--- PROJECT-AUTO-INVOKE ---"
			echo "$project_invoke_content"
			echo ""
		else
			# Check that markers exist
			has_markers=true
			for marker in GENERIC-SKILLS GENERIC-AUTO-INVOKE PROJECT-SKILLS PROJECT-AUTO-INVOKE; do
				if ! grep -q "<!-- ${marker}:START" "$agents_path"; then
					echo -e "${YELLOW}  Warning: Missing marker <!-- ${marker}:START --> in $display_name${NC}"
					has_markers=false
				fi
			done

			if $has_markers; then
				replace_marker_section "$agents_path" "GENERIC-SKILLS" "$generic_skills_content"
				replace_marker_section "$agents_path" "GENERIC-AUTO-INVOKE" "$generic_invoke_content"
				replace_marker_section "$agents_path" "PROJECT-SKILLS" "$project_skills_content"
				replace_marker_section "$agents_path" "PROJECT-AUTO-INVOKE" "$project_invoke_content"
				echo -e "${GREEN}  Updated all 4 sections${NC}"
			else
				echo -e "${RED}  Skipped: AGENTS.md is missing HTML marker sections${NC}"
				echo -e "  Add these markers to AGENTS.md:"
				echo "    <!-- GENERIC-SKILLS:START - Do not remove. Auto-generated by skill-sync -->"
				echo "    <!-- GENERIC-SKILLS:END -->"
				echo "    <!-- GENERIC-AUTO-INVOKE:START - Do not remove. Auto-generated by skill-sync -->"
				echo "    <!-- GENERIC-AUTO-INVOKE:END -->"
				echo "    <!-- PROJECT-SKILLS:START - Do not remove. Auto-generated by skill-sync -->"
				echo "    <!-- PROJECT-SKILLS:END -->"
				echo "    <!-- PROJECT-AUTO-INVOKE:START - Do not remove. Auto-generated by skill-sync -->"
				echo "    <!-- PROJECT-AUTO-INVOKE:END -->"
			fi
		fi
	else
		# === NON-ROOT SCOPE: Single Auto-invoke section ===
		auto_invoke_section="### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|"

		rows_file="$TEMP_DIR/rows_$scope"
		: >"$rows_file"

		while IFS='|' read -r skill_type skill_name skill_desc auto_invoke_raw; do
			auto_invoke_raw=${auto_invoke_raw//;;/|}
			echo "$auto_invoke_raw" | tr '|' '\n' | while IFS= read -r action; do
				action=$(echo "$action" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
				[ -z "$action" ] && continue
				printf "%s\t%s\n" "$action" "$skill_name" >>"$rows_file"
			done
		done <"$scope_file"

		while IFS=$'\t' read -r action skill_name; do
			[ -z "$action" ] && continue
			auto_invoke_section="$auto_invoke_section
| $action | \`$skill_name\` |"
		done < <(LC_ALL=C sort -t$'\t' -k1,1 -k2,2 "$rows_file")

		if $DRY_RUN; then
			echo -e "${YELLOW}[DRY RUN] Would update $agents_path with:${NC}"
			echo "$auto_invoke_section"
			echo ""
		else
			section_file="$TEMP_DIR/section"
			echo "$auto_invoke_section" >"$section_file"

			if grep -q "### Auto-invoke Skills" "$agents_path"; then
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
	skill_type=$(extract_metadata "$skill_file" "type")

	if [ -z "$scope_raw" ] || [ -z "$auto_invoke_raw" ] || [ -z "$skill_type" ]; then
		missing_fields=""
		[ -z "$scope_raw" ] && missing_fields="scope "
		[ -z "$auto_invoke_raw" ] && missing_fields="${missing_fields}auto_invoke "
		[ -z "$skill_type" ] && missing_fields="${missing_fields}type "
		echo -e "  ${YELLOW}$skill_name${NC} - missing: $missing_fields"
		missing=$((missing + 1))
	fi
done < <(find "$SKILLS_DIR" -mindepth 2 -maxdepth 2 -name SKILL.md -print 2>/dev/null | sort)

if [ $missing -eq 0 ]; then
	echo -e "  ${GREEN}All skills have sync metadata${NC}"
fi
