import React from "react";
import { FiArrowLeft } from "react-icons/fi";

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  onViewAll,
  actionLabel = "عرض الكل",
  compact = false,
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${compact ? "" : "md:gap-6"}`}>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(27,79,240,0.12)] bg-white/80 px-3 py-1 text-[11px] font-extrabold text-[var(--customer-accent)] shadow-[var(--customer-shadow-soft)]">
            {eyebrow}
          </div>
        ) : null}

        <h2 className="text-[1.55rem] font-black leading-[1.2] tracking-tight text-[var(--customer-text)] md:text-[1.9rem]">
          {title}
        </h2>

        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-8 text-[var(--customer-muted)] md:text-[0.95rem]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {onViewAll ? (
        <button
          type="button"
          onClick={onViewAll}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--customer-border)] bg-white/90 px-4 py-2 text-sm font-bold text-[var(--customer-text)] shadow-[var(--customer-shadow-soft)] hover:border-[rgba(27,79,240,0.18)] hover:text-[var(--customer-accent)]"
        >
          {actionLabel}
          <FiArrowLeft className="text-sm transition-transform group-hover:-translate-x-0.5" />
        </button>
      ) : null}
    </div>
  );
}
