export function formatSectionItem(item) {
  if (item == null) return "";
  if (typeof item === "string" || typeof item === "number") return String(item).trim();
  if (typeof item === "object") {
    const label = String(item.label ?? item.title ?? item.name ?? "").trim();
    const value = String(item.value ?? item.text ?? item.point ?? item.description ?? "").trim();
    if (label && value && label !== value) return `${label} · ${value}`;
    return value || label;
  }
  return String(item).trim();
}

export function normalizeSectionItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map(formatSectionItem)
    .filter((value) => value && !["null", "undefined", "[object Object]"].includes(value));
}
