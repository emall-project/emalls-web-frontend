import { calculateBillableHours, calculateEstimatedTotal, formatUsd } from "./adsUtils";
import { DatePickerInput } from "./DatePickerInput";

export default function AdDetailsStep({ template, values, onChange, errors = {} }) {
  const durationHours  = calculateBillableHours(values.startDate, values.endDate);
  const estimatedTotal = calculateEstimatedTotal(template?.pricePerHour, values.startDate, values.endDate);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>تفاصيل الإعلان</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
          أدخل عنوان الإعلان وحدد فترة ظهوره. لا يمكن تعديل التاريخ بعد إرسال الطلب.
        </p>
      </div>

      <div className="grid gap-4">
        <Field
          label="عنوان الإعلان"
          required
          value={values.title}
          onChange={(v) => onChange?.({ title: v })}
          placeholder="مثال: خصم خاص على تشكيلة الصيف"
          error={errors.title}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <DatePickerInput
            label="تاريخ ووقت البداية"
            required
            type="datetime-local"
            value={values.startDate}
            onChange={(v) => onChange?.({ startDate: v })}
            error={errors.startDate}
          />

          <DatePickerInput
            label="تاريخ ووقت النهاية"
            required
            type="datetime-local"
            value={values.endDate}
            onChange={(v) => onChange?.({ endDate: v })}
            error={errors.endDate}
            min={values.startDate}
          />
        </div>
      </div>

      {/* Cost summary */}
      <div
        className="grid gap-4 rounded-3xl border p-4 md:grid-cols-3"
        style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
      >
        <Summary label="سعر الساعة"     value={formatUsd(template?.pricePerHour)} />
        <Summary label="المدة التقديرية" value={durationHours ? `${durationHours} ساعة` : "—"} />
        <Summary label="السعر التقديري" value={estimatedTotal ? formatUsd(estimatedTotal) : "—"} accent />
      </div>

      <p
        className="rounded-2xl border px-4 py-3 text-sm leading-7"
        style={{ background: "var(--blue-a3)", borderColor: "var(--blue-a5)", color: "var(--blue-11)" }}
      >
        السعر النهائي يتم تأكيده من الخادم بعد الإرسال، ويُحتسب على أساس أن أي ساعة تبدأ تُحسب ساعة كاملة.
      </p>
    </div>
  );
}

function Field({ label, error, required, onChange, ...props }) {
  return (
    <label className="flex flex-col gap-1.5 text-right">
      <span className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
        {label}
        {required ? <span style={{ color: "var(--red-9)" }}> *</span> : null}
      </span>
      <input
        {...props}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-12 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition"
        style={{
          background:   "var(--gray-a2)",
          borderColor:  error ? "var(--red-7)" : "var(--gray-a5)",
          color:        "var(--gray-12)",
        }}
        onFocus={(e)  => (e.currentTarget.style.borderColor = error ? "var(--red-7)" : "var(--blue-7)")}
        onBlur={(e)   => (e.currentTarget.style.borderColor = error ? "var(--red-7)" : "var(--gray-a5)")}
      />
      {error ? <p className="text-xs font-semibold" style={{ color: "var(--red-9)" }}>{error}</p> : null}
    </label>
  );
}

function Summary({ label, value, accent = false }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>{label}</p>
      <p className="mt-2 text-base font-black" style={{ color: accent ? "var(--blue-9)" : "var(--gray-12)" }}>
        {value}
      </p>
    </div>
  );
}
