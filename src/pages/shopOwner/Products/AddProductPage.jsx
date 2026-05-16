import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Toast from "@radix-ui/react-toast";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiRefreshCw,
  FiSave,
} from "react-icons/fi";
import { auth } from "../../../api/auth";
import { mediaApi } from "../../../api/mediaApi";
import { PRODUCT_FORM_STEPS } from "./constants";
import { productsApi } from "./api";
import AddProductHeader from "./AddProductHeader";
import BasicInfoStep from "./BasicInfoStep";
import BrandCreateDialog from "./BrandCreateDialog";
import ClassificationStep from "./ClassificationStep";
import ProductFormStepper from "./ProductFormStepper";
import ProductMediaStep from "./ProductMediaStep";
import ProductPreviewStep from "./ProductPreviewStep";
import VariantEditorStep from "./VariantEditorStep";
import {
  ACCEPTED_MEDIA_TYPES,
  MAX_PRODUCT_IMAGES,
  buildCartesianVariants,
  buildCreateProductPayload,
  createInitialProductForm,
  createVariant,
  extractCollection,
  hasUnsavedChanges,
  mapBackendErrors,
  moveArrayItem,
  slugifyProductName,
  validateProductForm,
} from "./productFormUtils";

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" />;
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-[28px] border ${className}`.trim()}
      style={{ background: "var(--gray-a3)", borderColor: "var(--gray-a4)" }}
    />
  );
}

function LoadingState() {
  return (
    <div className="space-y-5" dir="rtl">
      <SkeletonBlock className="h-[104px]" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <SkeletonBlock className="h-[420px]" />
          <SkeletonBlock className="h-[260px]" />
        </div>
        <div className="space-y-5">
          <SkeletonBlock className="h-[220px]" />
          <SkeletonBlock className="h-[200px]" />
        </div>
      </div>
    </div>
  );
}

function getFieldStep(field) {
  if (["name", "slug", "shortDescription", "description", "isActive"].includes(field)) return "basic";
  if (["categoryId", "brandId", "targetedAudience", "ageGroup", "tags"].includes(field)) return "classification";
  if (field === "productMedia") return "media";
  if (field === "variants" || field.startsWith("variants.")) return "variants";
  return "preview";
}

function filterErrorsForStep(errors, stepId) {
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => getFieldStep(field) === stepId)
  );
}

function getFirstErroredStep(stepErrors) {
  return PRODUCT_FORM_STEPS.find((step) => stepErrors[step.id])?.id || PRODUCT_FORM_STEPS[0].id;
}

export default function AddProductPage() {
  const navigate = useNavigate();
  const shopId = useMemo(() => auth.getShopId() ?? 1, []);
  const canCreateBrand = useMemo(() => auth.getUser()?.role === "ROLE_ADMIN", []);

  const [currentStep, setCurrentStep] = useState(PRODUCT_FORM_STEPS[0].id);
  const [form, setForm] = useState(createInitialProductForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [stepErrors, setStepErrors] = useState({});
  const [summaryError, setSummaryError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastState, setToastState] = useState({ title: "", message: "", tone: "success" });
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

  const pendingNavigationRef = useRef(null);

  const showToast = useCallback((title, message, tone = "success") => {
    setToastState({ title, message, tone });
    setToastOpen(false);
    requestAnimationFrame(() => setToastOpen(true));
  }, []);

  const loadReferenceData = useCallback(async () => {
    setLoadingReferences(true);
    setLoadingError("");

    try {
      const [categoriesResponse, brandsResponse, attributesResponse] = await Promise.all([
        productsApi.getCategoriesAll(),
        productsApi.getBrands(),
        productsApi.getAttributes(),
      ]);

      setCategories(extractCollection(categoriesResponse));
      setBrands(extractCollection(brandsResponse));
      setAttributes(extractCollection(attributesResponse));
    } catch (error) {
      setLoadingError(error.message || "تعذر تحميل بيانات الفئات والماركات والخصائص");
    } finally {
      setLoadingReferences(false);
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges(form)) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form]);

  const uploadedMedia = useMemo(
    () => form.productMedia.filter((item) => item.status === "uploaded" && item.id),
    [form.productMedia]
  );
  const isUploadingMedia = form.productMedia.some((item) => item.status === "uploading");
  const hasMediaFailures = form.productMedia.some((item) => item.status === "error");
  const dirty = hasUnsavedChanges(form);

  const handleBrandCreated = useCallback(
    (createdBrand) => {
      if (!createdBrand?.id) return;
      setBrands((prev) => {
        if (prev.some((brand) => String(brand.id) === String(createdBrand.id))) return prev;
        return [createdBrand, ...prev];
      });
      setForm((prev) => ({ ...prev, brandId: String(createdBrand.id) }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.brandId;
        return next;
      });
      showToast("تمت إضافة الماركة", "أصبحت الماركة الجديدة متاحة وتم اختيارها داخل النموذج.", "success");
    },
    [showToast]
  );

  function applyValidation(validation, preferredSummary = "") {
    setFieldErrors(validation.errors);
    setStepErrors(validation.stepErrors);
    setSummaryError(preferredSummary);
  }

  function handleTopFieldChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSummaryError("");
  }

  function handleNameChange(value) {
    setForm((prev) => {
      const generatedSlug = slugifyProductName(value);
      const previousGenerated = slugifyProductName(prev.name);
      const shouldUpdateSlug = !slugTouched || prev.slug === previousGenerated;

      return {
        ...prev,
        name: value,
        slug: shouldUpdateSlug ? generatedSlug : prev.slug,
      };
    });

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.name;
      delete next.slug;
      return next;
    });
    setSummaryError("");
  }

  function handleSlugChange(value) {
    setSlugTouched(true);
    handleTopFieldChange("slug", slugifyProductName(value));
  }

  function handleTagsChange(tags) {
    handleTopFieldChange("tags", tags);
  }

  function handleActiveAttributesChange(nextAttributeIds) {
    setForm((prev) => {
      // Drop selections for deactivated attributes
      const newSelections = {};
      nextAttributeIds.forEach((id) => {
        if (prev.attributeOptionSelections[String(id)]) {
          newSelections[String(id)] = prev.attributeOptionSelections[String(id)];
        }
      });

      const generated = buildCartesianVariants(nextAttributeIds, newSelections, attributes, prev.variants);

      return {
        ...prev,
        activeAttributeIds: nextAttributeIds,
        attributeOptionSelections: newSelections,
        variants: generated ?? prev.variants.map((variant) => ({
          ...variant,
          attributes: (variant.attributes || []).filter((attribute) =>
            nextAttributeIds.includes(String(attribute.attributeId))
          ),
        })),
      };
    });
    setSummaryError("");
  }

  function handleOptionSelectionToggle(attrId, optionId) {
    setForm((prev) => {
      const current = prev.attributeOptionSelections[attrId] || [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      const newSelections = { ...prev.attributeOptionSelections, [attrId]: next };
      const generated = buildCartesianVariants(prev.activeAttributeIds, newSelections, attributes, prev.variants);
      return {
        ...prev,
        attributeOptionSelections: newSelections,
        variants: generated ?? prev.variants,
      };
    });
    setSummaryError("");
  }

  function handleVariantFieldChange(variantKey, field, value) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.key === variantKey ? { ...variant, [field]: value } : variant
      ),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`variants.${variantKey}.${field}`];
      delete next.variants;
      return next;
    });
    setSummaryError("");
  }

  function handleVariantAttributeChange(variantKey, attributeId, optionId) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.key !== variantKey) return variant;

        const attributesList = [...(variant.attributes || [])];
        const existingIndex = attributesList.findIndex(
          (attribute) => String(attribute.attributeId) === String(attributeId)
        );

        if (!optionId) {
          return {
            ...variant,
            attributes: attributesList.filter(
              (attribute) => String(attribute.attributeId) !== String(attributeId)
            ),
          };
        }

        if (existingIndex >= 0) {
          attributesList[existingIndex] = { attributeId: String(attributeId), optionId: String(optionId) };
        } else {
          attributesList.push({ attributeId: String(attributeId), optionId: String(optionId) });
        }

        return { ...variant, attributes: attributesList };
      }),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`variants.${variantKey}.attributes`];
      delete next.variants;
      return next;
    });
    setSummaryError("");
  }

  function handleVariantMediaToggle(variantKey, mediaId) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.key !== variantKey) return variant;
        const exists = variant.mediaIds.includes(mediaId);
        return {
          ...variant,
          mediaIds: exists
            ? variant.mediaIds.filter((id) => id !== mediaId)
            : [...variant.mediaIds, mediaId],
        };
      }),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`variants.${variantKey}.media`];
      delete next.productMedia;
      return next;
    });
    setSummaryError("");
  }

  function handleSetDefaultVariant(variantKey) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => ({
        ...variant,
        isDefault: variant.key === variantKey,
      })),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.variants;
      return next;
    });
    setSummaryError("");
  }

  function handleAddVariant() {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        createVariant(false),
      ],
    }));
  }

  function handleDuplicateVariant(variantKey) {
    setForm((prev) => {
      const source = prev.variants.find((variant) => variant.key === variantKey);
      if (!source) return prev;

      const duplicated = {
        ...source,
        key: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: source.name ? `${source.name} - نسخة` : "",
        isDefault: false,
        attributes: [...(source.attributes || [])],
        mediaIds: [...(source.mediaIds || [])],
      };

      return { ...prev, variants: [...prev.variants, duplicated] };
    });
  }

  function handleRemoveVariant(variantKey) {
    setForm((prev) => {
      const remaining = prev.variants.filter((variant) => variant.key !== variantKey);
      if (!remaining.length) return prev;
      if (remaining.some((variant) => variant.isDefault)) return { ...prev, variants: remaining };
      return {
        ...prev,
        variants: remaining.map((variant, index) => ({
          ...variant,
          isDefault: index === 0,
        })),
      };
    });
  }

  function updateMediaSelectionAfterUpload(prev, itemId, scopeVariantKey) {
    const fallbackVariantKey = !scopeVariantKey && prev.variants.length === 1 ? prev.variants[0]?.key : null;

    return prev.variants.map((variant) => {
      const shouldAttach = scopeVariantKey
        ? variant.key === scopeVariantKey
        : fallbackVariantKey
          ? variant.key === fallbackVariantKey
          : false;
      if (!shouldAttach) return variant;
      if (variant.mediaIds.includes(itemId)) return variant;
      return { ...variant, mediaIds: [...variant.mediaIds, itemId] };
    });
  }

  async function uploadMediaItem(localId, file, scopeVariantKey = null) {
    try {
      const response = await mediaApi.uploadForStore(file, shopId);
      const fileId = response?.data?.id;
      const previewUrl =
        response?.data?.mediumFileUrl ||
        response?.data?.originalFileUrl ||
        response?.data?.smallFileUrl ||
        "";

      setForm((prev) => ({
        ...prev,
        productMedia: prev.productMedia.map((item) =>
          item.localId === localId
            ? {
                ...item,
                id: fileId,
                previewUrl: previewUrl || item.previewUrl,
                status: "uploaded",
                error: "",
              }
            : item
        ),
        variants: updateMediaSelectionAfterUpload(prev, fileId, scopeVariantKey),
      }));

      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.productMedia;
        return next;
      });
    } catch (error) {
      setForm((prev) => ({
        ...prev,
        productMedia: prev.productMedia.map((item) =>
          item.localId === localId ? { ...item, status: "error", error: error.message || "فشل رفع الصورة" } : item
        ),
      }));

      showToast("فشل الرفع", error.message || "تعذر رفع الصورة إلى مدير الوسائط", "error");
    }
  }

  function normalizeFiles(files) {
    return Array.from(files || []).filter((file) => ACCEPTED_MEDIA_TYPES.includes(file.type));
  }

  function handleFilesSelected(files, scopeVariantKey = null) {
    const normalizedFiles = normalizeFiles(files);
    if (!normalizedFiles.length) {
      showToast("نوع غير مدعوم", "يمكن رفع صور JPG وPNG وWEBP وفيديوهات MP4 وWEBM فقط", "error");
      return;
    }

    const availableSlots = MAX_PRODUCT_IMAGES - form.productMedia.length;
    if (availableSlots <= 0) {
      showToast("الحد الأقصى للوسائط", `يمكن رفع ${MAX_PRODUCT_IMAGES} وسائط كحد أقصى`, "error");
      return;
    }

    const accepted = normalizedFiles.slice(0, availableSlots);
    if (accepted.length < normalizedFiles.length) {
      showToast("تم تقليص الرفع", `تم قبول أول ${accepted.length} وسائط فقط بسبب الحد الأقصى`, "info");
    }

    const queuedItems = accepted.map((file) => ({
      localId: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      id: "",
      file,
      fileName: file.name,
      mimeType: file.type,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
      error: "",
      scopeVariantKey,
    }));

    setForm((prev) => ({
      ...prev,
      productMedia: [...prev.productMedia, ...queuedItems],
    }));
    setSummaryError("");

    queuedItems.forEach((item) => {
      uploadMediaItem(item.localId, item.file, scopeVariantKey);
    });
  }

  function handleRetryMedia(localId) {
    const item = form.productMedia.find((entry) => entry.localId === localId);
    if (!item?.file) return;

    setForm((prev) => ({
      ...prev,
      productMedia: prev.productMedia.map((entry) =>
        entry.localId === localId ? { ...entry, status: "uploading", error: "" } : entry
      ),
    }));

    uploadMediaItem(localId, item.file, item.scopeVariantKey);
  }

  function handleRemoveMedia(localId) {
    const item = form.productMedia.find((entry) => entry.localId === localId);
    if (item?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }

    setForm((prev) => ({
      ...prev,
      productMedia: prev.productMedia.filter((entry) => entry.localId !== localId),
      variants: prev.variants.map((variant) => ({
        ...variant,
        mediaIds: item?.id ? variant.mediaIds.filter((id) => id !== item.id) : variant.mediaIds,
      })),
    }));
  }

  function reorderMedia(localId, offset) {
    setForm((prev) => {
      const currentIndex = prev.productMedia.findIndex((item) => item.localId === localId);
      if (currentIndex === -1) return prev;

      const targetIndex = currentIndex + offset;
      if (targetIndex < 0 || targetIndex >= prev.productMedia.length) return prev;

      return { ...prev, productMedia: moveArrayItem(prev.productMedia, currentIndex, targetIndex) };
    });
  }

  function handleSetMainMedia(localId) {
    setForm((prev) => {
      const currentIndex = prev.productMedia.findIndex((item) => item.localId === localId);
      if (currentIndex <= 0) return prev;
      return { ...prev, productMedia: moveArrayItem(prev.productMedia, currentIndex, 0) };
    });
  }

  async function loadTagSuggestions(query) {
    const response = await productsApi.getTags(query);
    return extractCollection(response);
  }

  function requestNavigation(path) {
    if (!dirty) {
      navigate(path);
      return;
    }

    pendingNavigationRef.current = path;
    setExitDialogOpen(true);
  }

  function validateCurrentStep(stepId) {
    const validation = validateProductForm(form, categories, brands);
    setFieldErrors(validation.errors);
    setStepErrors(validation.stepErrors);
    return {
      ...validation,
      currentStepErrors: filterErrorsForStep(validation.errors, stepId),
    };
  }

  function handleStepClick(stepId) {
    const targetIndex = PRODUCT_FORM_STEPS.findIndex((step) => step.id === stepId);
    const currentIndex = PRODUCT_FORM_STEPS.findIndex((step) => step.id === currentStep);
    if (targetIndex <= currentIndex) {
      setCurrentStep(stepId);
      setSummaryError("");
      return;
    }

    const validation = validateCurrentStep(currentStep);
    if (Object.keys(validation.currentStepErrors).length > 0) {
      setSummaryError("أكمل الحقول المطلوبة في هذه الخطوة أولًا.");
      return;
    }

    setCurrentStep(stepId);
    setSummaryError("");
  }

  function handleNextStep() {
    const currentIndex = PRODUCT_FORM_STEPS.findIndex((step) => step.id === currentStep);
    const nextStep = PRODUCT_FORM_STEPS[currentIndex + 1];
    if (!nextStep) return;

    if (isUploadingMedia) {
      setSummaryError("انتظر حتى يكتمل رفع جميع الصور قبل الانتقال.");
      return;
    }

    const validation = validateCurrentStep(currentStep);
    if (Object.keys(validation.currentStepErrors).length > 0) {
      setSummaryError("أكمل هذه الخطوة قبل المتابعة.");
      return;
    }

    setCurrentStep(nextStep.id);
    setSummaryError("");
  }

  function handlePreviousStep() {
    const currentIndex = PRODUCT_FORM_STEPS.findIndex((step) => step.id === currentStep);
    const previousStep = PRODUCT_FORM_STEPS[currentIndex - 1];
    if (!previousStep) return;
    setCurrentStep(previousStep.id);
    setSummaryError("");
  }

  async function submitProduct(overrideIsActive = null) {
    if (isUploadingMedia) {
      setSummaryError("لا يمكن إنشاء المنتج قبل اكتمال رفع الصور.");
      setCurrentStep("media");
      return;
    }

    const validation = validateProductForm(form, categories, brands);
    setFieldErrors(validation.errors);
    setStepErrors(validation.stepErrors);

    if (!validation.isValid) {
      const firstStep = getFirstErroredStep(validation.stepErrors);
      setCurrentStep(firstStep);
      setSummaryError("راجِع الحقول المطلوبة في الخطوات المعلّمة بالأحمر قبل النشر.");
      return;
    }

    if (hasMediaFailures) {
      setCurrentStep("media");
      setSummaryError("هناك صور فشل رفعها. أعد المحاولة أو احذفها قبل النشر.");
      return;
    }

    const payload = buildCreateProductPayload(form, overrideIsActive);
    setSubmitting(true);
    setSummaryError("");

    try {
      const response = await productsApi.create(payload);
      const created = response?.data ?? response;

      showToast("تمت الإضافة بنجاح", "تم إنشاء المنتج وإرساله إلى النظام بنجاح.", "success");
      setTimeout(() => {
        if (created?.id) navigate(`/shop-owner/products/${created.id}`);
        else navigate("/shop-owner/products");
      }, 700);
    } catch (error) {
      const backend = mapBackendErrors(error, form);
      setFieldErrors((prev) => ({ ...prev, ...backend.fieldErrors }));
      setStepErrors((prev) => ({ ...prev, ...backend.stepErrors }));
      setSummaryError(backend.summary);
      setCurrentStep(getFirstErroredStep(backend.stepErrors));
      showToast("تعذر إنشاء المنتج", backend.summary, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const stepProps = {
    basic: (
      <BasicInfoStep
        form={form}
        errors={fieldErrors}
        onFieldChange={(field, value) => {
          if (field === "slug") handleSlugChange(value);
          else handleTopFieldChange(field, value);
        }}
        onNameChange={handleNameChange}
      />
    ),
    classification: (
      <ClassificationStep
        form={form}
        categories={categories}
        brands={brands}
        errors={fieldErrors}
        onFieldChange={handleTopFieldChange}
        onTagsChange={handleTagsChange}
        loadTagSuggestions={loadTagSuggestions}
        canCreateBrand={canCreateBrand}
        onCreateBrandClick={() => setBrandDialogOpen(true)}
      />
    ),
    media: (
      <ProductMediaStep
        items={form.productMedia.map((item, index) => ({ ...item, sortOrder: index }))}
        error={fieldErrors.productMedia}
        uploading={isUploadingMedia}
        onFilesSelected={(files) => handleFilesSelected(files)}
        onRemove={handleRemoveMedia}
        onRetry={handleRetryMedia}
        onSetMain={handleSetMainMedia}
        onMove={reorderMedia}
      />
    ),
    variants: (
      <VariantEditorStep
        form={form}
        attributes={attributes}
        errors={fieldErrors}
        onActiveAttributesChange={handleActiveAttributesChange}
        onAddVariant={handleAddVariant}
        onDuplicateVariant={handleDuplicateVariant}
        onRemoveVariant={handleRemoveVariant}
        onSetDefaultVariant={handleSetDefaultVariant}
        onVariantFieldChange={handleVariantFieldChange}
        onVariantAttributeChange={handleVariantAttributeChange}
        onVariantMediaToggle={handleVariantMediaToggle}
        onVariantUpload={(variantKey, files) => handleFilesSelected(files, variantKey)}
        attributeOptionSelections={form.attributeOptionSelections}
        onOptionSelectionToggle={handleOptionSelectionToggle}
      />
    ),
    preview: (
      <ProductPreviewStep
        form={form}
        categories={categories}
        brands={brands}
        validationSummary={summaryError && currentStep === "preview" ? summaryError : ""}
      />
    ),
  };

  if (loadingReferences) return <LoadingState />;

  if (loadingError) {
    return (
      <div className="space-y-5" dir="rtl">
        <div
          className="rounded-[30px] border px-6 py-6"
          style={{ background: "var(--red-a2)", borderColor: "var(--red-a5)", color: "var(--red-10)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold">تعذر تحميل بيانات المنتج المرجعية</h1>
              <p className="mt-1 text-sm">{loadingError}</p>
            </div>

            <button
              type="button"
              onClick={loadReferenceData}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--gray-1)", color: "var(--red-10)" }}
            >
              <FiRefreshCw size={14} />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Toast.Provider swipeDirection="left">
      <div className="space-y-6 pb-10" dir="rtl">
        <AddProductHeader
          onBack={() => requestNavigation("/shop-owner/products")}
          onRefresh={loadReferenceData}
          onCancel={() => requestNavigation("/shop-owner/products")}
        />

        <ProductFormStepper
          steps={PRODUCT_FORM_STEPS}
          currentStep={currentStep}
          stepErrors={stepErrors}
          onStepClick={handleStepClick}
        />

        {summaryError && currentStep !== "preview" ? (
          <div
            className="flex items-center gap-2 rounded-[24px] border px-4 py-3 text-sm"
            style={{ background: "var(--amber-a2)", borderColor: "var(--amber-a5)", color: "var(--amber-11)" }}
          >
            <FiAlertCircle size={15} />
            {summaryError}
          </div>
        ) : null}

        {stepProps[currentStep]}

        <footer
          className="sticky bottom-4 z-20 rounded-[30px] border px-5 py-4 backdrop-blur"
          style={{ background: "color-mix(in srgb, var(--gray-1) 88%, transparent)", borderColor: "var(--gray-a5)" }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
                الخطوة {PRODUCT_FORM_STEPS.findIndex((step) => step.id === currentStep) + 1} من {PRODUCT_FORM_STEPS.length}
              </p>
              <p className="text-sm" style={{ color: "var(--gray-10)" }}>
                {currentStep === "preview"
                  ? "راجع المعاينة النهائية ثم أنشئ المنتج بالحالة التي تريدها."
                  : "أكمل هذه الخطوة ثم انتقل إلى الخطوة التالية."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {currentStep !== PRODUCT_FORM_STEPS[0].id ? (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                  style={{ background: "var(--gray-a2)", color: "var(--gray-11)", border: "1px solid var(--gray-a6)" }}
                >
                  <FiChevronRight size={16} />
                  السابق
                </button>
              ) : null}

              {currentStep !== "preview" ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isUploadingMedia}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                  style={{ background: "var(--blue-9)", color: "#fff" }}
                >
                  التالي
                  {isUploadingMedia ? <Spinner size={14} /> : <FiChevronLeft size={16} />}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => submitProduct(false)}
                    disabled={submitting || isUploadingMedia}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                    style={{ background: "var(--amber-9)", color: "#fff" }}
                  >
                    {submitting ? <Spinner size={14} /> : <FiSave size={14} />}
                    حفظ كغير نشط
                  </button>

                  <button
                    type="button"
                    onClick={() => submitProduct(true)}
                    disabled={submitting || isUploadingMedia}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold disabled:opacity-60"
                    style={{ background: "var(--blue-9)", color: "#fff" }}
                  >
                    {submitting ? <Spinner size={14} /> : <FiCheckCircle size={14} />}
                    نشر المنتج
                  </button>
                </>
              )}
            </div>
          </div>
        </footer>

        <BrandCreateDialog
          open={brandDialogOpen}
          onOpenChange={setBrandDialogOpen}
          onCreated={handleBrandCreated}
        />
      </div>

      <AlertDialog.Root open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm" />
          <AlertDialog.Content
            className="fixed left-1/2 top-1/2 z-[91] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] p-6 outline-none"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}
            dir="rtl"
          >
            <AlertDialog.Title className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
              لديك تغييرات غير محفوظة
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-7" style={{ color: "var(--gray-10)" }}>
              إذا غادرت الآن ستفقد الصور والبيانات التي أضفتها في نموذج إنشاء المنتج.
            </AlertDialog.Description>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
                  style={{ background: "var(--gray-a2)", color: "var(--gray-11)", border: "1px solid var(--gray-a6)" }}
                >
                  البقاء في الصفحة
                </button>
              </AlertDialog.Cancel>

              <AlertDialog.Action asChild>
                <button
                  type="button"
                  onClick={() => {
                    const path = pendingNavigationRef.current || "/shop-owner/products";
                    setExitDialogOpen(false);
                    navigate(path);
                  }}
                  className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold"
                  style={{ background: "var(--red-9)", color: "#fff" }}
                >
                  مغادرة بدون حفظ
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <Toast.Root
        open={toastOpen}
        onOpenChange={setToastOpen}
        className="grid w-[360px] gap-1 rounded-2xl border px-4 py-3 shadow-2xl"
        style={{
          background: toastState.tone === "error" ? "var(--red-9)" : toastState.tone === "info" ? "var(--gray-12)" : "var(--green-9)",
          color: "#fff",
          borderColor: "transparent",
        }}
      >
        <Toast.Title className="text-sm font-bold">{toastState.title}</Toast.Title>
        <Toast.Description className="text-sm opacity-95">{toastState.message}</Toast.Description>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-6 left-6 z-[100] flex max-w-[100vw] flex-col gap-2 outline-none" />
    </Toast.Provider>
  );
}
