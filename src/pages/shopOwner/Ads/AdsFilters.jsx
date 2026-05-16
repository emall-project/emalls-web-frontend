import { FiCreditCard, FiPlus, FiRefreshCw } from "react-icons/fi";

import {
  DISPLAY_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  REQUEST_STATUS_TABS,
} from "./adsUtils";
import { DatePickerInput } from "./DatePickerInput";

export default function AdsFilters({
  statusTab,
  onStatusTabChange,
  filters,
  templates,
  onFiltersChange,
  onReset,
  onRefresh,
  onCreate,
  onOpenPayments,
}) {
  return (
    <section className="space-y-4">
      <div
        className="rounded-[28px] border p-4 shadow-sm sm:p-5"
        style={{
          background: "var(--gray-1)",
          borderColor: "var(--gray-a5)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--gray-12)" }}>
                الإعلانات
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
                إدارة طلبات إعلانات متجرك ومتابعة حالتها والدفع.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {REQUEST_STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onStatusTabChange?.(tab.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    statusTab === tab.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border bg-transparent hover:text-blue-600"
                  }`}
                  style={
                    statusTab === tab.value
                      ? undefined
                      : {
                          borderColor: "var(--gray-a5)",
                          background: "var(--gray-2)",
                          color: "var(--gray-11)",
                        }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <FiPlus size={16} />
              إنشاء إعلان جديد
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:text-blue-600"
              style={{
                borderColor: "var(--gray-a5)",
                background: "var(--gray-2)",
                color: "var(--gray-11)",
              }}
            >
              <FiRefreshCw size={15} />
              تحديث
            </button>

            <button
              type="button"
              onClick={onOpenPayments}
              className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:text-blue-600"
              style={{
                borderColor: "var(--gray-a5)",
                background: "var(--gray-2)",
                color: "var(--gray-11)",
              }}
            >
              <FiCreditCard size={15} />
              سجل المدفوعات
            </button>
          </div>
        </div>
      </div>

      <div
        className="grid gap-3 rounded-[28px] border p-4 shadow-sm md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        style={{
          background: "var(--gray-1)",
          borderColor: "var(--gray-a5)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <FilterSelect
          label="حالة الدفع"
          value={filters.paymentStatus}
          options={PAYMENT_STATUS_OPTIONS}
          onChange={(value) => onFiltersChange?.({ paymentStatus: value })}
        />

        <FilterSelect
          label="حالة العرض"
          value={filters.displayStatus}
          options={DISPLAY_STATUS_OPTIONS}
          onChange={(value) => onFiltersChange?.({ displayStatus: value })}
        />

        <FilterSelect
          label="القالب"
          value={filters.templateId}
          options={[
            { value: "ALL", label: "كل القوالب" },
            ...templates.map((template) => ({
              value: String(template.adTemplateId),
              label: template.name,
            })),
          ]}
          onChange={(value) => onFiltersChange?.({ templateId: value })}
        />

        <DatePickerInput
          label="بداية الإعلان من"
          value={filters.startFrom}
          onChange={(value) => onFiltersChange?.({ startFrom: value })}
        />
        <DatePickerInput
          label="بداية الإعلان إلى"
          value={filters.startTo}
          onChange={(value) => onFiltersChange?.({ startTo: value })}
        />
        <DatePickerInput
          label="نهاية الإعلان من"
          value={filters.endFrom}
          onChange={(value) => onFiltersChange?.({ endFrom: value })}
        />
        <DatePickerInput
          label="نهاية الإعلان إلى"
          value={filters.endTo}
          onChange={(value) => onFiltersChange?.({ endTo: value })}
        />

        <div className="flex items-end md:col-span-2 xl:col-span-3 2xl:col-span-1">
          <button
            type="button"
            onClick={onReset}
            className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold transition"
            style={{
              borderColor: "var(--gray-a5)",
              background: "var(--gray-a3)",
              color: "var(--gray-11)",
            }}
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      </div>
    </section>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="space-y-1.5 text-right">
      <span className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-12 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:border-blue-300"
        style={{
          borderColor: "var(--gray-a5)",
          background: "var(--gray-a2)",
          color: "var(--gray-12)",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

