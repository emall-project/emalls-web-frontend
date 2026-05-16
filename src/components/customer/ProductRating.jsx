import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { FiLoader, FiTrash2 } from "react-icons/fi";

import { auth } from "../../api/auth";
import { engagementApi } from "../../api/engagementApi";

function StarDisplay({ value, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, index) =>
        index < Math.round(value) ? (
          <IoStar key={index} className="text-sm text-amber-500" />
        ) : (
          <IoStarOutline key={index} className="text-sm text-slate-300" />
        )
      )}
    </div>
  );
}

function StarPicker({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="transition-transform hover:scale-110 disabled:opacity-40"
          aria-label={`${star} نجوم`}
        >
          {star <= displayValue ? (
            <IoStar className="text-xl text-amber-500" />
          ) : (
            <IoStarOutline className="text-xl text-slate-300" />
          )}
        </button>
      ))}
    </div>
  );
}

export default function ProductRating({ productId }) {
  const navigate = useNavigate();
  const user = auth.getUser();
  const isCustomer = user?.role === "ROLE_CUSTOMER";
  const userId = user?.userId ?? user?.sub ?? null;

  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [myReview, setMyReview] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadRatings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const tasks = [engagementApi.getReviews(productId)];
      if (isCustomer) tasks.push(engagementApi.getMyReview(productId));

      const [list, mine] = await Promise.all(tasks);
      const reviews = Array.isArray(list) ? list : [];

      if (reviews.length) {
        const average =
          reviews[0]?.averageRating ??
          reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0) / reviews.length;
        const total = reviews[0]?.totalReviews ?? reviews.length;
        setSummary({
          averageRating: Number(average || 0),
          totalReviews: Number(total || 0),
        });
      } else {
        setSummary({ averageRating: 0, totalReviews: 0 });
      }

      setMyReview(mine ?? null);
      setMyRating(mine?.rating ?? 0);
    } catch (loadError) {
      setSummary({ averageRating: 0, totalReviews: 0 });
      setMyReview(null);
      setMyRating(0);
      setError(loadError.message || "تعذر تحميل التقييمات.");
    } finally {
      setLoading(false);
    }
  }, [isCustomer, productId]);

  useEffect(() => {
    loadRatings();
  }, [loadRatings]);

  const ensureCustomer = useCallback(() => {
    if (isCustomer) return true;
    navigate(`/customer/login?from=/products/${productId}`);
    return false;
  }, [isCustomer, navigate, productId]);

  const handleRate = useCallback(
    async (rating) => {
      if (!ensureCustomer() || !userId) return;
      setSaving(true);
      setError("");
      try {
        if (myReview?.reviewId) {
          await engagementApi.updateReview(productId, myReview.reviewId, rating, userId);
        } else {
          await engagementApi.createReview(productId, rating, userId);
        }
        await loadRatings();
      } catch (saveError) {
        setError(saveError.message || "تعذر حفظ التقييم.");
      } finally {
        setSaving(false);
      }
    },
    [ensureCustomer, loadRatings, myReview?.reviewId, productId, userId]
  );

  const handleDelete = useCallback(async () => {
    if (!ensureCustomer()) return;
    setSaving(true);
    setError("");
    try {
      await engagementApi.deleteReview(productId);
      await loadRatings();
    } catch (deleteError) {
      setError(deleteError.message || "تعذر حذف التقييم.");
    } finally {
      setSaving(false);
    }
  }, [ensureCustomer, loadRatings, productId]);

  if (loading) {
    return (
      <div className="flex h-8 items-center">
        <FiLoader size={13} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <StarDisplay value={summary.averageRating} />
        <span className="text-sm font-bold text-slate-900">
          {summary.totalReviews > 0 ? Number(summary.averageRating).toFixed(1) : "—"}
        </span>
        <span className="text-xs text-slate-500">({summary.totalReviews} تقييم)</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold text-slate-500">{myReview ? "تقييمك" : "قيّم المنتج"}</p>
        <StarPicker value={myRating} onChange={handleRate} disabled={saving} />
        {saving ? <FiLoader size={13} className="animate-spin text-slate-400" /> : null}
        {Boolean(myReview?.reviewId) ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <FiTrash2 size={11} />
            حذف تقييمي
          </button>
        ) : null}
      </div>

      {!isCustomer ? (
        <button
          type="button"
          onClick={() => navigate(`/customer/login?from=/products/${productId}`)}
          className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-800"
        >
          سجّل الدخول لإضافة تقييمك
        </button>
      ) : null}

      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
