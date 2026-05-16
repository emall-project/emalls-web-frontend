import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IoArrowForward,
  IoBusinessOutline,
  IoCartOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { FiAlertCircle, FiCheck, FiLoader } from "react-icons/fi";

import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { auth } from "../../api/auth";
import { cartApi } from "../../api/cartApi";
import { useCart } from "../../context/CartContext";

const PHONE_REGEX = /^05(9|6|4)\d{7}$/;
const DEFAULT_PHONE_PREFIX = "+972";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePhoneValue(value) {
  if (value && typeof value === "object") {
    const prefix = normalizeText(value.prefix) || DEFAULT_PHONE_PREFIX;
    const number = normalizeText(value.number);
    return { prefix, number };
  }

  const text = normalizeText(value);
  if (!text) return { prefix: DEFAULT_PHONE_PREFIX, number: "" };

  if (text.includes("-")) {
    const [rawPrefix, rawNumber] = text.split("-", 2);
    return {
      prefix: normalizeText(rawPrefix) || DEFAULT_PHONE_PREFIX,
      number: normalizeText(rawNumber),
    };
  }

  if (text.startsWith("+972")) {
    return { prefix: "+972", number: normalizeText(text.slice(4)) };
  }

  if (text.startsWith("+970")) {
    return { prefix: "+970", number: normalizeText(text.slice(4)) };
  }

  return { prefix: DEFAULT_PHONE_PREFIX, number: text };
}

