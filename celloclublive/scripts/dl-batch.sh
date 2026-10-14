#!/bin/bash
LIVE=/c/Users/Vladimir/Documents/CelloCoolClub/celloclublive
DLDIR=/c/Users/Vladimir/Downloads
S=/c/Users/Vladimir/.claude/skills/suno-generator/scripts
while IFS='|' read -r dir title; do
  [ -z "$dir" ] && continue
  full="$title — 1920"
  if [ -f "$LIVE/$dir/$full.mp3" ]; then echo "SKIP $full"; continue; fi
  out=""
  for try in 1 2 3; do
    out=$(node "$S/download-one.mjs" "$full" --exact 2>&1 | tail -1)
    case "$out" in DOWNLOADED*) break;; esac
    sleep 5
  done
  case "$out" in
    DOWNLOADED*)
      f="${out#DOWNLOADED|}"
      mv "$DLDIR/$f" "$LIVE/$dir/$full.mp3" && echo "OK $full"
      ;;
    *) echo "FAIL $full :: $out";;
  esac
done
