#!/bin/sh
set -e

PACKAGE_NAME="@decodo/cli"
COMMAND_NAME="decodo"
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

can_write_global() {
  prefix=$(npm prefix -g 2>/dev/null) || return 1
  [ -n "$prefix" ] || return 1

  for dir in "${prefix}/lib/node_modules" "${prefix}/bin"; do
    target="$dir"
    while [ ! -d "$target" ]; do
      target=$(dirname "$target")
    done
    [ -w "$target" ] || return 1
  done
}

install_package() {
  USER_PREFIX_BIN=""

  if can_write_global; then
    info "Installing ${PACKAGE_NAME} globally..."
    if npm install -g "${PACKAGE_NAME}"; then
      return
    fi
    warn "Global install failed. Falling back to a user-level install."
  else
    warn "No write permission for the npm global directory ($(npm prefix -g 2>/dev/null))."
    info "Installing ${PACKAGE_NAME} to ${HOME}/.npm-global instead (no sudo needed)..."
  fi

  user_prefix="${HOME}/.npm-global"
  mkdir -p "$user_prefix"

  if ! npm install -g --prefix "$user_prefix" "${PACKAGE_NAME}"; then
    error "Installation failed.
Try fixing your npm permissions (https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)
or run the CLI without installing: npx ${PACKAGE_NAME} --help"
  fi

  USER_PREFIX_BIN="${user_prefix}/bin"
  PATH="${USER_PREFIX_BIN}:${PATH}"
  export PATH
}

main() {
  printf "\n${BOLD}Decodo CLI Installer${RESET}\n\n"

  check_platform
  NODE_VERSION=$(check_node)
  info "Found Node.js v${NODE_VERSION}"

  if ! command -v npm >/dev/null 2>&1; then
    error "npm is not available. Install npm and try again."
  fi

  install_package

  if command -v "$COMMAND_NAME" >/dev/null 2>&1; then
    installed_version=$("$COMMAND_NAME" --version 2>/dev/null || echo "unknown")
    printf "\n${GREEN}${BOLD}Success!${RESET} ${PACKAGE_NAME} ${installed_version} is installed.\n"
  else
    printf "\n${GREEN}${BOLD}Installed!${RESET} You may need to restart your shell or add the npm global bin directory to your PATH.\n"
    if [ -z "$USER_PREFIX_BIN" ]; then
      npm_prefix=$(npm config get prefix 2>/dev/null) || true
      npm_bin="${npm_prefix:+$npm_prefix/bin}"
      if [ -n "$npm_bin" ] && ! echo "$PATH" | tr ':' '\n' | grep -qx "$npm_bin"; then
        warn "${npm_bin} is not in your PATH. Add it with:"
        printf "  export PATH=\"%s:\$PATH\"\n\n" "$npm_bin"
      fi
    fi
  fi

  if [ -n "$USER_PREFIX_BIN" ]; then
    printf "\nThe CLI was installed to ${BOLD}%s${RESET}.\n" "$USER_PREFIX_BIN"
    printf "Add it to your PATH permanently by appending this line to your shell profile (e.g. ~/.zshrc or ~/.bashrc):\n"
    printf "  ${BOLD}export PATH=\"%s:\$PATH\"${RESET}\n" "$USER_PREFIX_BIN"
  fi

  printf "\nNext step: configure your auth token with ${BOLD}decodo setup${RESET}\n"
  printf "Get started:\n"
  printf "  ${BOLD}decodo scrape${RESET} https://ip.decodo.com\n"
  printf "  ${BOLD}decodo search${RESET} \"decodo scraping api\"\n"
  printf "  ${BOLD}decodo whoami${RESET}\n\n"
}

main
