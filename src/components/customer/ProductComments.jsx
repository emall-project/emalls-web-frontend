import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiEdit2,
  FiFlag,
  FiLoader,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { IoCheckmarkCircleOutline } from "react-icons/io5";

import { auth } from "../../api/auth";
import { engagementApi } from "../../api/engagementApi";

const COMMENT_STATUS_META = {
  PENDING_MODERATION: {
    label: "قيد المراجعة",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    note: "سيظهر تعليقك في الصفحة العامة بعد انتهاء المراجعة.",
  },
  APPROVED: {
    label: "منشور",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    note: "تعليقك منشور الآن ويمكن لباقي العملاء رؤيته.",
  },
  REJECTED: {
    label: "مرفوض",
    className: "border-red-200 bg-red-50 text-red-700",
    note: "يمكنك تعديل التعليق وإرساله مجددًا للمراجعة.",
  },
  REPORTED: {
    label: "تم الإبلاغ عنه",
    className: "border-orange-200 bg-orange-50 text-orange-700",
    note: "تم سحب التعليق من العرض العام لحين المراجعة.",
  },
  FLAGGED: {
    label: "تحت التحقق",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    note: "التعليق قيد التحقق حاليًا من قبل الإدارة.",
  },
};

const EDITABLE_STATUSES = new Set(["PENDING_MODERATION", "APPROVED", "REJECTED"]);

function normalizeOwnComment(comment) {
  if (!comment || typeof comment !== "object") return null;

  const content = typeof comment.content === "string" ? comment.content.trim() : "";
  if (!comment.commentId || !content) return null;

  return {
    ...comment,
    content,
  };
}

