import { FiAlertCircle } from "react-icons/fi";
import ProductPreviewCard from "./ProductPreviewCard";

export default function ProductPreviewStep({ form, categories, brands, validationSummary = "" }) {
  return (
    <div className="space-y-5">
      {validationSummary ? (
        <div
          className="flex items-center gap-2 rounded-[24px] border px-4 py-3 text-sm"
          style={{ background: "var(--amber-a2)", borderColor: "var(--amber-a5)", color: "var(--amber-11)" }}
        >
          <FiAlertCircle size={15} />
          {validationSummary}
        </div>
      ) : null}

      <ProductPreviewCard form={form} categories={categories} brands={brands} />
    </div>
  );
}
