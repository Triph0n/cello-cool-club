#!/bin/bash
# args: list of "dir|Title"
LIVE=/c/Users/Vladimir/Documents/CelloCoolClub/celloclublive
while IFS='|' read -r dir title; do
  [ -z "$dir" ] && continue
  echo "=== $title"
  node custom-generate.mjs "$title — 1920" "$LIVE/$dir/style-1920.txt" "$LIVE/$dir/lyrics.txt" 2>&1 | tail -3
  sleep 20
done
