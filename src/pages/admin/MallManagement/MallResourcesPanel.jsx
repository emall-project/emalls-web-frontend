import { useCallback, useEffect, useState } from "react";
import { FiEdit2, FiLoader, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { accountsApi, unwrapAccountPayload } from "../../../api/accounts";
import { MediaUuidField } from "../../../components/account/MediaUuidField";

const inputClass = "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const inputStyle = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" };

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>{label}</label>
      {children}
    </div>
  );
}

function ResourceList({ title, items, getName, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a1, var(--gray-1))" }}>
      <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item) => (
          <div key={item.serviceId || item.restaurantId} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{getName(item)}</div>
              <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                {item.isActive === false ? "غير نشط" : "نشط"}
              </div>
            </div>
            <button type="button" onClick={() => onEdit(item)} className="rounded-lg border p-2" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }} title="تعديل">
              <FiEdit2 size={14} />
            </button>
            <button type="button" onClick={() => onDelete(item)} className="rounded-lg p-2" style={{ color: "var(--red-9)" }} title="حذف">
              <FiTrash2 size={14} />
            </button>
          </div>
        )) : (
          <div className="rounded-xl border px-3 py-6 text-center text-sm" style={{ borderColor: "var(--gray-a5)", color: "var(--gray-10)" }}>
            لا توجد بيانات
          </div>
        )}
      </div>
    </div>
  );
}

