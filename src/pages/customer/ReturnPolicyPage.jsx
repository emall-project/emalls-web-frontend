import { FiAlertTriangle, FiCheckCircle, FiClock, FiRotateCcw } from "react-icons/fi";

import SupportPageShell from "../../components/customer/SupportPageShell.jsx";
import { RETURN_POLICY } from "../../data/customer/returnPolicy.js";

function getSectionAccent(type) {
  if (type === "list-accepted") {
    return {
      chip: "border-green-200 bg-green-50 text-green-700",
      marker: "bg-green-100 text-green-700",
    };
  }

  if (type === "list-rejected") {
    return {
      chip: "border-red-200 bg-red-50 text-red-700",
      marker: "bg-red-100 text-red-700",
    };
  }

  if (type === "steps") {
    return {
      chip: "border-blue-200 bg-blue-50 text-blue-700",
      marker: "bg-blue-100 text-blue-700",
    };
  }

  return {
    chip: "border-slate-200 bg-slate-50 text-slate-600",
    marker: "bg-slate-100 text-slate-600",
  };
}

function renderSectionBody(section) {
  if (section.content) {
    return <p className="text-sm leading-8 text-slate-600">{section.content}</p>;
  }

  if (!Array.isArray(section.items) || !section.items.length) {
    return null;
  }

  const accent = getSectionAccent(section.type);

  if (section.type === "steps") {
    return (
      <ol className="space-y-3">
        {section.items.map((item, index) => (
          <li key={item} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${accent.marker}`}
            >
              {index + 1}
            </span>
            <span className="text-sm leading-7 text-slate-600">{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul className="space-y-3">
      {section.items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${accent.marker}`}
          />
          <span className="text-sm leading-7 text-slate-600">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReturnPolicyPage() {
  return (
    <SupportPageShell
      icon={<FiRotateCcw size={14} />}
      kicker="حقوق الإرجاع"
      title={RETURN_POLICY.title}
      subtitle="تفاصيل المدة المسموحة، الحالات المقبولة، الحالات غير المقبولة، وخطوات تقديم طلب الإرجاع داخل المنصة."
    >
      <div className="mb-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="customer-panel px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">نظرة سريعة</h2>
          <p className="mt-3 text-sm leading-8 text-slate-600">
            يمكنك تقديم طلب إرجاع من داخل طلباتك إذا كان العنصر ما زال ضمن فترة الإرجاع المعتمدة وبعد
            إرفاق سبب واضح وصورة توضيحية.
          </p>
        </div>

        <div className="customer-panel px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <FiClock size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">المهلة المعتمدة</p>
              <p className="mt-1 text-base font-bold text-slate-900">{RETURN_POLICY.deadline}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {RETURN_POLICY.sections.map((section) => {
          const accent = getSectionAccent(section.type);

          return (
            <section key={section.title} className="customer-panel px-5 py-5 sm:px-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                {section.type === "list-accepted" ? (
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${accent.chip}`}>
                    <FiCheckCircle className="ml-1 inline text-sm" />
                    مقبول
                  </span>
                ) : null}
                {section.type === "list-rejected" ? (
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${accent.chip}`}>
                    <FiAlertTriangle className="ml-1 inline text-sm" />
                    غير مقبول
                  </span>
                ) : null}
              </div>

              {renderSectionBody(section)}
            </section>
          );
        })}
      </div>
    </SupportPageShell>
  );
}
