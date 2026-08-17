#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# organize_aios.sh
# Usage: ./scripts/organize_aios.sh <source_tmp_dir> <dest_dir>
# Example: ./scripts/organize_aios.sh tmp_unzip aios_complete_01

SRC_DIR="$1"
DEST_DIR="$2"
ROOT="$(pwd)"

if [ -z "$SRC_DIR" ] || [ -z "$DEST_DIR" ]; then
  echo "Uso: $0 <source_tmp_dir> <dest_dir>"
  exit 1
fi

if [ ! -d "$SRC_DIR" ]; then
  echo "Diretório fonte '$SRC_DIR' não existe"
  exit 1
fi

mkdir -p "$DEST_DIR"

# Mapeamento de extensões para pastas
declare -A MAP
MAP=( 
  [py]="src/python"
  [js]="src/javascript"
  [ts]="src/typescript"
  [java]="src/java"
  [c]="src/c"
  [cpp]="src/cpp"
  [cc]="src/cpp"
  [h]="src/cpp"
  [hpp]="src/cpp"
  [cs]="src/csharp"
  [go]="src/go"
  [rb]="src/ruby"
  [php]="src/php"
  [swift]="src/swift"
  [kt]="src/kotlin"
  [rs]="src/rust"
  [scala]="src/scala"
  [m]="src/objective-c"
  [mm]="src/objective-cpp"
  [lua]="src/lua"
  [sh]="scripts"
  [ps1]="scripts"
  [bat]="scripts"
  [html]="web"
  [htm]="web"
  [css]="web"
  [scss]="web"
  [jsx]="web"
  [tsx]="web"
  [md]="docs"
  [markdown]="docs"
  [txt]="docs"
  [rst]="docs"
  [pdf]="docs"
  [png]="assets/images"
  [jpg]="assets/images"
  [jpeg]="assets/images"
  [gif]="assets/images"
  [svg]="assets/images"
  [ico]="assets/images"
  [mp3]="assets/media"
  [wav]="assets/media"
  [mp4]="assets/media"
  [mov]="assets/media"
  [json]="configs"
  [yaml]="configs"
  [yml]="configs"
  [xml]="configs"
  [ini]="configs"
  [env]="configs"
  [zip]="archives"
  [rar]="archives"
  [7z]="archives"
)

move_file() {
  local src="$1"
  local rel="${src#$SRC_DIR/}"
  local dirpart
  dirpart="$(dirname "$rel")"
  local filename
  filename="$(basename "$rel")"
  local ext
  ext="${filename##*.}"
  ext="${ext,,}"
  local targetbase="others"

  if [[ "$rel" =~ (^|/)(test|tests)(/|$) ]] || [[ "$filename" =~ ([Tt]est) ]]; then
    targetbase="tests"
  elif [[ -n "${MAP[$ext]:-}" ]]; then
    targetbase="${MAP[$ext]}"
  else
    if [[ "$rel" =~ (^|/)doc(s)?(/|$) ]]; then
      targetbase="docs"
    fi
  fi

  local dest="$ROOT/$DEST_DIR/$targetbase/$dirpart"
  mkdir -p "$dest"

  local dest_path="$dest/$filename"
  if [ -e "$dest_path" ]; then
    local i=1
    local base_name="${filename%.*}"
    local extension="$ext"
    while [ -e "${dest}/${base_name}_dup${i}.${extension}" ]; do
      i=$((i+1))
    done
    dest_path="${dest}/${base_name}_dup${i}.${extension}"
  fi
  mv "$src" "$dest_path"
}

# Iterate files
while IFS= read -r -d '' f; do
  [ -f "$f" ] || continue
  move_file "$f"
done < <(find "$SRC_DIR" -type f -print0)

# Create README in destination
cat > "$DEST_DIR/README_ORGANIZATION.txt" <<'EOF'
Organização automática gerada pelo script:
- src/...        -> código-fonte por linguagem (python, javascript, java, etc.)
- scripts/       -> scripts shell / powershell / batch
- web/           -> html/css/js/tsx/jsx
- assets/        -> images e media
- docs/          -> documentação (.md, .txt, pdf)
- configs/       -> arquivos de configuração (.json, .yml, .env, .xml)
- tests/         -> arquivos e pastas de teste (heurística por nome)
- archives/      -> zip/rar/7z extra
- others/        -> arquivos não categorizados

Revise a pasta e ajuste conforme necessário.
EOF

echo "Organização concluída em ./$DEST_DIR"
