#!/usr/bin/env bash
set -euo pipefail

COS_BASE_URL="https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/assets/fonts"

FORCE=0
CACHE_DIR=""
INSTALL_DIR=""

usage() {
  cat <<'EOF'
Usage: scripts/install-unix-fonts.sh [--force] [--cache-dir DIR] [--install-dir DIR]

Install VSP-Marp fonts for the current Linux or macOS user.

Options:
  --force            Re-download and overwrite installed font files.
  --cache-dir DIR    Download cache directory. Default: .marp-cache/fonts
  --install-dir DIR  User font directory. Defaults:
                     Linux: ${XDG_DATA_HOME:-$HOME/.local/share}/fonts/vsp-marp
                     macOS: $HOME/Library/Fonts
  -h, --help         Show this help.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --force)
      FORCE=1
      shift
      ;;
    --cache-dir)
      CACHE_DIR="${2:?Missing value for --cache-dir}"
      shift 2
      ;;
    --install-dir)
      INSTALL_DIR="${2:?Missing value for --install-dir}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if [ -z "$CACHE_DIR" ]; then
  CACHE_DIR="$REPO_ROOT/.marp-cache/fonts"
fi

if [ -z "$INSTALL_DIR" ]; then
  case "$(uname -s)" in
    Darwin)
      INSTALL_DIR="$HOME/Library/Fonts"
      ;;
    Linux)
      INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/fonts/vsp-marp"
      ;;
    *)
      echo "This script supports Linux and macOS only." >&2
      exit 1
      ;;
  esac
fi

download_file() {
  local url="$1"
  local output="$2"

  if command -v curl >/dev/null 2>&1; then
    curl -fL --retry 3 --connect-timeout 20 -o "$output" "$url"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$output" "$url"
  else
    echo "Missing downloader: install curl or wget." >&2
    exit 1
  fi
}

install_group() {
  local group_name="$1"
  local remote_dir="$2"
  shift 2

  local group_cache="$CACHE_DIR/$group_name"
  mkdir -p "$group_cache" "$INSTALL_DIR"

  echo "== $group_name =="
  for font_file in "$@"; do
    local download_path="$group_cache/$font_file"
    local installed_path="$INSTALL_DIR/$font_file"
    local url="$COS_BASE_URL/$remote_dir/$font_file"

    if [ -f "$installed_path" ] && [ "$FORCE" -ne 1 ]; then
      echo "Installed: $installed_path"
      continue
    fi

    if [ -f "$download_path" ] && [ "$FORCE" -ne 1 ]; then
      echo "Downloaded: $download_path"
    else
      echo "Downloading: $url"
      download_file "$url" "$download_path"
    fi

    echo "Installing: $installed_path"
    cp -f "$download_path" "$installed_path"
  done
}

echo "Installing fonts for current user."
echo "Cache: $CACHE_DIR"
echo "Install directory: $INSTALL_DIR"
echo "Font family names are kept from the original OTF metadata."

install_group "latin-modern" "latin-modern" \
  "lmroman10-regular.otf" \
  "lmroman10-bold.otf" \
  "lmsans10-regular.otf" \
  "lmsans10-bold.otf" \
  "lmmono10-regular.otf" \
  "lmmonolt10-bold.otf"

install_group "noto" "noto" \
  "NotoSerifCJKsc-Regular.otf" \
  "NotoSerifCJKsc-Bold.otf" \
  "NotoSansCJKsc-Regular.otf" \
  "NotoSansCJKsc-Bold.otf" \
  "NotoSansMonoCJKsc-Regular.otf" \
  "NotoSansMonoCJKsc-Bold.otf"

if command -v fc-cache >/dev/null 2>&1; then
  echo "Refreshing fontconfig cache."
  fc-cache -f "$INSTALL_DIR"
fi

echo "Done. Restart VS Code, browsers, or terminals that were opened before installation."
