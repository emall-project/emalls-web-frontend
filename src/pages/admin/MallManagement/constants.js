export const MALL_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
];

export const STATUS_LABELS = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  MAINTENANCE: "صيانة",
};

export const STATUS_COLORS = {
  ACTIVE: { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)" },
  INACTIVE: { bg: "var(--red-a3)", fg: "var(--red-11)", dot: "var(--red-9)" },
  MAINTENANCE: { bg: "var(--blue-a3)", fg: "var(--blue-11)", dot: "var(--blue-9)" },
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