export function MallResourcesPanel({ mallId }) {
  const [services, setServices] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [serviceForm, setServiceForm] = useState({ serviceId: null, name: "", description: "", isActive: true });
  const [restaurantForm, setRestaurantForm] = useState({
    restaurantId: null,
    name: "",
    cuisineType: "",
    locationInMall: "",
    description: "",
    logoUuid: "",
    logoFile: null,
    isActive: true,
  });

  const load = useCallback(async () => {
    if (!mallId) return;
    setLoading(true);
    try {
      const [serviceResponse, restaurantResponse] = await Promise.all([
        accountsApi.mallServices.byMall(mallId),
        accountsApi.mallRestaurants.byMall(mallId),
      ]);
      const nextServices = unwrapAccountPayload(serviceResponse);
      const nextRestaurants = unwrapAccountPayload(restaurantResponse);
      setServices(Array.isArray(nextServices) ? nextServices : []);
      setRestaurants(Array.isArray(nextRestaurants) ? nextRestaurants : []);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "فشل تحميل خدمات ومطاعم المول" });
    } finally {
      setLoading(false);
    }
  }, [mallId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetService = () => setServiceForm({ serviceId: null, name: "", description: "", isActive: true });
  const resetRestaurant = () => setRestaurantForm({ restaurantId: null, name: "", cuisineType: "", locationInMall: "", description: "", logoUuid: "", logoFile: null, isActive: true });

  const saveService = async (event) => {
    event.preventDefault();
    if (!serviceForm.name.trim()) return setMessage({ type: "error", text: "اسم الخدمة مطلوب" });
    setSaving(true);
    try {
      const body = {
        ...(serviceForm.serviceId ? { serviceId: serviceForm.serviceId } : {}),
        mall: { mallId: Number(mallId) },
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || null,
        isActive: serviceForm.isActive,
      };
      if (serviceForm.serviceId) await accountsApi.mallServices.update(body);
      else await accountsApi.mallServices.create(body);
      setMessage({ type: "success", text: "تم حفظ الخدمة" });
      resetService();
      load();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "فشل حفظ الخدمة" });
    } finally {
      setSaving(false);
    }
  };

  const saveRestaurant = async (event) => {
    event.preventDefault();
    if (!restaurantForm.name.trim()) return setMessage({ type: "error", text: "اسم المطعم مطلوب" });
    setSaving(true);
    try {
      const body = {
        ...(restaurantForm.restaurantId ? { restaurantId: restaurantForm.restaurantId } : {}),
        mall: { mallId: Number(mallId) },
        name: restaurantForm.name.trim(),
        cuisineType: restaurantForm.cuisineType.trim() || null,
        locationInMall: restaurantForm.locationInMall.trim() || null,
        description: restaurantForm.description.trim() || null,
        logoUuid: restaurantForm.logoUuid.trim() || null,
        isActive: restaurantForm.isActive,
      };
      if (restaurantForm.restaurantId) await accountsApi.mallRestaurants.update(body);
      else await accountsApi.mallRestaurants.create(body);
      setMessage({ type: "success", text: "تم حفظ المطعم" });
      resetRestaurant();
      load();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "فشل حفظ المطعم" });
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (service) => {
    if (!window.confirm(`حذف الخدمة ${service.name}؟`)) return;
    await accountsApi.mallServices.delete(service.serviceId);
    load();
  };

  const deleteRestaurant = async (restaurant) => {
    if (!window.confirm(`حذف المطعم ${restaurant.name}؟`)) return;
    await accountsApi.mallRestaurants.delete(restaurant.restaurantId);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>خدمات ومطاعم المول</h2>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
          {loading ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
          تحديث
        </button>
      </div>

      {message ? (
        <div className="rounded-xl border px-3 py-2 text-sm" style={{
          background: message.type === "success" ? "var(--green-a2)" : "var(--red-a2)",
          borderColor: message.type === "success" ? "var(--green-a6)" : "var(--red-a6)",
          color: message.type === "success" ? "var(--green-11)" : "var(--red-11)",
        }}>
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <ResourceList
            title="الخدمات"
            items={services}
            getName={(service) => service.name}
            onEdit={(service) => setServiceForm({
              serviceId: service.serviceId,
              name: service.name || "",
              description: service.description || "",
              isActive: service.isActive !== false,
            })}
            onDelete={deleteService}
          />
          <form onSubmit={saveService} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a1, var(--gray-1))" }}>
            <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{serviceForm.serviceId ? "تعديل خدمة" : "إضافة خدمة"}</h3>
            <Field label="اسم الخدمة">
              <input className={inputClass} style={inputStyle} value={serviceForm.name} onChange={(event) => setServiceForm((previous) => ({ ...previous, name: event.target.value }))} />
            </Field>
            <Field label="الوصف">
              <textarea className={inputClass} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={serviceForm.description} onChange={(event) => setServiceForm((previous) => ({ ...previous, description: event.target.value }))} />
            </Field>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--gray-11)" }}>
              <input type="checkbox" checked={serviceForm.isActive} onChange={(event) => setServiceForm((previous) => ({ ...previous, isActive: event.target.checked }))} />
              نشطة
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
                <FiPlus />
                حفظ الخدمة
              </button>
              {serviceForm.serviceId ? <button type="button" onClick={resetService} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>إلغاء</button> : null}
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <ResourceList
            title="المطاعم"
            items={restaurants}
            getName={(restaurant) => restaurant.name}
            onEdit={(restaurant) => setRestaurantForm({
              restaurantId: restaurant.restaurantId,
              name: restaurant.name || "",
              cuisineType: restaurant.cuisineType || "",
              locationInMall: restaurant.locationInMall || "",
              description: restaurant.description || "",
              logoUuid: restaurant.logoUuid || "",
              logoFile: restaurant.logoImage || null,
              isActive: restaurant.isActive !== false,
            })}
            onDelete={deleteRestaurant}
          />
          <form onSubmit={saveRestaurant} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a1, var(--gray-1))" }}>
            <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{restaurantForm.restaurantId ? "تعديل مطعم" : "إضافة مطعم"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="اسم المطعم">
                <input className={inputClass} style={inputStyle} value={restaurantForm.name} onChange={(event) => setRestaurantForm((previous) => ({ ...previous, name: event.target.value }))} />
              </Field>
              <Field label="نوع المطبخ">
                <input className={inputClass} style={inputStyle} value={restaurantForm.cuisineType} onChange={(event) => setRestaurantForm((previous) => ({ ...previous, cuisineType: event.target.value }))} />
              </Field>
              <Field label="الموقع">
                <input className={inputClass} style={inputStyle} value={restaurantForm.locationInMall} onChange={(event) => setRestaurantForm((previous) => ({ ...previous, locationInMall: event.target.value }))} />
              </Field>
            </div>
            <Field label="الوصف">
              <textarea className={inputClass} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={restaurantForm.description} onChange={(event) => setRestaurantForm((previous) => ({ ...previous, description: event.target.value }))} />
            </Field>
            <MediaUuidField
              label="شعار المطعم"
              value={restaurantForm.logoUuid}
              onChange={(value) => setRestaurantForm((previous) => ({ ...previous, logoUuid: value }))}
              file={restaurantForm.logoFile}
              onFileChange={(file) => setRestaurantForm((previous) => ({ ...previous, logoFile: file }))}
              mode="admin"
              pickerTitle="اختيار شعار المطعم"
            />
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--gray-11)" }}>
              <input type="checkbox" checked={restaurantForm.isActive} onChange={(event) => setRestaurantForm((previous) => ({ ...previous, isActive: event.target.checked }))} />
              نشط
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
                <FiPlus />
                حفظ المطعم
              </button>
              {restaurantForm.restaurantId ? <button type="button" onClick={resetRestaurant} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>إلغاء</button> : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
