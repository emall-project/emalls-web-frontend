import { getMediaPreviewUrl } from "../api/mediaManager";

const AUDIENCE_SEGMENTS = [
  { value: "MALE", suffix: "رجالي", countKey: "productForMales" },
  { value: "FEMALE", suffix: "نسائي", countKey: "productForFemales" },
];

const AGE_SEGMENTS = [
  { value: "NEWBORN", suffix: "لحديثي الولادة", countKey: "productSForNewborn" },
  { value: "INFANT", suffix: "للرضع", countKey: "productSForInfant" },
  { value: "TODDLER", suffix: "للأطفال الصغار", countKey: "productSForToddler" },
  { value: "CHILD", suffix: "للأطفال", countKey: "productSForChild" },
  { value: "TEENAGER", suffix: "لليافعين", countKey: "productSForTeenager" },
  { value: "YOUTH", suffix: "للشباب", countKey: "productSForYouth" },
  { value: "ADULT", suffix: "للبالغين", countKey: "productSForAdult" },
];

const CHILD_AGE_GROUPS = new Set(["NEWBORN", "INFANT", "TODDLER", "CHILD"]);
const YOUTH_AGE_GROUPS = new Set(["TEENAGER", "YOUTH"]);
const VALID_AUDIENCES = new Set(["MALE", "FEMALE", "ALL"]);
const VALID_AGE_GROUPS = new Set(["NEWBORN", "INFANT", "TODDLER", "CHILD", "TEENAGER", "YOUTH", "ADULT", "ALL"]);

function count(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function positiveSegments(segments, distribution = {}) {
  return segments
    .map((segment) => ({ ...segment, totalProducts: count(distribution?.[segment.countKey]) }))
    .filter((segment) => segment.totalProducts > 0);
}

function configImageUrl(config) {
  return (
    config?.imageUrl ||
    config?.imageMediumUrl ||
    config?.imageSmallUrl ||
    getMediaPreviewUrl(config?.image, "medium") ||
    getMediaPreviewUrl(config?.image, "small")
  );
}

function combinedSuffix(audience, ageGroup) {
  if (audience === "MALE") {
    if (CHILD_AGE_GROUPS.has(ageGroup)) return "ولادي";
    if (YOUTH_AGE_GROUPS.has(ageGroup)) return "للشباب";
    if (ageGroup === "ADULT") return "رجالي";
  }

  if (audience === "FEMALE") {
    if (CHILD_AGE_GROUPS.has(ageGroup)) return "بناتي";
    if (YOUTH_AGE_GROUPS.has(ageGroup)) return "للشابات";
    if (ageGroup === "ADULT") return "نسائي";
  }

  const audienceSuffix = AUDIENCE_SEGMENTS.find((segment) => segment.value === audience)?.suffix || "";
  const ageSuffix = AGE_SEGMENTS.find((segment) => segment.value === ageGroup)?.suffix || "";
  return [audienceSuffix, ageSuffix].filter(Boolean).join(" ");
}

function titleFor(category, filters = {}) {
  const name = category?.name || "فئة";
  const suffix = filters.targetedAudience && filters.ageGroup
    ? combinedSuffix(filters.targetedAudience, filters.ageGroup)
    : filters.targetedAudience
    ? AUDIENCE_SEGMENTS.find((segment) => segment.value === filters.targetedAudience)?.suffix
    : filters.ageGroup
    ? AGE_SEGMENTS.find((segment) => segment.value === filters.ageGroup)?.suffix
    : "";

  return suffix ? `${name} ${suffix}` : name;
}

export function getSummaryTotalProducts(summary) {
  return count(summary?.totalProducts);
}

export function getCategoryNodeIds(node) {
  if (!node?.id) return [];
  const childIds = (node.children || []).flatMap(getCategoryNodeIds);
  return Array.from(new Set([Number(node.id), ...childIds].filter(Number.isFinite)));
}

export function filtersFromCategorySearchParams(searchParams) {
  const targetedAudience = searchParams.get("targetedAudience") || "";
  const ageGroup = searchParams.get("ageGroup") || "";

  return {
    targetedAudience: VALID_AUDIENCES.has(targetedAudience) && targetedAudience !== "ALL" ? targetedAudience : "",
    ageGroup: VALID_AGE_GROUPS.has(ageGroup) && ageGroup !== "ALL" ? ageGroup : "",
  };
}

export function buildCategoryExplorationHref(category, filters = {}) {
  const query = new URLSearchParams();
  if (filters.targetedAudience) query.set("targetedAudience", filters.targetedAudience);
  if (filters.ageGroup) query.set("ageGroup", filters.ageGroup);

  const basePath = `/categories/${category?.id}`;
  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function selectCategoryAudienceImage(category, filters = {}) {
  const audience = filters.targetedAudience || "ALL";
  const ageGroup = filters.ageGroup || "ALL";
  const configs = category?.audienceConfig || [];

  const matches = [
    configs.find((config) => config.targetedAudience === audience && config.ageGroup === ageGroup),
    filters.targetedAudience
      ? configs.find((config) => config.targetedAudience === audience && config.ageGroup === "ALL")
      : null,
    filters.ageGroup
      ? configs.find((config) => config.targetedAudience === "ALL" && config.ageGroup === ageGroup)
      : null,
  ];

  return matches.map(configImageUrl).find(Boolean) || category?.imageUrl || category?.imageMediumUrl || category?.imageSmallUrl || "";
}

export function createExplorationCard(category, filters = {}, productCount = null, needsValidation = false) {
  return {
    key: [category?.id, filters.targetedAudience || "ALL", filters.ageGroup || "ALL"].join(":"),
    categoryId: category?.id,
    title: titleFor(category, filters),
    href: buildCategoryExplorationHref(category, filters),
    filters,
    imageUrl: selectCategoryAudienceImage(category, filters),
    productCount,
    needsValidation,
  };
}

export function buildExplorationCandidates(category, summary) {
  const totalProducts = getSummaryTotalProducts(summary);
  if (!category?.id || totalProducts <= 0) {
    return [];
  }

  const audienceSegments = positiveSegments(AUDIENCE_SEGMENTS, summary?.audienceDistribution);
  const ageSegments = positiveSegments(AGE_SEGMENTS, summary?.ageDisTribution);
  const hasAgeSplit = ageSegments.length > 1;

  if (audienceSegments.length && hasAgeSplit) {
    return audienceSegments.flatMap((audience) =>
      ageSegments.map((age) =>
        createExplorationCard(
          category,
          { targetedAudience: audience.value, ageGroup: age.value },
          null,
          true
        )
      )
    );
  }

  if (audienceSegments.length) {
    return audienceSegments.map((audience) =>
      createExplorationCard(category, { targetedAudience: audience.value }, audience.totalProducts)
    );
  }

  if (hasAgeSplit) {
    return ageSegments.map((age) =>
      createExplorationCard(category, { ageGroup: age.value }, age.totalProducts)
    );
  }

  return [createExplorationCard(category, {}, totalProducts)];
}
