import { useEffect, useRef, useState } from "react";
import { FiTag, FiX } from "react-icons/fi";

export default function TagsInput({
  label,
  tags,
  onChange,
  error = "",
  hint = "",
  loadSuggestions,
}) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(value) {
    const normalized = value.trim();
    if (!normalized) return;
    if (tags.some((tag) => tag.name.toLowerCase() === normalized.toLowerCase())) return;
    onChange([...tags, { name: normalized }]);
    setInput("");
    setSuggestions([]);
    setOpen(false);
  }

  function removeTag(name) {
    onChange(tags.filter((tag) => tag.name !== name));
  }

  function handleInputChange(value) {
    setInput(value);
    setOpen(true);
    clearTimeout(debounceRef.current);

    if (!value.trim() || !loadSuggestions) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const next = await loadSuggestions(value.trim());
        setSuggestions(
          (next || []).filter(
            (item) => !tags.some((tag) => tag.name.toLowerCase() === item.name.toLowerCase())
          )
        );
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  return (
    <div className="space-y-1.5" ref={wrapRef}>
      {label ? (
        <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
          {label}
        </label>
      ) : null}

      <div className="relative">
        <div
          className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-2xl border px-3 py-2.5"
          style={{
            background: "var(--gray-1)",
            borderColor: error ? "var(--red-8)" : "var(--gray-a6)",
          }}
        >
          {tags.map((tag) => (
            <span
              key={tag.name}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
            >
              <FiTag size={11} />
              {tag.name}
              <button type="button" onClick={() => removeTag(tag.name)} className="opacity-80 hover:opacity-100">
                <FiX size={11} />
              </button>
            </span>
          ))}

          <input
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag(input);
              } else if (event.key === "Backspace" && !input && tags.length) {
                removeTag(tags[tags.length - 1].name);
              }
            }}
            placeholder={tags.length ? "" : "اكتب وسمًا واضغط Enter"}
            className="min-w-[160px] flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--gray-12)" }}
          />
        </div>

        {open && (loading || suggestions.length > 0) ? (
          <div
            className="absolute inset-x-0 top-full z-[60] mt-2 rounded-2xl border p-2 shadow-xl"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
          >
            {loading ? (
              <p className="px-3 py-2 text-sm" style={{ color: "var(--gray-9)" }}>
                جارٍ البحث...
              </p>
            ) : (
              suggestions.map((item) => (
                <button
                  key={item.id || item.name}
                  type="button"
                  onMouseDown={() => addTag(item.name)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors"
                  style={{ color: "var(--gray-12)" }}
                >
                  <span>{item.name}</span>
                  <FiTag size={12} style={{ color: "var(--gray-9)" }} />
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs" style={{ color: "var(--red-10)" }}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs" style={{ color: "var(--gray-9)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
