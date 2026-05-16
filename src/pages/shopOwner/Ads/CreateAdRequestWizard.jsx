import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiArrowLeft, FiArrowRight, FiCheck, FiLoader, FiUploadCloud, FiX } from "react-icons/fi";

import { mediaApi } from "../../../api/mediaApi";
import { adsApi, getShopId } from "./api";
import AdDetailsStep from "./AdDetailsStep";
import AdImageUploadStep from "./AdImageUploadStep";
import AdPreviewStep from "./AdPreviewStep";
import TemplateSelectionStep from "./TemplateSelectionStep";
import { extractApiError, fromDateTimeLocalValue, mapFieldErrors, useThemeContainer } from "./adsUtils";
import { compressImage, validateImageRatio } from "./imageRatioValidator";

const STEPS = ["اختيار القالب", "تفاصيل الإعلان", "الصورة والوسائط", "المعاينة والإرسال"];

const initialDraft = {
  templateId: null,
  title: "",
  startDate: "",
  endDate: "",
  adRequestImageUuid: "",
};

export default function CreateAdRequestWizard({
  open,
  onOpenChange,
  templates,
  templatesLoading,
  shopName,
  onCreated,
}) {
  const container = useThemeContainer();
  const fileInputRef = useRef(null);
  const [step,        setStep]        = useState(0);
  const [draft,       setDraft]       = useState(initialDraft);
  const [fileMeta,    setFileMeta]    = useState(null);
  const [ratioError,  setRatioError]  = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [errors,      setErrors]      = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDraft(initialDraft);
    setFileMeta(null);
    setRatioError("");
    setUploadError("");
    setUploading(false);
    setSubmitting(false);
    setErrors({});
    setSubmitError("");
  }, [open]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => String(item.adTemplateId) === String(draft.templateId)) || null,
    [templates, draft.templateId]
  );

  const previewUrl = fileMeta?.mediumFileUrl || fileMeta?.smallFileUrl || fileMeta?.originalFileUrl || "";

  const updateDraft = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSubmitError("");
  };

  const validateCurrentStep = () => {
    const nextErrors = {};

    if (step === 0 && !draft.templateId) {
      nextErrors.templateId = "اختر قالبًا واحدًا على الأقل.";
    }

    if (step === 1) {
      if (!draft.title.trim() || draft.title.trim().length < 2) {
        nextErrors.title = "العنوان يجب أن يتكون من حرفين على الأقل.";
      }

      const start = draft.startDate ? new Date(draft.startDate) : null;
      const end   = draft.endDate   ? new Date(draft.endDate)   : null;
      const now   = new Date();

      if (!start || Number.isNaN(start.getTime())) {
        nextErrors.startDate = "حدد تاريخ ووقت البداية.";
      } else if (start < new Date(now.getTime() - 60 * 1000)) {
        nextErrors.startDate = "يجب أن يكون وقت البداية حاضرًا أو مستقبليًا.";
      }

      if (!end || Number.isNaN(end.getTime())) {
        nextErrors.endDate = "حدد تاريخ ووقت النهاية.";
      } else if (end <= start) {
        nextErrors.endDate = "يجب أن يكون وقت النهاية بعد البداية.";
      }
    }

    if (step === 2) {
      if (!draft.adRequestImageUuid) nextErrors.adRequestImageUuid = "ارفع صورة الإعلان قبل المتابعة.";
      if (ratioError)                nextErrors.adRequestImageUuid = ratioError;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSelectTemplate = (template) => {
    updateDraft({ templateId: template.adTemplateId });
    setErrors((current) => ({ ...current, templateId: undefined }));
  };

  const handlePickImage   = () => fileInputRef.current?.click();
  const handleRemoveImage = () => {
    updateDraft({ adRequestImageUuid: "" });
    setFileMeta(null);
    setRatioError("");
    setUploadError("");
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedTemplate) return;

    setUploadError("");
    setRatioError("");
    setErrors((current) => ({ ...current, adRequestImageUuid: undefined }));

    if (!file.type.startsWith("image/")) {
      setUploadError("ملف الإعلان يجب أن يكون صورة.");
      return;
    }

    try {
      const ratioCheck = await validateImageRatio(file, selectedTemplate.imageRatio, 2);
      if (!ratioCheck.valid) {
        setRatioError(`يجب أن تكون أبعاد الصورة متوافقة مع نسبة القالب: ${selectedTemplate.imageRatio}`);
        return;
      }
    } catch (error) {
      setUploadError(error.message || "تعذر قراءة أبعاد الصورة.");
      return;
    }

    setUploading(true);
    try {
      const shopId       = getShopId();
      const compressed   = await compressImage(file);
      const uploadResp   = await mediaApi.uploadForStore(compressed, shopId);
      const fileId       = uploadResp?.data?.id;
      if (!fileId) throw new Error("تعذر الحصول على معرف الملف بعد الرفع.");

      const verifiedFile = await mediaApi.getStoreFileById(shopId, fileId);
      if (!verifiedFile?.mimeType?.startsWith("image/")) throw new Error("الملف المرفوع ليس صورة صالحة للإعلان.");

      updateDraft({ adRequestImageUuid: fileId });
      setFileMeta({
        ...verifiedFile,
        originalFileUrl: verifiedFile.originalFileUrl || uploadResp?.data?.originalFileUrl,
        mediumFileUrl:   verifiedFile.mediumFileUrl   || uploadResp?.data?.mediumFileUrl,
        smallFileUrl:    verifiedFile.smallFileUrl    || uploadResp?.data?.mediumFileUrl,
      });
    } catch (error) {
      setUploadError(error.message || "تعذر رفع صورة الإعلان.");
    } finally {
      setUploading(false);
    }
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    setStep((c) => Math.min(c + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((c) => Math.max(c - 1, 0));

  const handleSubmit = async () => {
    if (!validateCurrentStep() || uploading) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const created = await adsApi.createAdRequest({
        templateId:         Number(draft.templateId),
        shopId:             getShopId(),
        title:              draft.title.trim(),
        adRequestImageUuid: draft.adRequestImageUuid,
        startDate:          fromDateTimeLocalValue(draft.startDate),
        endDate:            fromDateTimeLocalValue(draft.endDate),
      });
      onCreated?.(created);
      onOpenChange?.(false);
    } catch (error) {
      setErrors(mapFieldErrors(error?.body?.errorCodes));
      setSubmitError(extractApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-80 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-81 flex flex-col max-h-[90vh] w-[min(1100px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-4xl border shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
          style={{ background: "var(--gray-2)", borderColor: "var(--gray-a5)" }}
        >
          {/* ── Header ── */}
          <div
            className="shrink-0 flex items-center justify-between border-b px-5 py-4"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
          >
            <div>
              <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>
                إنشاء طلب إعلان جديد
              </Dialog.Title>
              <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
                اختر القالب، أضف التفاصيل، وارفع الصورة قبل الإرسال.
              </p>
            </div>

            <Dialog.Close asChild>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-2xl transition"
                style={{ background: "var(--gray-a3)", color: "var(--gray-10)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gray-a4)"; e.currentTarget.style.color = "var(--gray-12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gray-a3)"; e.currentTarget.style.color = "var(--gray-10)"; }}
              >
                <FiX size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* ── Step indicators ── */}
          <div
            className="shrink-0 border-b px-5 py-4"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
          >
            <div className="grid gap-3 md:grid-cols-4">
              {STEPS.map((label, index) => {
                const active = index === step;
                const done   = index < step;

                const bg          = active ? "var(--blue-a3)"  : done ? "var(--green-a2)"  : "var(--gray-a2)";
                const border      = active ? "var(--blue-a6)"  : done ? "var(--green-a5)"  : "var(--gray-a5)";
                const labelColor  = active ? "var(--blue-11)"  : done ? "var(--green-11)"  : "var(--gray-11)";
                const badgeBg     = active ? "var(--blue-9)"   : done ? "var(--green-9)"   : "var(--gray-a4)";
                const badgeColor  = active || done ? "#fff"                                : "var(--gray-9)";

                return (
                  <div
                    key={label}
                    className="rounded-2xl border px-4 py-3"
                    style={{ background: bg, borderColor: border }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: labelColor }}>{label}</span>
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black"
                        style={{ background: badgeBg, color: badgeColor }}
                      >
                        {done ? <FiCheck size={14} /> : index + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* ── Step content ── */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-2">
            {step === 0 ? (
              <>
                <TemplateSelectionStep
                  templates={templates}
                  loading={templatesLoading}
                  selectedTemplateId={draft.templateId}
                  onSelect={handleSelectTemplate}
                />
                {errors.templateId ? (
                  <p className="mt-3 text-sm font-semibold" style={{ color: "var(--red-10)" }}>
                    {errors.templateId}
                  </p>
                ) : null}
              </>
            ) : null}

            {step === 1 ? (
              <AdDetailsStep
                template={selectedTemplate}
                values={draft}
                onChange={updateDraft}
                errors={errors}
              />
            ) : null}

            {step === 2 ? (
              <AdImageUploadStep
                template={selectedTemplate}
                previewUrl={previewUrl}
                fileMeta={fileMeta}
                ratioError={ratioError || errors.adRequestImageUuid}
                uploadError={uploadError}
                uploading={uploading}
                onPickImage={handlePickImage}
                onRemoveImage={handleRemoveImage}
              />
            ) : null}

            {step === 3 ? (
              <AdPreviewStep
                template={selectedTemplate}
                draft={{
                  ...draft,
                  startDate: fromDateTimeLocalValue(draft.startDate),
                  endDate:   fromDateTimeLocalValue(draft.endDate),
                }}
                fileMeta={fileMeta}
                shopName={shopName}
              />
            ) : null}

            {submitError ? (
              <div
                className="mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{ background: "var(--red-a3)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}
              >
                {submitError}
              </div>
            ) : null}
          </div>

          {/* ── Footer ── */}
          <div
            className="shrink-0 flex items-center justify-between border-t px-5 py-4"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
          >
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)", color: "var(--gray-11)" }}
              onMouseEnter={(e) => { if (step > 0) e.currentTarget.style.borderColor = "var(--gray-a7)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gray-a5)"; }}
            >
              <FiArrowRight size={16} />
              السابق
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                التالي
                <FiArrowLeft size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <FiLoader className="animate-spin" size={16} /> : <FiUploadCloud size={16} />}
                إرسال طلب الإعلان
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