function fmt(value) {
  return Number(value ?? 0).toFixed(2);
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-500">{label}</label>
      {children}
      {error ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <FiAlertCircle size={11} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

export default function CheckoutPage() {
  const { mallId } = useParams();
  const navigate = useNavigate();
  const { refresh } = useCart();
  const [currentUser] = useState(() => auth.getUser());
  const initialPhone = parsePhoneValue(currentUser?.phone);

  const [cart, setCart] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => ({
    cityId: "",
    deliveryName: normalizeText(currentUser?.fullName),
    deliveryPhonePrefix: initialPhone.prefix,
    deliveryPhone: initialPhone.number,
    deliveryLocation: "",
    deliveryNote: "",
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [customerInfoState, setCustomerInfoState] = useState({ loading: false, error: "" });

  useEffect(() => {
    setLoading(true);
    Promise.all([cartApi.getCartForMall(mallId), cartApi.getActiveCities()])
      .then(([cartData, cityList]) => {
        setCart(cartData);
        setCities(Array.isArray(cityList) ? cityList : []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [mallId]);

  useEffect(() => {
    if (!currentUser?.userId) {
      setCustomerInfoState({ loading: false, error: "" });
      return;
    }

    const hasTokenName = normalizeText(currentUser?.fullName).length > 0;
    const hasTokenPhone = initialPhone.number.length > 0;

    if (hasTokenName && hasTokenPhone) {
      setCustomerInfoState({ loading: false, error: "" });
      return;
    }

    let cancelled = false;
    setCustomerInfoState({ loading: true, error: "" });

    auth
      .getUserInfo(currentUser.userId)
      .then((userInfo) => {
        if (cancelled) return;

        const fallbackPhone = parsePhoneValue(userInfo?.phoneNumber ?? userInfo?.phone);
        const fallbackName = normalizeText(userInfo?.fullName);

        setForm((prev) => ({
          ...prev,
          deliveryName: normalizeText(prev.deliveryName) || fallbackName,
          deliveryPhonePrefix: normalizeText(prev.deliveryPhone)
            ? prev.deliveryPhonePrefix
            : fallbackPhone.prefix || DEFAULT_PHONE_PREFIX,
          deliveryPhone: normalizeText(prev.deliveryPhone) || fallbackPhone.number,
        }));
        setCustomerInfoState({ loading: false, error: "" });
      })
      .catch((requestError) => {
        if (cancelled) return;
        setCustomerInfoState({
          loading: false,
          error: requestError.message || "تعذر تعبئة بيانات الحساب تلقائيًا.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, initialPhone.number]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const validate = () => {
    const errors = {};
    if (!form.cityId) errors.cityId = "هذا الحقل مطلوب.";
    if (!form.deliveryName.trim()) errors.deliveryName = "اسم المستلم مطلوب.";
    else if (form.deliveryName.trim().length < 2) errors.deliveryName = "يجب إدخال حرفين على الأقل.";

    if (!form.deliveryPhone.trim()) errors.deliveryPhone = "رقم الهاتف مطلوب.";
    else if (!PHONE_REGEX.test(form.deliveryPhone.trim())) {
      errors.deliveryPhone = "أدخل رقمًا صحيحًا يبدأ بـ 059 أو 056 أو 054.";
    }

    if (!form.deliveryLocation.trim()) errors.deliveryLocation = "العنوان التفصيلي مطلوب.";
    else if (form.deliveryLocation.trim().length < 5) {
      errors.deliveryLocation = "اكتب عنوانًا أوضح مكوّنًا من 5 أحرف على الأقل.";
    }

    if (form.deliveryNote && form.deliveryNote.length > 255) {
      errors.deliveryNote = "الحد الأقصى للملاحظات هو 255 حرفًا.";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const request = {
        cityId: Number(form.cityId),
        deliveryName: form.deliveryName.trim(),
        deliveryPhone: {
          prefix: form.deliveryPhonePrefix || DEFAULT_PHONE_PREFIX,
          number: form.deliveryPhone.trim(),
        },
        deliveryLocation: form.deliveryLocation.trim(),
        deliveryNote: form.deliveryNote.trim() || undefined,
      };
      const orders = await cartApi.checkout(mallId, request);
      refresh();
      navigate("/orders/success", {
        replace: true,
        state: { orders: Array.isArray(orders) ? orders : [orders] },
      });
    } catch (submitError) {
      setServerError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <FiLoader size={28} className="animate-spin text-slate-400" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="customer-panel-strong max-w-md px-8 py-10 text-center">
            <FiAlertCircle className="mx-auto mb-4 text-4xl text-slate-300" />
            <p className="mb-5 text-sm leading-7 text-slate-600">{error || "لم يتم العثور على السلة."}</p>
            <button type="button" onClick={() => navigate("/cart")} className="customer-primary-btn">
              العودة إلى السلة
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const mallName = cart.mallInfo?.name ?? `مول ${mallId}`;
  const items = cart.items ?? [];
  const selectedCity = cities.find((city) => String(city.cityId) === String(form.cityId));

  return (
    <div dir="rtl" className="customer-page">
      <Header />

      <div className="customer-shell px-4 py-8 sm:px-6 md:px-12 md:py-10">
        <div className="customer-page-header customer-panel-strong px-5 py-5 sm:px-6 md:px-8">
          <div>
            <span className="customer-kicker">
              <IoCartOutline />
              خطوة الدفع
            </span>
            <h1 className="customer-page-title mt-4">إتمام الطلب</h1>
            <p className="customer-page-subtitle flex items-center gap-2">
              <IoBusinessOutline className="text-sm" />
              {mallName}
            </p>
          </div>

          <button type="button" onClick={() => navigate("/cart")} className="customer-secondary-btn shrink-0">
            <IoArrowForward className="text-base" />
            السلة
          </button>
        </div>

        <div className="customer-divider my-8" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {serverError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            ) : null}

            <div className="customer-panel p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="customer-icon-chip h-10 w-10 text-sm">
                  <IoPersonOutline />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">بيانات المستلم</h2>
              </div>

              {customerInfoState.loading ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  جاري تعبئة الاسم ورقم الهاتف من بيانات حسابك...
                </div>
              ) : null}

              {customerInfoState.error ? (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  {customerInfoState.error}
                </div>
              ) : null}

              <div className="space-y-4">
                <Field label="اسم المستلم" error={fieldErrors.deliveryName}>
                  <input
                    type="text"
                    value={form.deliveryName}
                    onChange={set("deliveryName")}
                    placeholder="الاسم الكامل للمستلم"
                    className={inputCls}
                    dir="rtl"
                  />
                </Field>

                <Field label="رقم الهاتف" error={fieldErrors.deliveryPhone}>
                  <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <select
                      value={form.deliveryPhonePrefix}
                      onChange={set("deliveryPhonePrefix")}
                      className="h-[50px] shrink-0 border-l border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 outline-none"
                      dir="ltr"
                    >
                      <option value="+972">+972</option>
                      <option value="+970">+970</option>
                    </select>
                    <input
                      type="tel"
                      value={form.deliveryPhone}
                      onChange={set("deliveryPhone")}
                      placeholder="0591234567"
                      maxLength={10}
                      className="h-[50px] flex-1 px-4 text-sm text-slate-900 outline-none"
                      dir="ltr"
                    />
                  </div>
                </Field>
              </div>
            </div>

            <div className="customer-panel p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="customer-icon-chip h-10 w-10 text-sm">
                  <IoLocationOutline />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">عنوان التوصيل</h2>
              </div>

              <div className="space-y-4">
                <Field label="المدينة" error={fieldErrors.cityId}>
                  <select value={form.cityId} onChange={set("cityId")} className={inputCls}>
                    <option value="">اختر المدينة</option>
                    {cities.map((city) => (
                      <option key={city.cityId} value={city.cityId}>
                        {city.name}
                        {city.baseFee != null ? ` - رسوم التوصيل ₪${Number(city.baseFee).toFixed(2)}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="العنوان التفصيلي" error={fieldErrors.deliveryLocation}>
                  <input
                    type="text"
                    value={form.deliveryLocation}
                    onChange={set("deliveryLocation")}
                    placeholder="الشارع، الحي، رقم المبنى..."
                    className={inputCls}
                    dir="rtl"
                  />
                </Field>

                <Field label="ملاحظات للمندوب" error={fieldErrors.deliveryNote}>
                  <textarea
                    value={form.deliveryNote}
                    onChange={set("deliveryNote")}
                    placeholder="أي ملاحظات إضافية تساعد في التوصيل"
                    rows={4}
                    maxLength={255}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    dir="rtl"
                  />
                </Field>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="customer-primary-btn w-full disabled:opacity-50">
              {submitting ? <FiLoader size={14} className="animate-spin" /> : <FiCheck size={14} />}
              {submitting ? "جارٍ تأكيد الطلب..." : "تأكيد الطلب"}
            </button>
          </form>

          <div className="self-start lg:sticky lg:top-28">
            <div className="customer-panel-strong overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-extrabold text-slate-900">ملخص الطلب</h2>
              </div>

              <div className="max-h-80 space-y-3 overflow-y-auto px-5 py-5">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-slate-900">{item.productName}</p>
                      {item.variantName ? <p className="mt-1 text-xs text-slate-500">{item.variantName}</p> : null}
                      <p className="mt-1 text-xs text-slate-400">× {item.quantity}</p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-slate-900">₪{fmt(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>المجموع الفرعي</span>
                  <span>₪{fmt(cart.totalAmount)}</span>
                </div>

                {selectedCity?.baseFee != null ? (
                  <div className="mt-2 flex justify-between text-slate-500">
                    <span>رسوم التوصيل</span>
                    <span>₪{fmt(selectedCity.baseFee)}</span>
                  </div>
                ) : null}

                <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">
                  <span>الإجمالي</span>
                  <span>
                    ₪
                    {selectedCity?.baseFee != null
                      ? fmt(Number(cart.totalAmount ?? 0) + Number(selectedCity.baseFee ?? 0))
                      : fmt(cart.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="customer-divider mt-12" />
      </div>

      <Footer />
    </div>
  );
}
