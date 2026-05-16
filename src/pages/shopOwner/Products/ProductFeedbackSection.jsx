import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiClock,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import { feedbackApi } from "./feedbackApi";

const COMMENT_STATUS_META = {
  PENDING_MODERATION: {
    label: "بانتظار المراجعة",
    bg: "var(--amber-a3)",
    fg: "var(--amber-11)",
  },
  APPROVED: {
    label: "معتمد",
    bg: "var(--green-a3)",
    fg: "var(--green-11)",
  },
  REJECTED: {
    label: "مرفوض",
    bg: "var(--red-a3)",
    fg: "var(--red-11)",
  },
  REPORTED: {
    label: "مبلّغ عنه",
    bg: "var(--orange-a3)",
    fg: "var(--orange-11)",
  },
  FLAGGED: {
    label: "موسوم للمراجعة",
    bg: "var(--yellow-a3)",
    fg: "var(--yellow-11)",
  },
};

function formatCommentDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function renderStars(value) {
  return Array.from({ length: 5 }, (_, index) => {
    const active = index < Number(value || 0);
    return (
      <FiStar
        key={`${value}-${index}`}
        size={15}
        style={{
          color: active ? "var(--amber-10)" : "var(--gray-7)",
          fill: active ? "var(--amber-9)" : "transparent",
        }}
      />
    );
  });
}

function customerLabel(userId) {
  if (userId == null) return "عميل";
  return `عميل #${userId}`;
}

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const palette = {
    blue: { bg: "var(--blue-a3)", fg: "var(--blue-11)" },
    green: { bg: "var(--green-a3)", fg: "var(--green-11)" },
    amber: { bg: "var(--amber-a3)", fg: "var(--amber-11)" },
  }[tone];

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: palette.bg, color: palette.fg }}
        >
          <Icon size={18} />
        </div>
        <span
          className="text-2xl font-black tabular-nums"
          style={{ color: "var(--gray-12)" }}
          dir="ltr"
        >
          {value}
        </span>
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
        {label}
      </p>
    </div>
  );
}

function EmptyState({ title, hint }) {
  return (
    <div
      className="rounded-2xl border border-dashed px-6 py-12 text-center"
      style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
    >
      <FiMessageSquare size={24} style={{ color: "var(--gray-8)", margin: "0 auto 12px" }} />
      <p className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
        {title}
      </p>
      <p className="mt-2 text-sm leading-7" style={{ color: "var(--gray-10)" }}>
        {hint}
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div
      className="rounded-2xl border px-6 py-10 text-center"
      style={{ background: "var(--red-a2)", borderColor: "var(--red-a5)" }}
    >
      <FiAlertCircle size={24} style={{ color: "var(--red-10)", margin: "0 auto 12px" }} />
      <p className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
        تعذر تحميل البيانات
      </p>
      <p className="mt-2 text-sm leading-7" style={{ color: "var(--gray-11)" }}>
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        style={{ background: "var(--gray-12)", color: "#fff" }}
      >
        <FiRefreshCw size={14} />
        إعادة المحاولة
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-2xl border"
          style={{ background: "var(--gray-a3)", borderColor: "var(--gray-a5)" }}
        />
      ))}
    </div>
  );
}