function formatCommentDate(value) {
  if (!value) return "بدون تاريخ";

  try {
    return new Intl.DateTimeFormat("ar-PS", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildCommenterLabel(comment) {
  if (comment?.userId == null) return "عميل";
  return `عميل #${comment.userId}`;
}

function buildAvatarText(comment) {
  if (comment?.userId == null) return "ع";
  return String(comment.userId).slice(-2);
}

function StatusBadge({ status }) {
  const meta = COMMENT_STATUS_META[status];
  if (!meta) return null;

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function InfoAlert({ type = "error", children }) {
  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : type === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-xs leading-6 ${styles}`}>
      <div className="flex items-start gap-2">
        <FiAlertCircle className="mt-0.5 shrink-0" size={13} />
        <div>{children}</div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="customer-panel-strong overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-slate-100" />
          <div className="space-y-2">
            <div className="h-4 w-36 rounded-full bg-slate-100" />
            <div className="h-3 w-56 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-6 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 h-4 w-28 rounded-full bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-slate-100" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded-full bg-slate-100" />
                <div className="h-3 w-44 rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded-full bg-slate-100" />
              <div className="h-3 w-5/6 rounded-full bg-slate-100" />
              <div className="h-3 w-2/3 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommentComposerDialog({
  open,
  mode,
  value,
  onChange,
  onOpenChange,
  onSubmit,
  loading,
  error,
}) {
  const isEdit = mode === "edit";

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <Dialog.Portal container={document.querySelector(".radix-themes") || document.body}>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[91] flex items-center justify-center p-4"
          aria-describedby={undefined}
        >
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
              <div>
                <Dialog.Title className="text-lg font-black text-slate-900">
                  {isEdit ? "تعديل تعليقك" : "إضافة تعليق"}
                </Dialog.Title>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {isEdit
                    ? "حدّث نص تعليقك ثم أرسله من جديد للمراجعة حسب قواعد النظام."
                    : "اكتب تعليقًا واضحًا ومفيدًا عن المنتج. سيُراجع قبل ظهوره للعامة."}
                </p>
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <FiX size={16} />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-500">نص التعليق</label>
                <textarea
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  rows={7}
                  maxLength={2000}
                  placeholder="اكتب تعليقك هنا..."
                  dir="rtl"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>{value.length}/2000</span>
                  <span>يجب أن يكون التعليق بين حرفين و2000 حرف</span>
                </div>
              </div>

              {error ? <InfoAlert>{error}</InfoAlert> : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4 sm:px-6">
              <Dialog.Close asChild>
                <button type="button" className="customer-secondary-btn min-h-[42px] px-4 text-xs">
                  إلغاء
                </button>
              </Dialog.Close>

              <button
                type="button"
                onClick={onSubmit}
                disabled={loading || value.trim().length < 2}
                className="customer-primary-btn min-h-[42px] px-4 text-xs disabled:opacity-40"
              >
                {loading ? <FiLoader size={12} className="animate-spin" /> : <FiSend size={12} />}
                {isEdit ? "حفظ التعديلات" : "إرسال التعليق"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EmptyPublicComments({ isCustomer, onAdd, onLogin, hasOwnComment }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-300 shadow-sm">
        <FiMessageSquare size={22} />
      </div>
      <h3 className="text-base font-extrabold text-slate-900">
        {hasOwnComment ? "لا توجد تعليقات عامة أخرى بعد" : "لا توجد تعليقات بعد"}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        {hasOwnComment
          ? "تعليقك محفوظ بحالته الحالية، لكن لا توجد تعليقات منشورة من بقية العملاء حتى الآن."
          : "كن أول من يشارك تجربته مع هذا المنتج ويساعد الآخرين في اتخاذ قرار الشراء."}
      </p>

      {isCustomer && !hasOwnComment ? (
        <button type="button" onClick={onAdd} className="customer-primary-btn mt-5 min-h-[42px] px-5 text-sm">
          <FiPlus size={14} />
          إضافة تعليق
        </button>
      ) : null}

      {!isCustomer ? (
        <button type="button" onClick={onLogin} className="customer-primary-btn mt-5 min-h-[42px] px-5 text-sm">
          سجّل الدخول للتعليق
        </button>
      ) : null}
    </div>
  );
}

export default function ProductComments({ productId }) {
  const navigate = useNavigate();
  const user = auth.getUser();
  const isCustomer = user?.role === "ROLE_CUSTOMER";
  const userId = user?.userId ?? user?.sub ?? null;

  const [comments, setComments] = useState([]);
  const [myComment, setMyComment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [reported, setReported] = useState(new Set());
  const composerRef = useRef(null);

  const loadThread = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const tasks = [engagementApi.getComments(productId)];
      if (isCustomer) tasks.push(engagementApi.getMyComment(productId));

      const [list, mine] = await Promise.all(tasks);
      const normalizedMyComment = normalizeOwnComment(mine);
      setComments(Array.isArray(list) ? list : []);
      setMyComment(normalizedMyComment);
      setDraft(normalizedMyComment?.content ?? "");
      setActionError("");
    } catch (requestError) {
      setComments([]);
      setMyComment(null);
      setDraft("");
      setLoadError(requestError.message || "تعذر تحميل التعليقات.");
    } finally {
      setLoading(false);
    }
  }, [isCustomer, productId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const ensureCustomer = useCallback(() => {
    if (isCustomer) return true;
    navigate(`/customer/login?from=/products/${productId}`);
    return false;
  }, [isCustomer, navigate, productId]);

  const publicComments = useMemo(
    () => comments.filter((comment) => comment.commentId !== myComment?.commentId),
    [comments, myComment?.commentId]
  );

  const myCommentMeta = myComment?.status ? COMMENT_STATUS_META[myComment.status] : null;
  const canEditMyComment = EDITABLE_STATUSES.has(myComment?.status);

  const focusComposer = useCallback(() => {
    if (!ensureCustomer()) return;
    if (myComment) return;

    setDialogMode("create");
    setActionError("");

    if (!draft.trim()) {
      setDraft("");
    }

    window.requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      composerRef.current?.focus();
    });
  }, [draft, ensureCustomer, myComment]);

  const openEditDialog = useCallback(() => {
    if (!ensureCustomer() || !myComment || !canEditMyComment) return;
    setDialogMode("edit");
    setDraft(myComment.content ?? "");
    setActionError("");
    setDialogOpen(true);
  }, [canEditMyComment, ensureCustomer, myComment]);

  const flashNotice = useCallback((type, text) => {
    setNotice({ type, text });
    window.setTimeout(() => {
      setNotice((prev) => (prev.text === text ? { type: "", text: "" } : prev));
    }, 3000);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!ensureCustomer() || !userId) return;

    if (draft.trim().length < 2) {
      setActionError("يجب أن يحتوي التعليق على حرفين على الأقل.");
      return;
    }

    setSubmitting(true);
    setActionError("");

    try {
      if (dialogMode === "edit" && myComment) {
        await engagementApi.updateComment(productId, myComment.commentId, draft.trim(), userId);
      } else {
        await engagementApi.createComment(productId, draft.trim(), userId);
      }

      await loadThread();
      setDialogOpen(false);
      flashNotice(
        "success",
        dialogMode === "edit"
          ? "تم تحديث تعليقك بنجاح."
          : "تم إرسال تعليقك بنجاح وهو الآن بانتظار المراجعة."
      );
    } catch (requestError) {
      setActionError(requestError.message || "تعذر حفظ التعليق.");
    } finally {
      setSubmitting(false);
    }
  }, [dialogMode, draft, ensureCustomer, flashNotice, loadThread, myComment, productId, userId]);

  const handleDelete = useCallback(async () => {
    if (!ensureCustomer() || !myComment) return;

    setSubmitting(true);
    setActionError("");
    try {
      await engagementApi.deleteComment(productId);
      await loadThread();
      flashNotice("success", "تم حذف تعليقك بنجاح.");
    } catch (requestError) {
      setActionError(requestError.message || "تعذر حذف التعليق.");
    } finally {
      setSubmitting(false);
    }
  }, [ensureCustomer, flashNotice, loadThread, myComment, productId]);

  const handleReport = useCallback(
    async (commentId) => {
      if (!ensureCustomer()) return;

      try {
        await engagementApi.reportComment(productId, commentId);
        setComments((prev) => prev.filter((comment) => comment.commentId !== commentId));
        setReported((prev) => new Set([...prev, commentId]));
        flashNotice("success", "تم الإبلاغ عن التعليق وسيتم مراجعته.");
      } catch (requestError) {
        flashNotice("error", requestError.message || "تعذر الإبلاغ عن التعليق.");
      }
    },
    [ensureCustomer, flashNotice, productId]
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      <section className="customer-panel-strong overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="customer-icon-chip h-11 w-11 text-sm">
                <FiMessageSquare className="text-base" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900">تعليقات العملاء</h2>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                    {comments.length} تعليق منشور
                  </span>
                </div>
                <p className="mt-1 text-sm leading-7 text-slate-500">
                  اطّلع على التعليقات المعتمدة من العملاء، وأضف تعليقك الخاص من المربع الظاهر أدناه إذا لم تكن قد علّقت بعد.
                </p>
              </div>
            </div>

            {isCustomer && !myComment ? (
              <button type="button" onClick={focusComposer} className="customer-primary-btn min-h-[42px] px-4 text-xs">
                <FiPlus size={13} />
                اكتب تعليقك الآن
              </button>
            ) : null}

            {!isCustomer ? (
              <button
                type="button"
                onClick={() => navigate(`/customer/login?from=/products/${productId}`)}
                className="customer-secondary-btn min-h-[42px] px-4 text-xs"
              >
                سجّل الدخول للتعليق
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-6">
          {notice.text ? (
            <InfoAlert type={notice.type === "success" ? "success" : "error"}>{notice.text}</InfoAlert>
          ) : null}

          {myComment ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">تعليقك الحالي</h3>
                    <StatusBadge status={myComment.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatCommentDate(myComment.createdAt)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canEditMyComment ? (
                    <button
                      type="button"
                      onClick={openEditDialog}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <FiEdit2 size={12} />
                      تعديل
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    {submitting ? <FiLoader size={12} className="animate-spin" /> : <FiTrash2 size={12} />}
                    حذف
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="whitespace-pre-wrap text-sm leading-8 text-slate-700">{myComment.content}</p>
              </div>

              <div className="mt-4 grid gap-3">
                {myCommentMeta?.note ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-6 text-slate-500">
                    {myCommentMeta.note}
                  </div>
                ) : null}

                {myComment.status === "REJECTED" && myComment.rejectionReason ? (
                  <InfoAlert>سبب الرفض: {myComment.rejectionReason}</InfoAlert>
                ) : null}

                {actionError ? <InfoAlert>{actionError}</InfoAlert> : null}
              </div>
            </div>
          ) : isCustomer ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">شارك رأيك في المنتج</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-500">
                  لا يوجد لديك تعليق على هذا المنتج بعد. أضف تعليقك الآن وسيُراجع قبل نشره.
                  </p>
                </div>

                <button type="button" onClick={focusComposer} className="customer-primary-btn min-h-[42px] px-4 text-xs">
                  <FiPlus size={13} />
                  إضافة تعليق
                </button>
              </div>

              <div className="mt-5 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <IoCheckmarkCircleOutline className="text-base text-blue-600" />
                  اكتب تعليقك هنا
                </div>
                <textarea
                  ref={composerRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="شارك رأيك في المنتج بشكل واضح ومفيد..."
                  dir="rtl"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span>{draft.trim().length}/2000</span>
                  <span>سيتم إرسال تعليقك للمراجعة قبل ظهوره للعامة</span>
                </div>

                {actionError ? <div className="mt-3"><InfoAlert>{actionError}</InfoAlert></div> : null}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft("");
                      setActionError("");
                    }}
                    className="customer-secondary-btn min-h-[42px] px-4 text-xs"
                  >
                    مسح النص
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || draft.trim().length < 2}
                    className="customer-primary-btn min-h-[42px] px-4 text-xs disabled:opacity-40"
                  >
                    {submitting ? <FiLoader size={12} className="animate-spin" /> : <FiSend size={12} />}
                    إرسال التعليق
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">أضف تعليقك بعد تسجيل الدخول</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-500">
                    سجّل الدخول بحساب عميل حتى تتمكن من كتابة تعليقك ومتابعة حالته لاحقًا.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/customer/login?from=/products/${productId}`)}
                  className="customer-primary-btn min-h-[42px] px-4 text-xs"
                >
                  تسجيل الدخول
                </button>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">التعليقات المنشورة</h3>
                <p className="mt-1 text-xs text-slate-500">هذه القائمة تعرض التعليقات المعتمدة للعامة فقط.</p>
              </div>

              {loadError ? (
                <button
                  type="button"
                  onClick={loadThread}
                  className="customer-secondary-btn min-h-[40px] px-4 text-xs"
                >
                  <FiRefreshCw size={12} />
                  إعادة المحاولة
                </button>
              ) : null}
            </div>

            <div className="p-5 sm:p-6">
              {loadError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-8 text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-red-400 shadow-sm">
                    <FiAlertCircle size={22} />
                  </div>
                  <h3 className="text-base font-extrabold text-red-800">تعذر تحميل التعليقات</h3>
                  <p className="mt-2 text-sm leading-7 text-red-700">{loadError}</p>
                </div>
              ) : publicComments.length === 0 ? (
                <EmptyPublicComments
                  isCustomer={isCustomer}
                  onAdd={focusComposer}
                  onLogin={() => navigate(`/customer/login?from=/products/${productId}`)}
                  hasOwnComment={Boolean(myComment)}
                />
              ) : (
                <div className="space-y-4">
                  {publicComments.map((comment) => {
                    const commenterLabel = buildCommenterLabel(comment);
                    const alreadyReported = reported.has(comment.commentId);

                    return (
                      <article
                        key={comment.commentId}
                        className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 transition-colors hover:border-slate-300 hover:bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-sm font-extrabold text-blue-700">
                              {buildAvatarText(comment)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-slate-900">{commenterLabel}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span>{formatCommentDate(comment.createdAt)}</span>
                                {comment.productName ? (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="truncate">{comment.productName}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {isCustomer ? (
                            <button
                              type="button"
                              onClick={() => handleReport(comment.commentId)}
                              disabled={alreadyReported}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                                alreadyReported
                                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              }`}
                              aria-label="الإبلاغ عن التعليق"
                            >
                              <FiFlag size={12} />
                              {alreadyReported ? "تم الإبلاغ" : "إبلاغ"}
                            </button>
                          ) : null}
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-700">{comment.content}</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <CommentComposerDialog
        open={dialogOpen}
        mode={dialogMode}
        value={draft}
        onChange={setDraft}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        loading={submitting}
        error={actionError}
      />
    </>
  );
}
