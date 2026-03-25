export const MALL_STATUSES = [
  "ACTIVE", "INACTIVE", "MAINTENANCE", "COMING_SOON", "UNDER_CONSTRUCTION",
];

export const STATUS_LABELS = {
  ACTIVE:             "نشط",
  INACTIVE:           "غير نشط",
  MAINTENANCE:        "صيانة",
  COMING_SOON:        "قريباً",
  UNDER_CONSTRUCTION: "تحت الإنشاء",
};

export const STATUS_COLORS = {
  ACTIVE:             { bg: "#dcfce7", fg: "#16a34a", dot: "#16a34a" },
  INACTIVE:           { bg: "#fee2e2", fg: "#dc2626", dot: "#ef4444" },
  MAINTENANCE:        { bg: "#dbeafe", fg: "#2563eb", dot: "#3b82f6" },
  COMING_SOON:        { bg: "#fef9c3", fg: "#ca8a04", dot: "#eab308" },
  UNDER_CONSTRUCTION: { bg: "#f1f5f9", fg: "#64748b", dot: "#94a3b8" },
};

// ── Fake mall for development/testing ─────────────────────────────────────────
export const FAKE_MALL = {
  mallId: 999,
  name: "سيتي مول - تجريبي",
  location: "شارع الإرسال، وسط المدينة",
  city: { cityId: 1, name: "رام الله", baseFee: 15 },
  capacity: 250,
  status: "ACTIVE",
  logoUrl: "https://images.unsplash.com/photo-1519567241046-7f570eee3d9f?auto=format&fit=crop&w=80&q=80",
  description: "أحد أكبر مراكز التسوق في المنطقة، يضم أكثر من 200 متجر.",
  contactInfo: { phone: "+970599000000", email: "info@citymall.ps" },
  services: [
    { serviceId: 1, name: "موقف سيارات", isActive: true },
    { serviceId: 2, name: "واي فاي مجاني", isActive: true },
    { serviceId: 3, name: "سينما", isActive: false },
  ],
  createdAt: "2024-01-15T10:00:00",
  createdBy: "admin",
  updatedAt: null,
  updatedBy: null,
};

export const GLOBAL_STYLES = `
  @keyframes dropIn {
    from { opacity:0; transform:translateY(-6px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  :root {
    --f-bg:#f9fafb; --f-bg-open:#fff; --f-border:rgba(0,0,0,.10);
    --f-border-focus:#2563eb; --f-ring:rgba(37,99,235,.13);
    --f-text:#111827; --f-placeholder:#9ca3af; --f-icon:#9ca3af;
    --f-panel:#fff; --f-panel-border:rgba(0,0,0,.09);
    --f-panel-shadow:0 8px 32px rgba(0,0,0,.13),0 2px 8px rgba(0,0,0,.06);
    --f-item-hover:rgba(0,0,0,.05); --f-item-active:rgba(37,99,235,.09);
    --f-item-active-text:#2563eb; --f-chip-bg:rgba(37,99,235,.10);
    --f-chip-text:#2563eb; --f-divider:rgba(0,0,0,.07);
    --f-search-bg:#f3f4f6; --f-chevron:#9ca3af;
    --dropdown-bg:#fff; --dropdown-border:rgba(0,0,0,.10);
    --dropdown-fg:#111827; --dropdown-label:#9ca3af;
    --dropdown-separator:rgba(0,0,0,.07); --dropdown-danger:#ef4444;
  }
  .dark {
    --f-bg:#1f2937; --f-bg-open:#111827; --f-border:rgba(255,255,255,.10);
    --f-border-focus:#3b82f6; --f-ring:rgba(59,130,246,.18);
    --f-text:#f9fafb; --f-placeholder:#6b7280; --f-icon:#6b7280;
    --f-panel:#1e2736; --f-panel-border:rgba(255,255,255,.10);
    --f-panel-shadow:0 8px 32px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.30);
    --f-item-hover:rgba(255,255,255,.06); --f-item-active:rgba(59,130,246,.15);
    --f-item-active-text:#60a5fa; --f-chip-bg:rgba(59,130,246,.18);
    --f-chip-text:#60a5fa; --f-divider:rgba(255,255,255,.08);
    --f-search-bg:#111827; --f-chevron:#6b7280;
    --dropdown-bg:#1e2736; --dropdown-border:rgba(255,255,255,.10);
    --dropdown-fg:#f9fafb; --dropdown-label:#6b7280;
    --dropdown-separator:rgba(255,255,255,.08); --dropdown-danger:#f87171;
  }
  .f-trigger {
    width:100%; display:flex; align-items:center; justify-content:space-between;
    gap:8px; border-radius:12px; padding:10px 16px; font-size:14px;
    cursor:pointer; outline:none;
    transition:background .15s,border-color .15s,box-shadow .15s;
    background:var(--f-bg); border:1px solid var(--f-border); color:var(--f-text); text-align:right;
  }
  .f-trigger:hover { border-color:var(--f-border-focus); }
  .f-trigger.open,.f-trigger:focus-within {
    background:var(--f-bg-open); border-color:var(--f-border-focus);
    box-shadow:0 0 0 3px var(--f-ring);
  }
  .f-input {
    width:100%; border-radius:12px; padding:10px 16px; font-size:14px;
    outline:none; transition:background .15s,border-color .15s,box-shadow .15s;
    background:var(--f-bg); border:1px solid var(--f-border); color:var(--f-text); text-align:right;
  }
  .f-input::placeholder { color:var(--f-placeholder); }
  .f-input:hover { border-color:var(--f-border-focus); }
  .f-input:focus {
    background:var(--f-bg-open); border-color:var(--f-border-focus);
    box-shadow:0 0 0 3px var(--f-ring);
  }
  .f-panel {
    position:absolute; top:calc(100% + 6px); right:0; left:0; z-index:999;
    border-radius:14px; overflow:hidden; animation:dropIn .16s cubic-bezier(.16,1,.3,1);
    background:var(--f-panel); border:1px solid var(--f-panel-border);
    box-shadow:var(--f-panel-shadow);
  }
  .f-item {
    width:100%; display:flex; align-items:center; gap:10px; padding:9px 12px;
    border-radius:8px; font-size:14px; text-align:right; cursor:pointer;
    outline:none; border:none; background:transparent; color:var(--f-text); transition:background .1s;
  }
  .f-item:hover  { background:var(--f-item-hover); }
  .f-item.active { background:var(--f-item-active); color:var(--f-item-active-text); font-weight:600; }
  .f-chip {
    display:inline-flex; align-items:center; gap:4px; padding:2px 8px;
    border-radius:999px; font-size:11px; font-weight:500;
    background:var(--f-chip-bg); color:var(--f-chip-text); white-space:nowrap;
  }
  .f-divider { border-top:1px solid var(--f-divider); }
  .admin-dropdown-item:hover { background:var(--f-item-hover) !important; }
  .spinning  { animation: spin .8s linear infinite; }
  .fade-in   { animation: fadeIn .25s ease; }
  .slide-up  { animation: slideUp .25s ease; }
`;