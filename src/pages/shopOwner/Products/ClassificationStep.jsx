import { FiLayers, FiPlus, FiTag, FiUsers } from "react-icons/fi";
import { RxSelect } from "../../../components/shopOwner/ui/RxSelect";
import { AGE_GROUP_OPTIONS, AUDIENCE_OPTIONS } from "./constants";
import SearchableCombobox from "./SearchableCombobox";
import TagsInput from "./TagsInput";

function AudienceBadge({ label }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
      style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}
    >
      {label}
    </span>
  );
}

export default function ClassificationStep({
  form,
  categories,
  brands,
  errors,
  onFieldChange,
  onTagsChange,
  loadTagSuggestions,
  canCreateBrand = false,
  onCreateBrandClick,
}) {
  const selectedCategory = categories.find((category) => String(category.id) === String(form.categoryId));
  const selectedBrand = brands.find((brand) => String(brand.id) === String(form.brandId));

  const categoryOptions = categories.map((category) => ({
    value: String(category.id),
    label: category.name,
    searchText: `${category.slug || ""} ${category.targetedAudience || ""} ${category.ageGroup || ""}`,
  }));

  const brandOptions = brands.map((brand) => ({
    value: String(brand.id),
    label: brand.name,
    searchText: `${brand.slug || ""} ${brand.targetedAudience || ""} ${brand.ageGroup || ""}`,
  }));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_340px]">
      <div className="space-y-5">
        <section className="rounded-[30px] border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}>
              <FiLayers size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                التصنيف والجمهور
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--gray-9)" }}>
                اختر الفئة والماركة المناسبة، ثم حدّد الجمهور والفئة العمرية المتوافقة معهما بحسب قواعد
                الخادم.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <SearchableCombobox
              label="الفئة"
              value={form.categoryId}
              onChange={(value) => onFieldChange("categoryId", value)}
              options={categoryOptions}
              placeholder="ابحث عن الفئة"
              error={errors.categoryId}
              hint="الفئات تُحمّل من الخادم فقط ولا يمكن إنشاؤها من هذه الشاشة."
            />

            <div className="space-y-3">
              <SearchableCombobox
                label="الماركة"
                value={form.brandId}
                onChange={(value) => onFieldChange("brandId", value)}
                options={brandOptions}
                placeholder="ابحث عن الماركة"
                error={errors.brandId}
                hint={
                  canCreateBrand
                    ? "اختر ماركة موجودة أو أنشئ ماركة جديدة من نفس الخطوة."
                    : "يمكنك اختيار ماركة موجودة فقط. إنشاء الماركات متاح للأدمن حسب صلاحيات الخادم."
                }
              />

              {canCreateBrand ? (
                <button
                  type="button"
                  onClick={onCreateBrandClick}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    background: "var(--blue-a2)",
                    borderColor: "var(--blue-a5)",
                    color: "var(--blue-11)",
                  }}
                >
                  <FiPlus size={14} />
                  إضافة ماركة جديدة
                </button>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                الجمهور المستهدف
              </label>
              <RxSelect
                value={form.targetedAudience}
                onValueChange={(value) => onFieldChange("targetedAudience", value)}
                options={AUDIENCE_OPTIONS}
                placeholder="اختر الجمهور"
                error={Boolean(errors.targetedAudience)}
              />
              {errors.targetedAudience ? (
                <p className="text-xs" style={{ color: "var(--red-10)" }}>
                  {errors.targetedAudience}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                الفئة العمرية
              </label>
              <RxSelect
                value={form.ageGroup}
                onValueChange={(value) => onFieldChange("ageGroup", value)}
                options={AGE_GROUP_OPTIONS}
                placeholder="اختر الفئة العمرية"
                error={Boolean(errors.ageGroup)}
              />
              {errors.ageGroup ? (
                <p className="text-xs" style={{ color: "var(--red-10)" }}>
                  {errors.ageGroup}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}>
              <FiTag size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                الوسوم
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--gray-9)" }}>
                أضف وسومًا مفيدة للبحث الداخلي والتنظيم. عند الحفظ سيقوم الخادم بإنشاء الوسوم غير
                الموجودة تلقائيًا.
              </p>
            </div>
          </div>

          <TagsInput
            label="وسوم المنتج"
            tags={form.tags}
            onChange={onTagsChange}
            loadSuggestions={loadTagSuggestions}
            hint="اضغط Enter بعد كتابة كل وسم، ويمكنك إزالة أي وسم لاحقًا."
          />
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-0 xl:self-start">
        <section
          className="rounded-[30px] border p-6"
          style={{
            background: "linear-gradient(180deg, var(--blue-a2), var(--gray-1))",
            borderColor: "var(--blue-a5)",
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "var(--gray-1)", color: "var(--blue-10)" }}>
              <FiUsers size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                ملخص التوافق
              </h3>
              <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                يطبّق الخادم نفس هذا التوافق أثناء الإنشاء.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border px-4 py-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
                الفئة المختارة
              </p>
              <p className="mt-2 text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                {selectedCategory?.name || "لم يتم اختيار فئة بعد"}
              </p>
              {selectedCategory ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <AudienceBadge
                    label={`الجمهور: ${
                      AUDIENCE_OPTIONS.find((item) => item.value === selectedCategory.targetedAudience)?.label ||
                      "غير محدد"
                    }`}
                  />
                  <AudienceBadge
                    label={`العمر: ${
                      AGE_GROUP_OPTIONS.find((item) => item.value === selectedCategory.ageGroup)?.label ||
                      "غير محدد"
                    }`}
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border px-4 py-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
                الماركة المختارة
              </p>
              <p className="mt-2 text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                {selectedBrand?.name || "لم يتم اختيار ماركة بعد"}
              </p>
              {selectedBrand ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <AudienceBadge
                    label={`الجمهور: ${
                      AUDIENCE_OPTIONS.find((item) => item.value === selectedBrand.targetedAudience)?.label ||
                      "غير محدد"
                    }`}
                  />
                  <AudienceBadge
                    label={`العمر: ${
                      AGE_GROUP_OPTIONS.find((item) => item.value === selectedBrand.ageGroup)?.label ||
                      "غير محدد"
                    }`}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
