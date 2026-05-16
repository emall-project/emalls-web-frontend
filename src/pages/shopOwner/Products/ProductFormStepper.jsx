import { FiCheck } from "react-icons/fi";

export default function ProductFormStepper({ steps, currentStep, stepErrors = {}, onStepClick }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div
      className="rounded-[32px] border p-4 lg:p-5"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
        borderColor: "var(--gray-a5)",
      }}
    >
      <div className="grid gap-3 xl:grid-cols-5">
        {steps.map((step, index) => {
          const active = step.id === currentStep;
          const completed = index < currentIndex;
          const hasError = Boolean(stepErrors[step.id]);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className="group relative overflow-hidden rounded-[26px] border px-4 py-4 text-right transition-all duration-200 hover:-translate-y-0.5"
              style={{
                minHeight: 148,
                background: active
                  ? "linear-gradient(180deg, rgba(37,99,235,0.18), rgba(37,99,235,0.08))"
                  : completed
                    ? "linear-gradient(180deg, rgba(34,197,94,0.12), rgba(34,197,94,0.03))"
                    : "var(--gray-a2)",
                borderColor: hasError
                  ? "var(--red-a6)"
                  : active
                    ? "rgba(59,130,246,0.55)"
                    : completed
                      ? "rgba(34,197,94,0.35)"
                      : "var(--gray-a5)",
                boxShadow: active ? "0 18px 40px rgba(37,99,235,0.12)" : "0 8px 20px rgba(15,23,42,0.04)",
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background: hasError
                    ? "var(--red-9)"
                    : active
                      ? "var(--blue-9)"
                      : completed
                        ? "var(--green-9)"
                        : "transparent",
                }}
              />

              <div className="flex h-full flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <p
                      className="text-[11px] font-bold"
                      style={{
                        color: hasError
                          ? "var(--red-10)"
                          : active
                            ? "var(--blue-10)"
                            : completed
                              ? "var(--green-10)"
                              : "var(--gray-8)",
                      }}
                    >
                      {hasError ? "تحتاج مراجعة" : active ? "الخطوة الحالية" : completed ? "تمت المراجعة" : "خطوة قادمة"}
                    </p>
                    <h3 className="text-base font-bold leading-7" style={{ color: "var(--gray-12)" }}>
                      {step.title}
                    </h3>
                  </div>

                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                    style={{
                      background: hasError
                        ? "var(--red-9)"
                        : active
                          ? "var(--blue-9)"
                          : completed
                            ? "var(--green-9)"
                            : "var(--gray-a4)",
                      color: "#fff",
                    }}
                  >
                    {completed ? <FiCheck size={15} /> : index + 1}
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs leading-6" style={{ color: "var(--gray-9)" }}>
                    {step.description}
                  </p>

                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: active || completed ? "rgba(59,130,246,0.10)" : "var(--gray-a4)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: completed ? "100%" : active ? "64%" : "18%",
                        background: hasError
                          ? "var(--red-9)"
                          : active
                            ? "var(--blue-9)"
                            : completed
                              ? "var(--green-9)"
                              : "var(--gray-a6)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
