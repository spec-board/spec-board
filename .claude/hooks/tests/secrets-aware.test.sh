#!/bin/bash
# secrets-aware.test.sh - Automated test suite for secrets-aware hook
#
# Usage: bash .claude/hooks/tests/secrets-aware.test.sh
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_DIR="$(cd "$HOOK_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Test helper function
test_command() {
  local description="$1"
  local command="$2"
  local expected_result="$3"  # "BLOCKED" or "ALLOWED"

  TOTAL=$((TOTAL + 1))

  # Run the hook with the command
  local result
  result=$(echo "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"$command\"}}" | node "$HOOK_DIR/secrets-aware.cjs" 2>/dev/null)

  # Check if blocked or allowed
  if echo "$result" | grep -q '"permissionDecision": "deny"'; then
    local actual="BLOCKED"
  else
    local actual="ALLOWED"
  fi

  if [ "$actual" = "$expected_result" ]; then
    echo -e "${GREEN}✓${NC} $description"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description"
    echo -e "  Expected: $expected_result, Got: $actual"
    echo -e "  Command: $command"
    FAILED=$((FAILED + 1))
  fi
}

# Test helper for Read tool
test_read() {
  local description="$1"
  local file_path="$2"
  local expected_result="$3"

  TOTAL=$((TOTAL + 1))

  local result
  result=$(echo "{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$file_path\"}}" | node "$HOOK_DIR/secrets-aware.cjs" 2>/dev/null)

  if echo "$result" | grep -q '"permissionDecision": "deny"'; then
    local actual="BLOCKED"
  else
    local actual="ALLOWED"
  fi

  if [ "$actual" = "$expected_result" ]; then
    echo -e "${GREEN}✓${NC} $description"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description"
    echo -e "  Expected: $expected_result, Got: $actual"
    echo -e "  File: $file_path"
    FAILED=$((FAILED + 1))
  fi
}

echo "========================================"
echo "  secrets-aware.sh Test Suite"
echo "========================================"
echo ""

# Change to project directory
cd "$PROJECT_DIR"

# ==========================================
# READ BLOCKING TESTS
# ==========================================
echo -e "${YELLOW}Read Blocking Tests${NC}"
echo "----------------------------------------"

test_read "Block reading .env" ".env" "BLOCKED"
test_read "Block reading .env.local" ".env.local" "BLOCKED"
test_read "Block reading .env.development" ".env.development" "BLOCKED"
test_read "Block reading .env.production" ".env.production" "BLOCKED"
test_read "Block reading credentials.json" "credentials.json" "BLOCKED"
test_read "Block reading secrets.json" "secrets.json" "BLOCKED"
test_read "Block reading secrets.yaml" "secrets.yaml" "BLOCKED"
test_read "Block reading .pem files" "server.pem" "BLOCKED"
test_read "Block reading .key files" "private.key" "BLOCKED"

echo ""

# ==========================================
# READ ALLOWLIST TESTS
# ==========================================
echo -e "${YELLOW}Read Allowlist Tests (Safe Files)${NC}"
echo "----------------------------------------"

test_read "Allow reading .env.example" ".env.example" "ALLOWED"
test_read "Allow reading .env.sample" ".env.sample" "ALLOWED"
test_read "Allow reading .env.template" ".env.template" "ALLOWED"
test_read "Allow reading .env.defaults" ".env.defaults" "ALLOWED"
test_read "Allow reading example.env" "example.env" "ALLOWED"
test_read "Allow reading sample.env" "sample.env" "ALLOWED"
test_read "Allow reading template.env" "template.env" "ALLOWED"

echo ""

# ==========================================
# BASH READ COMMAND TESTS
# ==========================================
echo -e "${YELLOW}Bash Read Command Tests${NC}"
echo "----------------------------------------"

test_command "Block cat .env" "cat .env" "BLOCKED"
test_command "Block head .env" "head .env" "BLOCKED"
test_command "Block tail .env" "tail .env" "BLOCKED"
test_command "Block less .env" "less .env" "BLOCKED"
test_command "Block more .env" "more .env" "BLOCKED"
test_command "Block grep on .env" "grep PASSWORD .env" "BLOCKED"

