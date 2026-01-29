export function normalizeProducts(rawJson) {
  const arr = rawJson?.data || [];
  return arr.map((p) => {
    const price = Number(p.price ?? 0);
    const oldPrice = p.old_price != null ? Number(p.old_price) : null;

    return {
      id: String(p.product_id),
      name: p.name ?? "",
      price,
      oldPrice,
      imageUrl: p.image_url ?? "",
      categoryId: String(p.category_id),
      mallId: String(p.mall_id),
      storeId: String(p.shop_id),
      status: p.status ?? "",
    };
  });
}

export function isDiscount(p) {
  return p.oldPrice != null && p.oldPrice > p.price;
}

export function discountAmount(p) {
  return isDiscount(p) ? Math.round(p.oldPrice - p.price) : 0;
}

export function isOutOfStock(p) {
  return (p.status || "").includes("نفذت");
}
