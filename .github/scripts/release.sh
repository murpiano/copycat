#!/usr/bin/env bash
set -euo pipefail

dry_run=0
target=HEAD
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    *) target=$arg ;;
  esac
done
sha=$(git rev-parse "$target")
last=$(git describe --tags --abbrev=0 --match 'v[0-9]*.[0-9]*.[0-9]*' "$sha" 2>/dev/null || true)
[ -n "$last" ] || { echo "No v* tag yet." >&2; exit 1; }

bump=0
breaking=() added=() fixed=()
while IFS= read -r -d $'\x1e' record; do
  record=${record#$'\n'}
  subject=${record%%$'\x1f'*}
  body=${record#*$'\x1f'}
  pattern='^([a-z]+)(\([^)]*\))?(!)?: (.+)$'
  [[ "$subject" =~ $pattern ]] || continue
  type=${BASH_REMATCH[1]}
  bang=${BASH_REMATCH[3]}
  text=${BASH_REMATCH[4]}
  items=()
  while IFS= read -r note; do
    [ -n "$note" ] && items+=("- $note")
  done < <(sed -n 's/^Release-note: //p' <<<"$body")
  [ "${#items[@]}" -gt 0 ] || items=("- ${text^}")
  if [ -n "$bang" ] || grep -q '^BREAKING CHANGE' <<<"$body"; then breaking+=("${items[@]}"); bump=3; continue; fi
  case "$type" in
    feat) added+=("${items[@]}"); (( bump < 2 )) && bump=2 ;;
    fix|perf) fixed+=("${items[@]}"); (( bump < 1 )) && bump=1 ;;
  esac
done < <(git log --no-merges --reverse --format='%s%x1f%b%x1e' "$last..$sha")

[ "$bump" -gt 0 ] || { echo "No releasable commits since $last. No release."; exit 0; }
IFS=. read -r major minor patch <<<"${last#v}"
case "$bump" in
  3) next="$((major + 1)).0.0" ;;
  2) next="$major.$((minor + 1)).0" ;;
  1) next="$major.$minor.$((patch + 1))" ;;
esac
tag="v$next"
notes=$(mktemp)
trap 'rm -f "$notes"' EXIT
{
  section() { local title=$1; shift; [ "$#" -eq 0 ] || { printf '### %s\n\n' "$title"; printf '%s\n' "$@"; printf '\n'; }; }
  section 'Breaking changes' "${breaking[@]}"
  section 'Added' "${added[@]}"
  section 'Fixed' "${fixed[@]}"
  remote=$(git remote get-url origin | sed -E 's#^git@github\.com:#https://github.com/#; s#\.git$##')
  printf 'Full diff: %s/compare/%s...%s\n' "$remote" "$last" "$tag"
} >"$notes"
template="$(git rev-parse --show-toplevel)/.github/release-notes.md"
content=$(<"$template")
[[ "$content" == *'{{CHANGES}}'* ]] || { echo 'Release template must contain {{CHANGES}}.' >&2; exit 1; }
changes=$(<"$notes")
shopt -u patsub_replacement 2>/dev/null || true
content=${content//'{{CHANGES}}'/$changes}
content=${content//'{{VERSION}}'/$tag}
printf '%s\n' "$content" >"$notes"
echo "$last -> $tag"
if [ "$dry_run" -eq 1 ]; then cat "$notes"; exit 0; fi
git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null 2>&1 && { echo "$tag already exists."; exit 0; }
gh release create "$tag" --target "$sha" --title "$tag" --notes-file "$notes"