echo ""

# ==========================================
# WRITE BLOCKING TESTS - echo/printf
# ==========================================
echo -e "${YELLOW}Write Blocking Tests - echo/printf${NC}"
echo "----------------------------------------"

test_command "Block echo > .env" "echo PORT=3000 > .env" "BLOCKED"
test_command "Block echo >> .env" "echo PORT=3000 >> .env" "BLOCKED"
test_command "Block printf > .env" "printf 'PORT=3000' > .env" "BLOCKED"
test_command "Block printf >> .env" "printf 'PORT=3000' >> .env" "BLOCKED"
test_command "Block echo > .env.local" "echo test > .env.local" "BLOCKED"
test_command "Block echo > .env.production" "echo test > .env.production" "BLOCKED"

echo ""

# ==========================================
# WRITE BLOCKING TESTS - tee/cat
# ==========================================
echo -e "${YELLOW}Write Blocking Tests - tee/cat${NC}"
echo "----------------------------------------"

test_command "Block tee .env" "echo test | tee .env" "BLOCKED"
test_command "Block tee -a .env" "echo test | tee -a .env" "BLOCKED"
test_command "Block cat > .env" "cat > .env" "BLOCKED"
test_command "Block cat >> .env" "cat >> .env" "BLOCKED"

echo ""

# ==========================================
# WRITE BLOCKING TESTS - sed/cp/mv/dd
# ==========================================
echo -e "${YELLOW}Write Blocking Tests - sed/cp/mv/dd${NC}"
echo "----------------------------------------"

test_command "Block sed -i .env" "sed -i 's/old/new/' .env" "BLOCKED"
test_command "Block sed --in-place .env" "sed --in-place 's/old/new/' .env" "BLOCKED"
test_command "Block cp to .env" "cp other.txt .env" "BLOCKED"
test_command "Block mv to .env" "mv temp.txt .env" "BLOCKED"
test_command "Block dd of=.env" "dd if=input of=.env" "BLOCKED"

echo ""

# ==========================================
# WRITE BLOCKING TESTS - Quoted Paths
# ==========================================
echo -e "${YELLOW}Write Blocking Tests - Quoted Paths${NC}"
echo "----------------------------------------"

# Note: Double quotes need proper escaping in JSON
test_command "Block echo > '.env'" "echo test > '.env'" "BLOCKED"
test_command "Block cp to '.env'" "cp other.txt '.env'" "BLOCKED"
test_command "Block mv to '.env'" "mv temp.txt '.env'" "BLOCKED"
test_command "Block tee '.env'" "echo test | tee '.env'" "BLOCKED"

echo ""

# ==========================================
# WRITE ALLOWLIST TESTS
# ==========================================
echo -e "${YELLOW}Write Allowlist Tests (Safe Files)${NC}"
echo "----------------------------------------"

test_command "Allow echo > .env.example" "echo PORT=3000 > .env.example" "ALLOWED"
test_command "Allow echo > .env.sample" "echo PORT=3000 > .env.sample" "ALLOWED"
test_command "Allow cp to .env.example" "cp other.txt .env.example" "ALLOWED"
test_command "Allow mv to .env.template" "mv temp.txt .env.template" "ALLOWED"

echo ""

# ==========================================
# SAFE COMMANDS TESTS
# ==========================================
echo -e "${YELLOW}Safe Commands Tests${NC}"
echo "----------------------------------------"

test_command "Allow echo without redirect" "echo hello world" "ALLOWED"
test_command "Allow cat regular file" "cat README.md" "ALLOWED"
test_command "Allow cp regular files" "cp file1.txt file2.txt" "ALLOWED"
test_command "Allow mv regular files" "mv old.txt new.txt" "ALLOWED"
test_command "Allow ls command" "ls -la" "ALLOWED"
test_command "Allow git status" "git status" "ALLOWED"

echo ""

# ==========================================
# SUMMARY
# ==========================================
echo "========================================"
echo "  Test Summary"
echo "========================================"
echo -e "Total:  $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
