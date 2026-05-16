import { FiFileText } from "react-icons/fi";

import SupportPageShell from "../../components/customer/SupportPageShell.jsx";
import { TERMS_AND_CONDITIONS } from "../../data/customer/termsAndConditions.js";

export default function TermsAndConditionsPage() {
  return (
    <SupportPageShell
      icon={<FiFileText size={14} />}
      kicker="الالتزامات والضوابط"
      title={TERMS_AND_CONDITIONS.title}
      subtitle="هذه الصفحة توضح القواعد العامة لاستخدام المنصة، وإدارة الحسابات، والطلبات، والمحتوى، وحقوق المنصة والمستخدمين."
    >
      <div className="customer-panel px-5 py-5 sm:px-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">مقدمة</h2>
            <p className="mt-3 text-sm leading-8 text-slate-600">{TERMS_AND_CONDITIONS.intro}</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
            آخر تحديث: {TERMS_AND_CONDITIONS.lastUpdated}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {TERMS_AND_CONDITIONS.sections.map((section) => (
          <section key={section.title} className="customer-panel px-5 py-5 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <ul className="mt-4 space-y-3">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />
                  <span className="text-sm leading-7 text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SupportPageShell>
  );
}
