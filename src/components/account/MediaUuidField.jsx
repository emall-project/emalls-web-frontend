import { useEffect, useMemo, useRef, useState } from "react";
import { FiImage, FiLoader, FiPlus, FiTrash2, FiUploadCloud, FiX } from "react-icons/fi";
import { getMediaPreviewUrl, isImageFile, mediaManagerApi } from "../../api/mediaManager";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { MediaManagerPickerDialog } from "../mediaManager/MediaManagerPickerDialog";

const inputClass =
  "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const inputStyle = {
  background: "var(--gray-a2)",
  borderColor: "var(--gray-a6)",
  color: "var(--gray-12)",
};

function fileName(file) {
  return file?.name || "ملف محدد";
}

function fileId(file) {
  return file?.id || file?.fileId ? String(file.id || file.fileId) : "";
}

function normalizeUuidLines(value) {
  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function PreviewTile({ file, fallbackLabel = "ملف" }) {
  const previewUrl = getMediaPreviewUrl(file);

  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
      style={{ background: "var(--gray-a3)", borderColor: "var(--gray-a5)" }}
    >
      {previewUrl && isImageFile(file) ? (
        <img src={previewUrl} alt={fileName(file)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1 text-xs" style={{ color: "var(--gray-10)" }}>
          <FiImage size={18} />
          <span>{fallbackLabel}</span>
        </div>
      )}
    </div>
  );
}

function revokeLocalPreview(file) {
  if (file?.localPreviewUrl) {
    URL.revokeObjectURL(file.localPreviewUrl);
  }
}

function createUploadedPreview(uploadedFile, browserFile) {
  return {
    ...uploadedFile,
    id: uploadedFile?.id || uploadedFile?.fileId,
    name: uploadedFile?.name || browserFile.name,
    mimeType: uploadedFile?.mimeType || browserFile.type || null,
    extension: uploadedFile?.extension || browserFile.name.split(".").pop()?.toLowerCase() || null,
    size: uploadedFile?.size ?? browserFile.size,
    localPreviewUrl: URL.createObjectURL(browserFile),
  };
}

export function MediaUuidField({
  label,
  value,
  onChange,
  file,
  onFileChange,
  mode = "admin",
  storeId,
  pickerTitle,
  required = false,
  allowPicker = true,
  placeholder = "UUID",
  uploadMode = "picker",
  showManualInput = uploadMode !== "temp",
  accept = "image/*",
  disabled = false,
  error,
  onUploadingChange,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const previousPreviewRef = useRef(null);
  const id = value || fileId(file);
  const canUploadTemp = uploadMode === "temp";

  useEffect(() => {
    return () => revokeLocalPreview(previousPreviewRef.current);
  }, []);

  const handlePick = (files) => {
    const picked = files?.[0] || null;
    if (!picked) {
      return;
    }

    onChange?.(fileId(picked));
    onFileChange?.(picked);
  };

  const clear = () => {
    revokeLocalPreview(file);
    previousPreviewRef.current = null;
    onChange?.("");
    onFileChange?.(null);
  };

  const handleTempUpload = async (event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    setUploadError("");
    setUploading(true);
    onUploadingChange?.(true);

    try {
      const uploadedFile = await mediaManagerApi.uploadTempFile(selectedFile);
      const previewFile = createUploadedPreview(uploadedFile, selectedFile);
      revokeLocalPreview(file);
      previousPreviewRef.current = previewFile;
      onChange?.(fileId(previewFile));
      onFileChange?.(previewFile);
    } catch (requestError) {
      setUploadError(getApiErrorMessage(requestError, "فشل رفع الملف"));
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div className="space-y-2">
      {label ? (
        <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
          {label} {required ? <span style={{ color: "var(--red-9)" }}>*</span> : null}
        </label>
      ) : null}

      <div className="rounded-xl border p-3" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}>
        <div className="flex items-center gap-3">
          <PreviewTile file={file} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
              {file ? fileName(file) : id ? "UUID محدد" : "لم يتم اختيار ملف"}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
              {canUploadTemp
                ? "ارفع الملف من جهازك وسيتم استخدام UUID الناتج تلقائيًا."
                : "يمكن الاختيار من مدير الملفات أو إدخال UUID يدويًا."}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {id ? (
              <button
                type="button"
                onClick={clear}
                className="rounded-xl border p-2 transition hover:opacity-80"
                style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}
                title="إزالة"
              >
                <FiX size={15} />
              </button>
            ) : null}
            {canUploadTemp ? (
              <label
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                style={{ background: "var(--blue-9)", color: "#fff", opacity: disabled || uploading ? 0.6 : 1 }}
              >
                {uploading ? <FiLoader className="animate-spin" size={14} /> : <FiUploadCloud size={14} />}
                رفع
                <input
                  type="file"
                  accept={accept}
                  className="sr-only"
                  disabled={disabled || uploading}
                  onChange={handleTempUpload}
                />
              </label>
            ) : null}
            {allowPicker ? (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                style={{ background: "var(--blue-9)", color: "#fff" }}
              >
                <FiUploadCloud size={14} />
                اختيار
              </button>
            ) : null}
          </div>
        </div>

        {showManualInput ? (
          <input
            className={`${inputClass} mt-3`}
            style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
            value={id}
            disabled={disabled || uploading}
            onChange={(event) => {
              revokeLocalPreview(file);
              previousPreviewRef.current = null;
              onChange?.(event.target.value.trim());
              onFileChange?.(null);
            }}
            placeholder={placeholder}
          />
        ) : null}
      </div>

      {error || uploadError ? (
        <p className="text-xs" style={{ color: "var(--red-9)" }}>{error || uploadError}</p>
      ) : null}

      {allowPicker ? (
        <MediaManagerPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          mode={mode}
          storeId={storeId}
          title={pickerTitle || label || "اختيار ملف"}
          selectionMode="single"
          maxSelection={1}
          initialSelection={file ? [file] : []}
          confirmLabel="اختيار الملف"
          onConfirm={handlePick}
        />
      ) : null}
    </div>
  );
}

export function MediaUuidListField({
  label,
  values = [],
  onChange,
  files = [],
  onFilesChange,
  mode = "admin",
  storeId,
  pickerTitle,
  required = false,
  allowPicker = true,
  uploadMode = "picker",
  showManualInput = uploadMode !== "temp",
  accept = "image/*",
  disabled = false,
  error,
  onUploadingChange,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const localPreviewFilesRef = useRef([]);

  const valueText = useMemo(() => values.filter(Boolean).join("\n"), [values]);
  const filesById = useMemo(() => new Map(files.map((file) => [fileId(file), file])), [files]);
  const canUploadTemp = uploadMode === "temp";

  useEffect(() => {
    return () => {
      localPreviewFilesRef.current.forEach(revokeLocalPreview);
    };
  }, []);

  const setValues = (nextValues) => {
    const cleanValues = [...new Set(nextValues.map((item) => String(item).trim()).filter(Boolean))];
    onChange?.(cleanValues);
    onFilesChange?.(files.filter((file) => cleanValues.includes(fileId(file))));
  };

  const handlePick = (pickedFiles) => {
    const picked = pickedFiles || [];
    const nextFilesById = new Map(filesById);
    picked.forEach((file) => {
      if (fileId(file)) {
        nextFilesById.set(fileId(file), file);
      }
    });

    const nextValues = [...new Set([...values, ...picked.map(fileId).filter(Boolean)])];
    onChange?.(nextValues);
    onFilesChange?.(nextValues.map((id) => nextFilesById.get(id)).filter(Boolean));
  };

  const removeValue = (uuid) => {
    const nextValues = values.filter((item) => item !== uuid);
    const removedFile = files.find((file) => fileId(file) === uuid);
    revokeLocalPreview(removedFile);
    localPreviewFilesRef.current = localPreviewFilesRef.current.filter((file) => fileId(file) !== uuid);
    onChange?.(nextValues);
    onFilesChange?.(files.filter((file) => nextValues.includes(fileId(file))));
  };

  const handleTempUploads = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) {
      return;
    }

    setUploadError("");
    setUploading(true);
    onUploadingChange?.(true);

    try {
      const results = await Promise.allSettled(
        selectedFiles.map(async (browserFile) => {
          const uploadedFile = await mediaManagerApi.uploadTempFile(browserFile);
          return createUploadedPreview(uploadedFile, browserFile);
        })
      );
      const uploadedFiles = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
      const failedNames = results
        .map((result, index) => (result.status === "rejected" ? selectedFiles[index].name : ""))
        .filter(Boolean);

      if (uploadedFiles.length) {
        const nextFilesById = new Map(filesById);
        uploadedFiles.forEach((uploadedFile) => {
          const id = fileId(uploadedFile);
          if (id) {
            nextFilesById.set(id, uploadedFile);
          }
        });
        localPreviewFilesRef.current = [...localPreviewFilesRef.current, ...uploadedFiles];
        const nextValues = [...new Set([...values, ...uploadedFiles.map(fileId).filter(Boolean)])];
        onChange?.(nextValues);
        onFilesChange?.(nextValues.map((id) => nextFilesById.get(id)).filter(Boolean));
      }

      if (failedNames.length) {
        setUploadError(`فشل رفع: ${failedNames.join("، ")}`);
      }
    } catch (requestError) {
      setUploadError(getApiErrorMessage(requestError, "فشل رفع الملفات"));
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div className="space-y-2">
      {label ? (
        <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
          {label} {required ? <span style={{ color: "var(--red-9)" }}>*</span> : null}
        </label>
      ) : null}

      <div className="rounded-xl border p-3" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs" style={{ color: "var(--gray-10)" }}>
            {values.length ? `${values.length} ملف محدد` : "لم يتم اختيار ملفات"}
          </div>
          <div className="flex items-center gap-2">
          {canUploadTemp ? (
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
              style={{ background: "var(--blue-9)", color: "#fff", opacity: disabled || uploading ? 0.6 : 1 }}
            >
              {uploading ? <FiLoader className="animate-spin" size={14} /> : <FiUploadCloud size={14} />}
              رفع ملفات
              <input
                type="file"
                accept={accept}
                multiple
                className="sr-only"
                disabled={disabled || uploading}
                onChange={handleTempUploads}
              />
            </label>
          ) : null}
          {allowPicker ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
              style={{ background: "var(--blue-9)", color: "#fff" }}
            >
              <FiPlus size={14} />
              إضافة ملفات
            </button>
          ) : null}
          </div>
        </div>

        {values.length ? (
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            {values.map((uuid) => {
              const file = filesById.get(uuid);
              return (
                <div
                  key={uuid}
                  className="flex items-center gap-3 rounded-xl border p-2"
                  style={{ background: "var(--gray-a1, var(--gray-1))", borderColor: "var(--gray-a5)" }}
                >
                  <PreviewTile file={file} fallbackLabel="UUID" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                      {file ? fileName(file) : "ملف UUID"}
                    </div>
                    <div className="truncate text-xs" dir="ltr" style={{ color: "var(--gray-10)" }}>
                      {uuid}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeValue(uuid)}
                    className="rounded-lg p-2 transition hover:opacity-80"
                    style={{ color: "var(--red-9)" }}
                    title="حذف"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        {showManualInput ? (
          <textarea
            className={inputClass}
            style={{ ...inputStyle, minHeight: 82, direction: "ltr", textAlign: "left", resize: "vertical" }}
            value={valueText}
            disabled={disabled || uploading}
            onChange={(event) => setValues(normalizeUuidLines(event.target.value))}
            placeholder={"UUID لكل سطر أو افصل بينها بفواصل"}
          />
        ) : null}
      </div>

      {error || uploadError ? (
        <p className="text-xs" style={{ color: "var(--red-9)" }}>{error || uploadError}</p>
      ) : null}

      {allowPicker ? (
        <MediaManagerPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          mode={mode}
          storeId={storeId}
          title={pickerTitle || label || "اختيار ملفات"}
          selectionMode="multiple"
          initialSelection={files}
          confirmLabel="إضافة الملفات"
          onConfirm={handlePick}
        />
      ) : null}
    </div>
  );
}
