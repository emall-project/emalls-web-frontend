export default function ComingSoon({ title }) {
  return (
    <div dir="rtl" className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6"
        style={{ background: "var(--blue-a3)" }}
      >
        🚧
      </div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--gray-12)" }}>
        {title}
      </h1>
      <p className="text-sm" style={{ color: "var(--gray-10)" }}>
        هذه الصفحة قيد التطوير وستكون متاحة قريباً
      </p>
    </div>
  );
}
