export function normalizeSearchQuery(query) {
  return (query || '').trim().toLowerCase();
}

export function matchesNameSearch(item, query, fields = ['full_name', 'username']) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return true;
  return fields.some((field) => {
    const value = normalizeSearchQuery(item?.[field]);
    return value.includes(normalized);
  });
}
