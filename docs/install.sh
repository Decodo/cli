#!/bin/sh
set -e

PACKAGE_NAME="@decodo/cli"
COMMAND_NAME="decodo"
COMMAND_ALIAS="dcd"
MIN_NODE_MAJOR=18

if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  BOLD='\033[1m'
  DIM='\033[2m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' BOLD='' DIM='' RESET=''
fi

info() { printf "${BLUE}${BOLD}==>${RESET} %s\n" "$1"; }
warn() { printf "${YELLOW}${BOLD}warning:${RESET} %s\n" "$1"; }
error() { printf "${RED}${BOLD}error:${RESET} %s\n" "$1" >&2; exit 1; }

check_platform() {
  case "$(uname -s)" in
    Linux|Darwin) ;;
    *)
      error "Unsupported operating system: $(uname -s).
This installer supports Linux and macOS only."
      ;;
  esac
}

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    error "Node.js is not installed.
Install Node.js ${MIN_NODE_MAJOR}+ from https://nodejs.org/ and try again."
  fi

  version=$(node -v 2>/dev/null | sed 's/^v//')
  major=$(echo "$version" | cut -d. -f1)

  if ! [ "$major" -ge "$MIN_NODE_MAJOR" ] 2>/dev/null; then
    error "Node.js v${version} found, but v${MIN_NODE_MAJOR}+ is required.
Update Node.js from https://nodejs.org/ and try again."
  fi

  echo "$version"
}

main() {
  printf "\n${BOLD}Decodo CLI Installer${RESET}\n\n"

  check_platform
  NODE_VERSION=$(check_node)
  info "Found Node.js v${NODE_VERSION}"

  if ! command -v npm >/dev/null 2>&1; then
    error "npm is not available. Install npm and try again."
  fi

  info "Installing ${PACKAGE_NAME} globally..."
  npm install -g "${PACKAGE_NAME}"

  if command -v "$COMMAND_NAME" >/dev/null 2>&1; then
    installed_version=$("$COMMAND_NAME" --version 2>/dev/null || echo "unknown")
    printf "\n${GREEN}${BOLD}Success!${RESET} ${PACKAGE_NAME} ${installed_version} is installed.\n"
  elif command -v "$COMMAND_ALIAS" >/dev/null 2>&1; then
    installed_version=$("$COMMAND_ALIAS" --version 2>/dev/null || echo "unknown")
    printf "\n${GREEN}${BOLD}Success!${RESET} ${PACKAGE_NAME} ${installed_version} is installed.\n"
  else
    printf "\n${GREEN}${BOLD}Installed!${RESET} You may need to restart your shell or add the npm global bin directory to your PATH.\n"
    npm_bin=$(npm bin -g 2>/dev/null) || true
    if [ -n "$npm_bin" ] && ! echo "$PATH" | tr ':' '\n' | grep -qx "$npm_bin"; then
      warn "${npm_bin} is not in your PATH. Add it with:"
      printf "  export PATH=\"%s:\$PATH\"\n\n" "$npm_bin"
    fi
  fi

  printf "\nNext step: configure your auth token with ${BOLD}decodo setup${RESET}\n"
  printf "Get started:\n"
  printf "  ${BOLD}decodo scrape${RESET} https://ip.decodo.com\n"
  printf "  ${BOLD}decodo search${RESET} \"decodo scraping api\"\n"
  printf "  ${BOLD}dcd whoami${RESET}            # shorthand alias\n\n"
}

main
