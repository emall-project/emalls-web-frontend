export const SHOP_STATUSES = ["ACTIVE", "INACTIVE", "MAINTENANCE", "COMING_SOON"];

export const SHOP_STATUS_LABELS = {
  ACTIVE:      "نشط",
  INACTIVE:    "غير نشط",
  MAINTENANCE: "صيانة",
  COMING_SOON: "قريباً",
};

export const SHOP_STATUS_COLORS = {
  ACTIVE:      { bg: "#dcfce7", fg: "#16a34a", dot: "#16a34a" },
  INACTIVE:    { bg: "#fee2e2", fg: "#dc2626", dot: "#ef4444" },
  MAINTENANCE: { bg: "#dbeafe", fg: "#2563eb", dot: "#3b82f6" },
  COMING_SOON: { bg: "#fef9c3", fg: "#ca8a04", dot: "#eab308" },
};

export const SHOP_CATEGORIES = [
  "CLOTHING", "ELECTRONICS", "FOOD", "PHARMACY", "BEAUTY",
  "SPORTS", "BOOKS", "JEWELRY", "HOME", "TOYS", "OTHER",
];

export const CATEGORY_LABELS = {
  CLOTHING:    "ملابس",
  ELECTRONICS: "إلكترونيات",
  FOOD:        "طعام",
  PHARMACY:    "صيدلية",
  BEAUTY:      "تجميل",
  SPORTS:      "رياضة",
  BOOKS:       "كتب",
  JEWELRY:     "مجوهرات",
  HOME:        "منزل",
  TOYS:        "ألعاب",
  OTHER:       "أخرى",
};

export const FAKE_SHOP = {
  shopId:      999,
  name:        "Tech World - تجريبي",
  category:    "ELECTRONICS",
  description: "متجر إلكترونيات تجريبي",
  location:    "الطابق الثاني - قسم B",
  status:      "ACTIVE",
  logoUrl:     "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=80&q=80",
  mall:        { mallId: 1, name: "سيتي سنتر", status: "ACTIVE" },
  owner:       { userId: 1, username: "admin" },
  contactInfo: { phone: "+970599000000", email: "tech@shop.ps" },
  createdAt:   "2024-01-15T10:00:00",
  createdBy:   "admin",
};