#!/bin/sh
set -e

PACKAGE_NAME="@decodo/cli"
COMMAND_NAME="decodo"
MIN_NODE_MAJOR=18

ORIG_PATH=""
USER_PREFIX_BIN=""
PATH_ACTIVATION_REQUIRED=0
ACTIVATION_RC_FILE=""
LINKED_DIR=""

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
success() { printf "${GREEN}${BOLD}%s${RESET}\n" "$1"; }
error() { printf "${RED}${BOLD}error:${RESET} %s\n" "$1" >&2; exit 1; }

path_contains() {
  dir="$1"
  path_list="$2"
  case ":${path_list}:" in
    *":${dir}:"*) return 0 ;;
  esac
  return 1
}

shell_rc_file() {
  shell_name=$(basename "${SHELL:-/bin/sh}")
  case "$shell_name" in
    zsh) printf '%s' "$HOME/.zshrc" ;;
    bash) printf '%s' "$HOME/.bashrc" ;;
    fish) printf '%s' "$HOME/.config/fish/config.fish" ;;
    *) printf '%s' "$HOME/.profile" ;;
  esac
}

resolve_install_bin() {
  if [ -n "$USER_PREFIX_BIN" ]; then
    printf '%s' "$USER_PREFIX_BIN"
    return 0
  fi
  npm_prefix=$(npm prefix -g 2>/dev/null) || error "Could not determine npm global bin directory."
  printf '%s/bin' "$npm_prefix"
}

ensure_path() {
  dir="$1"

  if path_contains "$dir" "$ORIG_PATH"; then
    return 0
  fi

  rc_file=$(shell_rc_file)
  ACTIVATION_RC_FILE="$rc_file"
  PATH_ACTIVATION_REQUIRED=1

  if [ -f "$rc_file" ] && grep -Fq "$dir" "$rc_file" 2>/dev/null; then
    warn "$dir is in $rc_file but not active in this shell."
    return 0
  fi

  mkdir -p "$(dirname "$rc_file")"
  printf '\n' >> "$rc_file"
  shell_name=$(basename "${SHELL:-/bin/sh}")
  if [ "$shell_name" = "fish" ]; then
    printf 'set -gx PATH "%s" $PATH\n' "$dir" >> "$rc_file"
  else
    printf 'export PATH="%s:$PATH"\n' "$dir" >> "$rc_file"
  fi

  warn "$dir was not in your PATH. Added it to $rc_file"
}

first_writable_path_dir() {
  exclude="$1"
  old_ifs="$IFS"
  IFS=:
  set -f
  set -- $ORIG_PATH
  set +f
  IFS="$old_ifs"

  for dir in "$@"; do
    [ -n "$dir" ] || continue
    case "$dir" in
      /*) ;;
      *) continue ;;
    esac
    [ "$dir" = "$exclude" ] && continue
    if [ -d "$dir" ] && [ -w "$dir" ]; then
      printf '%s' "$dir"
      return 0
    fi
  done

  return 1
}

link_command() {
  bin_dir="$1"
  dest_dir="$2"
  src="${bin_dir}/${COMMAND_NAME}"
  dest="${dest_dir}/${COMMAND_NAME}"

  [ -e "$src" ] || return 1
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    return 1
  fi

  ln -sf "$src" "$dest" 2>/dev/null || return 1
  return 0
}

link_command_onto_path() {
  bin_dir="$1"

  if path_contains "$bin_dir" "$ORIG_PATH"; then
    return 0
  fi

  link_dir=$(first_writable_path_dir "$bin_dir") || link_dir=""
  if [ -n "$link_dir" ] && link_command "$bin_dir" "$link_dir"; then
    LINKED_DIR="$link_dir"
    return 0
  fi

  ensure_path "$bin_dir"
}

print_rehash_hint() {
  shell_name=$(basename "${SHELL:-/bin/sh}")
  case "$shell_name" in
    zsh | bash)
      printf "${DIM}If this shell can't find decodo yet, run: hash -r${RESET}\n"
      ;;
  esac
}

command_prefix() {
  printf '%s' "$COMMAND_NAME"
}

print_activation_steps() {
  bin_dir="$1"
  if [ "$PATH_ACTIVATION_REQUIRED" != 1 ]; then
    return 0
  fi
  printf '\n'
  warn "Run this now: source ${ACTIVATION_RC_FILE}"
  warn "Or: export PATH=\"${bin_dir}:\$PATH\""
}

offer_setup() {
  bin_dir="$1"
  decodo_bin="${bin_dir}/${COMMAND_NAME}"

  if ! [ -f "$decodo_bin" ]; then
    error "Could not find ${decodo_bin} after install."
  fi

  if ! [ -t 0 ] || ! [ -t 1 ]; then
    cmd=$(command_prefix "$bin_dir")
    printf "\nNext step: configure your auth token with ${BOLD}%s setup${RESET}\n\n" "$cmd"
    return 0
  fi

  printf '\nNext: configure your auth token.\n\n'
  printf 'Continue with setup? [Y/n] '
  if ! read -r answer </dev/tty 2>/dev/null; then
    cmd=$(command_prefix "$bin_dir")
    printf '\nRun %s setup when you are ready.\n\n' "$cmd"
    return 0
  fi
  printf '\n'

  case "$answer" in
    [nN]*)
      cmd=$(command_prefix "$bin_dir")
      printf 'Run %s setup when you are ready.\n\n' "$cmd"
      return 0
      ;;
  esac

  "$decodo_bin" setup
}

print_next_steps() {
  bin_dir="$1"
  cmd=$(command_prefix "$bin_dir")

  printf 'Get started:\n'
  printf "  ${BOLD}%s scrape${RESET} https://ip.decodo.com\n" "$cmd"
  printf "  ${BOLD}%s search${RESET} \"decodo scraping api\"\n" "$cmd"
  printf "  ${BOLD}%s whoami${RESET}\n\n" "$cmd"
}

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
  fi

  user_prefix="${HOME}/.local"
  info "Installing ${PACKAGE_NAME} to ${user_prefix} (no sudo needed)..."
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

  ORIG_PATH="$PATH"

  check_platform
  NODE_VERSION=$(check_node)
  info "Found Node.js v${NODE_VERSION}"

  if ! command -v npm >/dev/null 2>&1; then
    error "npm is not available. Install npm and try again."
  fi

  install_package

  BIN_DIR=$(resolve_install_bin)
  link_command_onto_path "$BIN_DIR"

  installed_version=$("${BIN_DIR}/${COMMAND_NAME}" --version 2>/dev/null || echo "unknown")
  printf '\n'
  success "Success! ${PACKAGE_NAME} ${installed_version} is installed."

  if [ "$PATH_ACTIVATION_REQUIRED" = 1 ]; then
    print_activation_steps "$BIN_DIR"
  elif [ -n "$LINKED_DIR" ]; then
    success "Ready to use — decodo is on your PATH (linked into ${LINKED_DIR})."
    print_rehash_hint
  else
    success "Ready to use — decodo is on your PATH."
  fi

  offer_setup "$BIN_DIR"
  print_next_steps "$BIN_DIR"
}

main