export default function ProductFeedbackSection({ productId }) {
  const [activeTab, setActiveTab] = useState("reviews");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [reviewError, setReviewError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const loadFeedback = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setReviewError("");
    setCommentError("");

    const [reviewsResult, commentsResult] = await Promise.allSettled([
      feedbackApi.getProductReviews(productId),
      feedbackApi.getProductComments(productId),
    ]);

    if (reviewsResult.status === "fulfilled") {
      setReviews(Array.isArray(reviewsResult.value) ? reviewsResult.value : []);
    } else {
      setReviews([]);
      setReviewError(reviewsResult.reason?.message || "تعذر تحميل التقييمات.");
    }

    if (commentsResult.status === "fulfilled") {
      setComments(Array.isArray(commentsResult.value) ? commentsResult.value : []);
    } else {
      setComments([]);
      setCommentError(commentsResult.reason?.message || "تعذر تحميل التعليقات.");
    }

    setLoading(false);
  }, [productId]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const normalizedQuery = query.trim().toLowerCase();

  const ratingSummary = useMemo(() => {
    if (!reviews.length) {
      return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    }

    const average =
      reviews[0]?.averageRating ??
      reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
    const total = reviews[0]?.totalReviews ?? reviews.length;
    const distribution = [5, 4, 3, 2, 1].map(
      (score) => reviews.filter((review) => Number(review.rating) === score).length,
    );

    return { average, total, distribution };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (ratingFilter !== "all" && Number(review.rating) !== Number(ratingFilter)) {
        return false;
      }

      if (!normalizedQuery) return true;

      const target = `${customerLabel(review.userId)} ${review.userId ?? ""}`.toLowerCase();
      return target.includes(normalizedQuery);
    });
  }, [reviews, ratingFilter, normalizedQuery]);

  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      if (!normalizedQuery) return true;
      const haystack = `${comment.content || ""} ${customerLabel(comment.userId)} ${comment.userId ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [comments, normalizedQuery]);

  const canShowReviewsError = activeTab === "reviews" && reviewError;
  const canShowCommentsError = activeTab === "comments" && commentError;

  return (
    <section
      className="space-y-5 rounded-2xl border p-5"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
            >
              <FiMessageSquare size={17} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                آراء وتعليقات العملاء
              </h2>
              <p className="text-sm" style={{ color: "var(--gray-10)" }}>
                قراءة مباشرة للتعليقات والتقييمات المرتبطة بهذا المنتج فقط وفق ما يتيحه الخادم.
              </p>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
          >
            <FiShield size={12} />
            هذا القسم للعرض فقط. الردود أو الحذف أو الإخفاء غير مدعومة لصاحب المتجر حاليًا.
          </div>
        </div>

        <button
          type="button"
          onClick={loadFeedback}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
          style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
        >
          <FiRefreshCw size={14} />
          تحديث
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FiStar}
          label="متوسط التقييم"
          value={ratingSummary.total ? ratingSummary.average.toFixed(1) : "0.0"}
          tone="amber"
        />
        <StatCard
          icon={FiUsers}
          label="إجمالي التقييمات"
          value={ratingSummary.total}
          tone="blue"
        />
        <StatCard
          icon={FiMessageSquare}
          label="التعليقات المعروضة"
          value={comments.length}
          tone="green"
        />
        <StatCard
          icon={FiClock}
          label="آخر تحديث"
          value={loading ? "..." : "الآن"}
          tone="blue"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_240px]">
        <label className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}>
          <FiSearch size={15} style={{ color: "var(--gray-9)" }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={activeTab === "comments" ? "ابحث في نص التعليقات أو رقم العميل" : "ابحث برقم العميل"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--gray-9)]"
            style={{ color: "var(--gray-12)" }}
          />
        </label>

        <div className="flex rounded-2xl border p-1" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}>
          {[
            { id: "reviews", label: `التقييمات (${reviews.length})` },
            { id: "comments", label: `التعليقات (${comments.length})` },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
                style={{
                  background: active ? "var(--blue-9)" : "transparent",
                  color: active ? "#fff" : "var(--gray-11)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "reviews" ? (
          <select
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
            className="rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
          >
            <option value="all">كل التقييمات</option>
            <option value="5">5 نجوم</option>
            <option value="4">4 نجوم</option>
            <option value="3">3 نجوم</option>
            <option value="2">نجمتان</option>
            <option value="1">نجمة واحدة</option>
          </select>
        ) : (
          <div
            className="flex items-center justify-center rounded-2xl border px-4 py-3 text-sm"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}
          >
            التعليقات العامة المنشورة فقط
          </div>
        )}
      </div>

      {loading ? <LoadingState /> : null}

      {!loading && canShowReviewsError ? <ErrorState message={reviewError} onRetry={loadFeedback} /> : null}
      {!loading && canShowCommentsError ? <ErrorState message={commentError} onRetry={loadFeedback} /> : null}

      {!loading && activeTab === "reviews" && !reviewError ? (
        filteredReviews.length ? (
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div
              className="rounded-2xl border p-4"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                توزيع النجوم
              </p>
              <div className="mt-4 space-y-3">
                {[5, 4, 3, 2, 1].map((score, index) => {
                  const count = ratingSummary.distribution[index];
                  const percentage = ratingSummary.total ? (count / ratingSummary.total) * 100 : 0;

                  return (
                    <div key={score} className="space-y-1">
                      <div className="flex items-center justify-between text-xs" style={{ color: "var(--gray-10)" }}>
                        <span>{score} نجوم</span>
                        <span dir="ltr">{count}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "var(--gray-a4)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percentage}%`, background: "var(--amber-9)" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {filteredReviews.map((review) => (
                <article
                  key={review.reviewId || `${review.userId}-${review.rating}`}
                  className="rounded-2xl border p-4"
                  style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                        {customerLabel(review.userId)}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                        لا يوفّر الخادم تاريخ التقييم أو اسم العميل في هذا المسار.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">{renderStars(review.rating)}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="لا توجد تقييمات مطابقة"
            hint="لم يصلنا أي تقييم مطابق لخيارات البحث الحالية لهذا المنتج."
          />
        )
      ) : null}

      {!loading && activeTab === "comments" && !commentError ? (
        filteredComments.length ? (
          <div className="space-y-4">
            {filteredComments.map((comment) => {
              const statusMeta = COMMENT_STATUS_META[comment.status] || null;

              return (
                <article
                  key={comment.commentId || `${comment.userId}-${comment.createdAt}`}
                  className="rounded-2xl border p-5"
                  style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                        {customerLabel(comment.userId)}
                      </p>
                      {comment.createdAt ? (
                        <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                          {formatCommentDate(comment.createdAt)}
                        </p>
                      ) : null}
                    </div>

                    {statusMeta ? (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                        style={{ background: statusMeta.bg, color: statusMeta.fg }}
                      >
                        {statusMeta.label}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-sm leading-8" style={{ color: "var(--gray-12)" }}>
                    {comment.content}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="لا توجد تعليقات مطابقة"
            hint="التعليقات الظاهرة هنا هي التعليقات المعتمدة فقط، ولم نجد نتيجة مطابقة للبحث الحالي."
          />
        )
      ) : null}
    </section>
  );
}
