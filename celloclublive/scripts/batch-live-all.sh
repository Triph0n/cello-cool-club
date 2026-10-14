#!/bin/bash
# args: batch file with "dir|Title" lines; generates all three decades per card
LIVE=/c/Users/Vladimir/Documents/CelloCoolClub/celloclublive
while IFS='|' read -r dir title; do
  [ -z "$dir" ] && continue
  for d in 1920 1930 1940; do
    echo "=== $title — $d"
    node custom-generate.mjs "$title — $d" "$LIVE/$dir/style-$d.txt" "$LIVE/$dir/lyrics.txt" 2>&1 | tail -2
    sleep 25
  done
done < "$1"
