import { useMemo, useState } from "react";
import { FiImage, FiPlus, FiTrash2, FiUploadCloud, FiX } from "react-icons/fi";
import { getMediaPreviewUrl, isImageFile } from "../../api/mediaManager";
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
  return file?.id ? String(file.id) : "";
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
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const id = value || fileId(file);

  const handlePick = (files) => {
    const picked = files?.[0] || null;
    if (!picked) {
      return;
    }

    onChange?.(fileId(picked));
    onFileChange?.(picked);
  };

  const clear = () => {
    onChange?.("");
    onFileChange?.(null);
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
              يمكن الاختيار من مدير الملفات أو إدخال UUID يدويًا.
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
            {allowPicker ? (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                style={{ background: "var(--blue-9)", color: "#fff" }}
              >
                <FiUploadCloud size={14} />
                اختيار
              </button>
            ) : null}
          </div>
        </div>

        <input
          className={`${inputClass} mt-3`}
          style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
          value={id}
          onChange={(event) => {
            onChange?.(event.target.value.trim());
            onFileChange?.(null);
          }}
          placeholder={placeholder}
        />
      </div>

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
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const valueText = useMemo(() => values.filter(Boolean).join("\n"), [values]);
  const filesById = useMemo(() => new Map(files.map((file) => [fileId(file), file])), [files]);

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
    onChange?.(nextValues);
    onFilesChange?.(files.filter((file) => nextValues.includes(fileId(file))));
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
          {allowPicker ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
              style={{ background: "var(--blue-9)", color: "#fff" }}
            >
              <FiPlus size={14} />
              إضافة ملفات
            </button>
          ) : null}
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

        <textarea
          className={inputClass}
          style={{ ...inputStyle, minHeight: 82, direction: "ltr", textAlign: "left", resize: "vertical" }}
          value={valueText}
          onChange={(event) => setValues(normalizeUuidLines(event.target.value))}
          placeholder={"UUID لكل سطر أو افصل بينها بفواصل"}
        />
      </div>

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
