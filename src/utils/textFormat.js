export function withoutEllipsis(value) {
  return String(value || '')
    .replace(/(?:…|\.{3,})+/g, '')
    .trim()
}
