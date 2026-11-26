export function buildOwnerSearchPath(name) {
  return `/proprietario?nome=${encodeURIComponent(String(name ?? '').trim())}`;
}
