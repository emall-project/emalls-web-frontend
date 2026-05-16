import { useState, useMemo, useCallback } from "react";

function getVal(obj, path) {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

function cmp(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean") return a === b ? 0 : a ? 1 : -1;
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const d = (Number(a[i]) || 0) - (Number(b[i]) || 0);
      if (d !== 0) return d;
    }
    return 0;
  }
  return String(a).localeCompare(String(b), "ar", { sensitivity: "base" });
}

export function useSortedData(data, defaultKey = null, defaultDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  const onSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else setSortDir("asc");
      return key;
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sortKey || !Array.isArray(data) || data.length === 0) return data ?? [];
    return [...data].sort((a, b) => {
      const av = getVal(a, sortKey);
      const bv = getVal(b, sortKey);
      const result = cmp(av, bv);
      return sortDir === "asc" ? result : -result;
    });
  }, [data, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, onSort };
}

export function SortableTh({ label, sortKey, currentKey, direction, onSort, className = "", style = {} }) {
  const isActive = currentKey === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`cursor-pointer select-none transition-colors ${className}`}
      style={{
        ...style,
        color: isActive ? "var(--gray-12)" : (style.color ?? "var(--gray-10)"),
        userSelect: "none",
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span style={{ fontSize: 9, opacity: isActive ? 0.75 : 0.3 }}>
          {isActive ? (direction === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </span>
    </th>
  );
}

export function SortableSpan({ label, sortKey, currentKey, direction, onSort, className = "", style = {} }) {
  const isActive = currentKey === sortKey;
  return (
    <span
      onClick={() => onSort(sortKey)}
      className={`cursor-pointer select-none transition-colors inline-flex items-center gap-1 ${className}`}
      style={{
        ...style,
        color: isActive ? "var(--gray-12)" : (style.color ?? "var(--gray-10)"),
        userSelect: "none",
      }}
    >
      {label}
      <span style={{ fontSize: 9, opacity: isActive ? 0.75 : 0.3 }}>
        {isActive ? (direction === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </span>
  );
}
