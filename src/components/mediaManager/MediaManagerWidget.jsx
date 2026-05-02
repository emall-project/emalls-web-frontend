import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiFolderPlus,
  FiCheck,
  FiChevronLeft,
  FiCode,
  FiFolder,
  FiFile,
  FiFileText,
  FiExternalLink,
  FiEye,
  FiHome,
  FiImage,
  FiLoader,
  FiMusic,
  FiRefreshCw,
  FiTrash2,
  FiUpload,
  FiVideo,
  FiX,
} from "react-icons/fi";
import {
  formatFileSize,
  getMediaPreviewUrl,
  isAudioFile,
  isImageFile,
  isPdfFile,
  isTextFile,
  isVideoFile,
  mediaManagerApi,
} from "../../api/mediaManager";

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function getFileIcon(file) {
  const mimeType = String(file?.mimeType || "");

  if (isImageFile(file)) {
    return FiImage;
  }

  if (isVideoFile(file)) {
    return FiVideo;
  }

  if (isAudioFile(file)) {
    return FiMusic;
  }

  if (isTextFile(file)) {
    return FiCode;
  }

  if (
    isPdfFile(file) ||
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation") ||
    mimeType.startsWith("text/")
  ) {
    return FiFileText;
  }

  return FiFile;
}

function getPreviewLabel(file) {
  if (isVideoFile(file)) {
    return "معاينة فيديو";
  }

  if (isAudioFile(file)) {
    return "ملف صوتي";
  }

  if (isPdfFile(file)) {
    return "معاينة PDF";
  }

  if (isTextFile(file)) {
    return "ملف نصي";
  }

  const extension = String(file?.extension || "").trim();
  return extension ? extension.toUpperCase() : "ملف";
}

function getFileStatus(file) {
  return String(file?.status || "").toUpperCase();
}

function isApprovedFile(file) {
  return getFileStatus(file) === "APPROVED";
}

function getStatusLabel(file) {
  const status = getFileStatus(file);

  if (status === "APPROVED") {
    return "جاهز";
  }

  if (status === "PENDING") {
    return "بانتظار المعالجة";
  }

  if (status === "REJECTED" || status === "FAILED" || status === "ERROR") {
    return "فشل المعالجة";
  }

  return status || "بانتظار المعالجة";
}

function getUploadPhaseLabel(uploadPhase) {
  if (uploadPhase === "uploading") {
    return "جاري رفع الملف...";
  }

  if (uploadPhase === "processing") {
    return "بانتظار معالجة الملف من الخادم...";
  }

  return "";
}

