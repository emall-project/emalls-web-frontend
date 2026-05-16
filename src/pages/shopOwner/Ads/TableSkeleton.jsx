export default function TableSkeleton({ rows = 5 }) {
  return (
    <div
      className="overflow-hidden rounded-[28px] border shadow-sm"
      style={{
        borderColor: "var(--gray-a5)",
        background: "var(--gray-1)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        className="grid grid-cols-[1.1fr_1.2fr_1fr_1fr_1fr_0.9fr_0.9fr_0.8fr_0.8fr_0.7fr] gap-4 border-b px-5 py-4"
        style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}
      >
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="h-4 animate-pulse rounded-full" style={{ background: "var(--gray-a5)" }} />
        ))}
      </div>

      <div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[1.1fr_1.2fr_1fr_1fr_1fr_0.9fr_0.9fr_0.8fr_0.8fr_0.7fr] gap-4 px-5 py-5"
            style={{ borderTop: rowIndex === 0 ? "none" : "1px solid var(--gray-a4)" }}
          >
            {Array.from({ length: 10 }).map((__, cellIndex) => (
              <div
                key={cellIndex}
                className={`animate-pulse rounded-full ${cellIndex === 0 ? "h-16" : "h-4 self-center"}`}
                style={{ background: "var(--gray-a5)" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
