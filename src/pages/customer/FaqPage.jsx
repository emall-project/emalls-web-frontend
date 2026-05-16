import { FiChevronDown, FiHelpCircle } from "react-icons/fi";

import SupportPageShell from "../../components/customer/SupportPageShell.jsx";
import { FAQ_DATA } from "../../data/customer/faqData.js";

export default function FaqPage() {
  return (
    <SupportPageShell
      icon={<FiHelpCircle size={14} />}
      kicker="الدعم والمساعدة"
      title="الأسئلة الشائعة"
      subtitle="إجابات مختصرة وواضحة على أكثر الأسئلة التي يطرحها العملاء حول الحسابات والطلبات والتوصيل والمتاجر."
    >
      <div className="space-y-6">
        {FAQ_DATA.map((group) => (
          <section key={group.category} className="customer-panel px-5 py-5 sm:px-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{group.category}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {group.questions.length} {group.questions.length === 1 ? "سؤال" : "أسئلة"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {group.questions.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-3xl border border-slate-200 bg-white open:border-slate-300"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                    <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                    <FiChevronDown className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-slate-100 px-5 py-4 text-sm leading-8 text-slate-600">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SupportPageShell>
  );
}