function FilePreview({ file }) {
  const previewUrl = getMediaPreviewUrl(file, "small");
  const Icon = getFileIcon(file);

  if (previewUrl && isImageFile(file)) {
    return (
      <img
        src={previewUrl}
        alt={file.name}
        className="h-full w-full object-cover"
      />
    );
  }

  if (previewUrl && isVideoFile(file)) {
    return (
      <video
        src={previewUrl}
        className="h-full w-full object-cover"
        preload="metadata"
        muted
        playsInline
      />
    );
  }

  if (previewUrl && isPdfFile(file)) {
    return (
      <iframe
        title={file.name}
        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        className="h-full w-full border-0"
      />
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center"
      style={{ color: "var(--gray-10)" }}
    >
      <Icon size={28} />
      <div className="text-xs font-medium">{getPreviewLabel(file)}</div>
    </div>
  );
}

function PreviewDialog({ file, onClose, onOpen }) {
  const previewUrl = getMediaPreviewUrl(file, "large");

  useEffect(() => {
    if (!file) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [file, onClose]);

  if (!file) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[20060] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
      onMouseDown={onClose}
    >
      <div
        dir="rtl"
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-3"
          style={{ borderColor: "var(--gray-a6)" }}
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-bold" style={{ color: "var(--gray-12)" }}>
              {file.name}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
              {formatFileSize(file.size)}
              {file.extension ? ` • ${file.extension.toUpperCase()}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {previewUrl ? (
              <button
                type="button"
                onClick={onOpen}
                className="inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition hover:opacity-80"
                style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
              >
                <FiExternalLink size={14} />
                فتح
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition hover:opacity-80"
              style={{ color: "var(--gray-11)" }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div
          className="flex min-h-[55vh] items-center justify-center overflow-auto p-4"
          style={{ background: "var(--gray-2)" }}
        >
          {previewUrl && isImageFile(file) ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-[72vh] max-w-full object-contain"
            />
          ) : null}

          {previewUrl && isVideoFile(file) ? (
            <video
              src={previewUrl}
              className="max-h-[72vh] max-w-full"
              controls
              autoPlay
            />
          ) : null}

          {previewUrl && isAudioFile(file) ? (
            <audio src={previewUrl} className="w-full max-w-2xl" controls autoPlay />
          ) : null}

          {previewUrl && (isPdfFile(file) || isTextFile(file)) ? (
            <iframe
              title={file.name}
              src={previewUrl}
              className="h-[72vh] w-full rounded-xl border"
              style={{ borderColor: "var(--gray-a6)", background: "#fff" }}
            />
          ) : null}

          {!previewUrl ||
          (!isImageFile(file) &&
            !isVideoFile(file) &&
            !isAudioFile(file) &&
            !isPdfFile(file) &&
            !isTextFile(file)) ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-8 py-10 text-center"
              style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}
            >
              {(() => {
                const Icon = getFileIcon(file);
                return <Icon size={40} />;
              })()}
              <div className="text-sm font-medium">{getPreviewLabel(file)}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MediaManagerWidget({
  mode,
  storeId,
  title,
  selectionMode = "none",
  initialSelection = [],
  maxSelection,
  confirmLabel = "اختيار",
  onConfirmSelection,
  onCancelSelection,
  minHeight = 520,
  maxHeight,
}) {
  const fileInputRef = useRef(null);
  const [path, setPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draggingFileId, setDraggingFileId] = useState(null);
  const [dropFolderId, setDropFolderId] = useState(null);
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [selectedMap, setSelectedMap] = useState(() => new Map());

  const currentFolder = path[path.length - 1] || null;
  const currentFolderId = currentFolder?.id ?? null;
  const selectable = selectionMode !== "none";
  const missingStoreScope = mode === "store" && !storeId;
  const canCreateFolder =
    !missingStoreScope && (mode === "admin" || currentFolderId != null);
  const initialSelectionSignature = useMemo(
    () =>
      initialSelection
        .map((file) => {
          const fileId = file?.id != null ? String(file.id) : "";
          const fileName = file?.name != null ? String(file.name) : "";
          return `${fileId}:${fileName}`;
        })
        .join("|"),
    [initialSelection]
  );

  useEffect(() => {
    const nextOrder = initialSelection
      .map((file) => String(file?.id))
      .filter(Boolean);
    const nextMap = new Map();

    initialSelection.forEach((file) => {
      if (file?.id) {
        nextMap.set(String(file.id), file);
      }
    });

    setSelectedOrder((previous) => {
      if (
        previous.length === nextOrder.length &&
        previous.every((value, index) => value === nextOrder[index])
      ) {
        return previous;
      }

      return nextOrder;
    });

    setSelectedMap((previous) => {
      if (previous.size === nextMap.size) {
        const isSame = Array.from(nextMap.entries()).every(([id, file]) => {
          const previousFile = previous.get(id);
          return (
            previousFile?.id === file?.id &&
            previousFile?.name === file?.name &&
            previousFile?.originalFileUrl === file?.originalFileUrl &&
            previousFile?.mediumFileUrl === file?.mediumFileUrl &&
            previousFile?.smallFileUrl === file?.smallFileUrl
          );
        });

        if (isSame) {
          return previous;
        }
      }

      return nextMap;
    });
  }, [initialSelection, initialSelectionSignature]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const selectedFiles = useMemo(
    () =>
      selectedOrder
        .map((id) => selectedMap.get(String(id)))
        .filter(Boolean),
    [selectedMap, selectedOrder]
  );

  const syncSelectedFile = useCallback((file) => {
    if (!file?.id) {
      return;
    }

    setSelectedMap((previous) => {
      const next = new Map(previous);
      next.set(String(file.id), file);
      return next;
    });
  }, []);

  const loadItems = useCallback(async () => {
    if (missingStoreScope) {
      setFolders([]);
      setFiles([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [folderItems, fileItems] = await Promise.all([
        mediaManagerApi.listFolders({
          mode,
          storeId,
          parentId: currentFolderId,
        }),
        mediaManagerApi.listFiles({
          mode,
          storeId,
          folderId: currentFolderId,
        }),
      ]);

      setFolders(
        currentFolderId == null
          ? folderItems.filter((folder) => folder?.parentId == null)
          : folderItems
      );
      setFiles(fileItems);
    } catch (requestError) {
      setError(requestError.message || "فشل جلب الملفات");
      setFolders([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, missingStoreScope, mode, storeId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openFolder = (folder) => {
    setPath((previous) => [...previous, folder]);
    setRenamingFileId(null);
    setRenameValue("");
  };

  const goToRoot = () => {
    setPath([]);
    setRenamingFileId(null);
    setRenameValue("");
  };

  const goToPathIndex = (index) => {
    setPath((previous) => previous.slice(0, index + 1));
    setRenamingFileId(null);
    setRenameValue("");
  };

  const toggleSelection = (file) => {
    if (!selectable || !file?.id) {
      return;
    }

    if (!isApprovedFile(file)) {
      setError("لا يمكن اختيار هذا الملف قبل اكتمال معالجته من الخادم");
      return;
    }

    const fileId = String(file.id);
    syncSelectedFile(file);

    if (selectionMode === "single") {
      setSelectedOrder([fileId]);
      return;
    }

    setSelectedOrder((previous) => {
      if (previous.includes(fileId)) {
        return previous.filter((id) => id !== fileId);
      }

      if (maxSelection && previous.length >= maxSelection) {
        setError(`يمكن اختيار ${maxSelection} ملفات كحد أقصى`);
        return previous;
      }

      return [...previous, fileId];
    });
  };

  const startRename = (file) => {
    setRenamingFileId(String(file.id));
    setRenameValue(file.name || "");
  };

  const cancelRename = () => {
    setRenamingFileId(null);
    setRenameValue("");
  };

  const cancelCreateFolder = () => {
    setCreatingFolder(false);
    setNewFolderName("");
  };

  const commitRename = async () => {
    if (!renamingFileId) {
      return;
    }

    const targetFile = files.find(
      (file) => String(file.id) === String(renamingFileId)
    );

    if (!targetFile) {
      cancelRename();
      return;
    }

    const trimmedName = renameValue.trim();

    if (!trimmedName || trimmedName === targetFile.name) {
      cancelRename();
      return;
    }

    try {
      const updatedFile = await mediaManagerApi.renameFile({
        mode,
        storeId,
        fileId: targetFile.id,
        newName: trimmedName,
      });

      setFiles((previous) =>
        previous.map((file) =>
          String(file.id) === String(targetFile.id) ? updatedFile : file
        )
      );
      syncSelectedFile(updatedFile);
      setNotice("تم تحديث اسم الملف");
    } catch (requestError) {
      setError(requestError.message || "فشل تحديث اسم الملف");
    } finally {
      cancelRename();
    }
  };

  const handleUpload = async (event) => {
    const chosenFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (chosenFiles.length === 0) {
      return;
    }

    if (missingStoreScope) {
      setError("اختر متجرًا أولًا");
      return;
    }

    if (!currentFolderId) {
      setError("افتح مجلدًا قبل رفع الملفات");
      return;
    }

    setUploading(true);
    setUploadPhase("uploading");
    setError("");

    try {
      const uploadedFiles = [];

      for (const file of chosenFiles) {
        const savedFile = await mediaManagerApi.uploadFile({
          mode,
          storeId,
          folderId: currentFolderId,
          file,
          onUploadStateChange: setUploadPhase,
        });

        uploadedFiles.push(savedFile);
      }

      await loadItems();

      if (selectable && uploadedFiles.length > 0) {
        setSelectedMap((previous) => {
          const next = new Map(previous);
          uploadedFiles.forEach((file) => {
            next.set(String(file.id), file);
          });
          return next;
        });

        if (selectionMode === "single") {
          setSelectedOrder([String(uploadedFiles[0].id)]);
        } else {
          setSelectedOrder((previous) => {
            const next = [...previous];

            uploadedFiles.forEach((file) => {
              const fileId = String(file.id);

              if (!next.includes(fileId)) {
                if (!maxSelection || next.length < maxSelection) {
                  next.push(fileId);
                }
              }
            });

            return next;
          });
        }
      }

      setNotice(
        uploadedFiles.length === 1
          ? "تم رفع الملف ومعالجته"
          : `تم رفع ومعالجة ${uploadedFiles.length} ملفات`
      );
    } catch (requestError) {
      if (requestError?.code === "MEDIA_UPLOAD_PENDING_TIMEOUT") {
        await loadItems();
      }
      setError(requestError.message || "فشل رفع الملفات");
    } finally {
      setUploading(false);
      setUploadPhase("");
    }
  };

  const handleCreateFolder = async () => {
    const trimmedName = newFolderName.trim();

    if (!trimmedName) {
      cancelCreateFolder();
      return;
    }

    if (!canCreateFolder) {
      setError(
        mode === "store"
          ? "افتح مجلد المتجر أولًا ثم أضف المجلد داخله"
          : "لا يمكن إنشاء المجلد في هذا المسار"
      );
      return;
    }

    try {
      setError("");

      const createdFolder = await mediaManagerApi.createFolder({
        mode,
        storeId,
        parentId: currentFolderId,
        name: trimmedName,
      });

      setFolders((previous) => [...previous, createdFolder]);
      setNotice("تم إنشاء المجلد");
      cancelCreateFolder();
    } catch (requestError) {
      setError(requestError.message || "فشل إنشاء المجلد");
    }
  };

  const handleDropOnFolder = async (folder) => {
    if (!draggingFileId || String(folder.id) === String(currentFolderId)) {
      setDraggingFileId(null);
      setDropFolderId(null);
      return;
    }

    try {
      const movedFile = await mediaManagerApi.moveFile({
        mode,
        storeId,
        fileId: draggingFileId,
        newFolderId: folder.id,
      });

      setFiles((previous) =>
        previous.filter((file) => String(file.id) !== String(draggingFileId))
      );
      syncSelectedFile(movedFile);
      setNotice("تم نقل الملف");
    } catch (requestError) {
      setError(requestError.message || "فشل نقل الملف");
    } finally {
      setDraggingFileId(null);
      setDropFolderId(null);
    }
  };

  const openFile = useCallback((file) => {
    const url = getMediaPreviewUrl(file, "large");

    if (!url) {
      setError("لا يوجد رابط متاح لهذا الملف");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const openFilePreview = useCallback((file) => {
    if (!file?.id) {
      return;
    }

    setPreviewFile(file);
  }, []);

  const handleFileClick = (file) => {
    if (selectable) {
      toggleSelection(file);
      return;
    }

    openFile(file);
  };

  const handleFileKeyDown = (event, file) => {
    if (event.key === " ") {
      event.preventDefault();
      openFilePreview(file);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleFileClick(file);
    }
  };

  const handleDeleteFile = async (file) => {
    if (!file?.id) {
      return;
    }

    if (!window.confirm(`حذف الملف "${file.name}"؟`)) {
      return;
    }

    try {
      await mediaManagerApi.deleteFile({
        mode,
        storeId,
        fileId: file.id,
      });

      setFiles((previous) =>
        previous.filter((item) => String(item.id) !== String(file.id))
      );
      setSelectedOrder((previous) =>
        previous.filter((id) => id !== String(file.id))
      );
      setSelectedMap((previous) => {
        const next = new Map(previous);
        next.delete(String(file.id));
        return next;
      });
      setPreviewFile((previous) =>
        String(previous?.id) === String(file.id) ? null : previous
      );
      setNotice("تم حذف الملف");
    } catch (requestError) {
      setError(requestError.message || "فشل حذف الملف");
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!folder?.id) {
      return;
    }

    if (!window.confirm(`حذف المجلد "${folder.name}" وكل محتوياته؟`)) {
      return;
    }

    try {
      await mediaManagerApi.deleteFolder({
        mode,
        storeId,
        folderId: folder.id,
      });

      setFolders((previous) =>
        previous.filter((item) => String(item.id) !== String(folder.id))
      );
      setNotice("تم حذف المجلد");
    } catch (requestError) {
      setError(requestError.message || "فشل حذف المجلد");
    }
  };

  const isSelected = (fileId) => selectedOrder.includes(String(fileId));
  const uploadPhaseLabel = getUploadPhaseLabel(uploadPhase);

  const emptyStateMessage = missingStoreScope
    ? "لا يوجد متجر نشط لهذا الحساب"
    : currentFolderId
    ? "لا توجد ملفات أو مجلدات داخل هذا المسار"
    : "لا توجد مجلدات في هذا المستوى";

  return (
    <>
	    <div
	      className="flex flex-col overflow-hidden rounded-2xl border"
	      style={{
	        background: "var(--gray-1)",
	        borderColor: "var(--gray-a7)",
	        maxHeight,
	      }}
	    >
      <div
        className="border-b px-4 py-4"
        style={{ borderColor: "var(--gray-a6)" }}
      >
        {title ? (
          <div className="mb-3 text-sm font-bold" style={{ color: "var(--gray-12)" }}>
            {title}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToRoot}
              className="inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium transition hover:opacity-80"
              style={{
                borderColor: "var(--gray-a6)",
                color: path.length === 0 ? "var(--blue-11)" : "var(--gray-11)",
                background: path.length === 0 ? "var(--blue-a3)" : "transparent",
              }}
            >
              <FiHome size={13} />
              الجذر
            </button>

            {path.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <FiChevronLeft size={13} style={{ color: "var(--gray-8)" }} />
                <button
                  type="button"
                  onClick={() => goToPathIndex(index)}
                  className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium transition hover:opacity-80"
                  style={{
                    color:
                      index === path.length - 1
                        ? "var(--blue-11)"
                        : "var(--gray-11)",
                    background:
                      index === path.length - 1
                        ? "var(--blue-a3)"
                        : "var(--gray-a3)",
                  }}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!canCreateFolder) {
                  setError("افتح مجلدًا أولًا قبل إنشاء مجلد جديد");
                  return;
                }

                setCreatingFolder(true);
                setError("");
              }}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
              style={{
                borderColor: "var(--gray-a6)",
                color: "var(--gray-12)",
                background: "var(--gray-1)",
              }}
            >
              <FiFolderPlus size={14} />
              إضافة مجلد
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
            />

            <button
              type="button"
              onClick={loadItems}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
              style={{
                borderColor: "var(--gray-a6)",
                color: "var(--gray-12)",
              }}
            >
              {loading ? <Spinner size={14} /> : <FiRefreshCw size={14} />}
              تحديث
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={missingStoreScope || !currentFolderId || uploading}
              className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
              style={{
                background: "var(--blue-9)",
                color: "#fff",
              }}
            >
              {uploading ? <Spinner size={14} /> : <FiUpload size={14} />}
              إضافة ملف
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div
          className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--red-a3)",
            border: "1px solid var(--red-a6)",
            color: "var(--red-11)",
          }}
        >
          <div className="flex items-center gap-2">
            <FiAlertCircle size={15} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError("")}>
            <FiX size={14} />
          </button>
        </div>
      ) : null}

      {notice ? (
        <div
          className="mx-4 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--green-a3)",
            border: "1px solid var(--green-a6)",
            color: "var(--green-11)",
          }}
        >
          <FiCheck size={15} />
          <span>{notice}</span>
        </div>
      ) : null}

      {uploadPhaseLabel ? (
        <div
          className="mx-4 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--blue-a3)",
            border: "1px solid var(--blue-a6)",
            color: "var(--blue-11)",
          }}
        >
          <Spinner size={15} />
          <span>{uploadPhaseLabel}</span>
        </div>
      ) : null}

      {creatingFolder ? (
        <div
          className="mx-4 mt-4 rounded-xl border px-4 py-3"
          style={{
            background: "var(--gray-a2)",
            borderColor: "var(--gray-a6)",
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              autoFocus
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateFolder();
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelCreateFolder();
                }
              }}
              className="min-w-[220px] flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--gray-a6)",
                background: "var(--gray-1)",
                color: "var(--gray-12)",
              }}
              placeholder="اسم المجلد"
            />

            <button
              type="button"
              onClick={handleCreateFolder}
              className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium transition hover:opacity-90"
              style={{
                background: "var(--blue-9)",
                color: "#fff",
              }}
            >
              إنشاء
            </button>

            <button
              type="button"
              onClick={cancelCreateFolder}
              className="inline-flex h-9 items-center rounded-xl border px-3 text-sm font-medium transition hover:opacity-80"
              style={{
                borderColor: "var(--gray-a6)",
                color: "var(--gray-11)",
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : null}

	      <div
	        className={`min-h-0 p-4 ${maxHeight ? "flex-1 overflow-y-auto" : ""}`}
	        style={{ minHeight }}
	      >
        {loading ? (
          <div
            className="flex h-full min-h-[280px] items-center justify-center gap-2 text-sm"
            style={{ color: "var(--gray-10)" }}
          >
            <Spinner size={18} />
            جاري التحميل...
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div
            className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed text-sm"
            style={{
              borderColor: "var(--gray-a6)",
              color: "var(--gray-10)",
              background: "var(--gray-a2)",
            }}
          >
            {emptyStateMessage}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                role="button"
                tabIndex={0}
                onClick={() => openFolder(folder)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    openFolder(folder);
                  }
                }}
                onDragOver={(event) => {
                  if (!draggingFileId) {
                    return;
                  }

                  event.preventDefault();
                  setDropFolderId(String(folder.id));
                }}
                onDragLeave={() => {
                  if (dropFolderId === String(folder.id)) {
                    setDropFolderId(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDropOnFolder(folder);
                }}
                className="relative rounded-xl border p-4 text-right transition focus:outline-none focus:ring-2"
                style={{
                  background:
                    dropFolderId === String(folder.id)
                      ? "var(--blue-a3)"
                      : "var(--gray-a2)",
                  borderColor:
                    dropFolderId === String(folder.id)
                      ? "var(--blue-8)"
                      : "var(--gray-a5)",
                }}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      background:
                        dropFolderId === String(folder.id)
                          ? "var(--blue-a4)"
                          : "var(--yellow-a3)",
                      color:
                        dropFolderId === String(folder.id)
                          ? "var(--blue-11)"
                          : "var(--yellow-11)",
                    }}
                  >
                    <FiFolder size={22} />
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteFolder(folder);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-80"
                    style={{
                      background: "var(--red-a3)",
                      color: "var(--red-11)",
                    }}
                    title="حذف المجلد"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                <div className="truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                  {folder.name}
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                  مجلد
                </div>
              </div>
            ))}

            {files.map((file) => {
              const selected = isSelected(file.id);
              const isRenaming = renamingFileId === String(file.id);
              const canSelectFile = !selectable || isApprovedFile(file);
              const statusLabel = getStatusLabel(file);

              return (
                <div
                  key={file.id}
                  role="button"
                  tabIndex={0}
                  draggable
                  onDragStart={() => {
                    setDraggingFileId(String(file.id));
                    setDropFolderId(null);
                  }}
                  onDragEnd={() => {
                    setDraggingFileId(null);
                    setDropFolderId(null);
                  }}
                  onClick={() => handleFileClick(file)}
                  onKeyDown={(event) => handleFileKeyDown(event, file)}
                  className="rounded-xl border p-3 text-right transition focus:outline-none focus:ring-2"
                  style={{
                    background: selected ? "var(--blue-a3)" : "var(--gray-a2)",
                    borderColor: selected ? "var(--blue-9)" : canSelectFile ? "var(--gray-a5)" : "var(--amber-a6)",
                    boxShadow: selected ? "0 0 0 2px var(--blue-a6)" : "none",
                    cursor: selectable && canSelectFile ? "pointer" : "default",
                    opacity: canSelectFile ? 1 : 0.78,
                  }}
                >
                  {selectable ? (
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{
                          background: canSelectFile ? "var(--green-a3)" : "var(--amber-a3)",
                          color: canSelectFile ? "var(--green-11)" : "var(--amber-11)",
                        }}
                      >
                        {canSelectFile ? "جاهز للاختيار" : statusLabel}
                      </span>
                      <button
                        type="button"
                        disabled={!canSelectFile}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleSelection(file);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          background: selected ? "var(--blue-9)" : "var(--gray-1)",
                          border: selected ? "1px solid var(--blue-9)" : "1px solid var(--gray-a7)",
                          color: selected ? "#fff" : "var(--gray-12)",
                        }}
                      >
                        {selected ? <FiCheck size={13} /> : null}
                        {selected ? "محدد" : "اختيار"}
                      </button>
                    </div>
                  ) : null}

                  <div
                    className="overflow-hidden rounded-xl"
                    style={{
                      aspectRatio: "4 / 3",
                      background: "var(--gray-3)",
                    }}
                  >
                    <FilePreview file={file} />
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          onBlur={commitRename}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitRename();
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              cancelRename();
                            }
                          }}
                          className="w-full rounded-lg border px-2 py-1 text-sm outline-none"
                          style={{
                            borderColor: "var(--blue-7)",
                            background: "var(--gray-1)",
                            color: "var(--gray-12)",
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => event.stopPropagation()}
                          onDoubleClick={(event) => {
                            event.stopPropagation();
                            startRename(file);
                          }}
                          className="block w-full truncate text-right text-sm font-semibold"
                          style={{ color: "var(--gray-12)" }}
                        >
                          {file.name}
                        </button>
                      )}

                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                        {formatFileSize(file.size)}
                        {file.extension ? ` • ${file.extension.toUpperCase()}` : ""}
                        {file.status ? ` • ${statusLabel}` : ""}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openFilePreview(file);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-80"
                        style={{
                          background: "var(--gray-a3)",
                          color: "var(--gray-11)",
                        }}
                        title="معاينة الملف"
                      >
                        <FiEye size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteFile(file);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-80"
                        style={{
                          background: "var(--red-a3)",
                          color: "var(--red-11)",
                        }}
                        title="حذف الملف"
                      >
                        <FiTrash2 size={13} />
                      </button>

                      {selected ? (
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                          style={{
                            background: "var(--blue-9)",
                            color: "#fff",
                          }}
                        >
                          <FiCheck size={14} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectable ? (
        <div
          className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
          style={{ borderColor: "var(--gray-a6)", background: "var(--gray-1)" }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
              تم اختيار {selectedFiles.length} ملف
            </div>
            {selectedFiles.length ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {selectedFiles.slice(0, 3).map((file) => (
                  <span
                    key={file.id}
                    className="max-w-[180px] truncate rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                    title={file.name}
                  >
                    {file.name}
                  </span>
                ))}
                {selectedFiles.length > 3 ? (
                  <span className="text-xs" style={{ color: "var(--gray-10)" }}>
                    +{selectedFiles.length - 3}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="text-xs" style={{ color: "var(--gray-10)" }}>
                اختر ملفًا جاهزًا من القائمة ثم أكد الاختيار.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedOrder([]);
                setSelectedMap(new Map());
              }}
              className="inline-flex h-9 items-center rounded-xl border px-3 text-sm font-medium transition hover:opacity-80"
              style={{
                borderColor: "var(--gray-a6)",
                color: "var(--gray-11)",
              }}
            >
              مسح التحديد
            </button>

            {onCancelSelection ? (
              <button
                type="button"
                onClick={onCancelSelection}
                className="inline-flex h-9 items-center rounded-xl border px-3 text-sm font-medium transition hover:opacity-80"
                style={{
                  borderColor: "var(--gray-a6)",
                  color: "var(--gray-11)",
                }}
              >
                إلغاء
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onConfirmSelection?.(selectedFiles)}
              disabled={selectedFiles.length === 0}
              className="inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
              style={{
                background: "var(--blue-9)",
                color: "#fff",
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
    <PreviewDialog
      file={previewFile}
      onClose={() => setPreviewFile(null)}
      onOpen={() => openFile(previewFile)}
    />
    </>
  );
}
