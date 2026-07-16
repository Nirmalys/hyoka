export const PROVIDER_IMAGE_PATHS = {
  judgeme: "images/judgem.webp",
  yotpo: "images/yotpo.webp",
  csv: "images/excel.webp",
};

export function getProviderImageUrl(providerId) {
  const base = window.hyokaData?.assetsUrl || "";
  const path = PROVIDER_IMAGE_PATHS[providerId];
  if (!base || !path) {
    return null;
  }
  return `${base}${path}`;
}

export const IMPORT_PROVIDER_ACCENTS = {
  violet: {
    ring: "ring-violet-200",
    border: "border-violet-200",
    bg: "bg-violet-50",
    badge: "bg-violet-100 text-violet-800",
    dot: "bg-violet-500",
  },
  blue: {
    ring: "ring-blue-200",
    border: "border-blue-200",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
  orange: {
    ring: "ring-orange-200",
    border: "border-orange-200",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-800",
    dot: "bg-orange-500",
  },
  purple: {
    ring: "ring-purple-200",
    border: "border-purple-200",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-800",
    dot: "bg-purple-500",
  },
};

export const DEFAULT_IMPORT_PROVIDERS = [
  {
    id: "judgeme",
    label: "Judge.me",
    description:
      "Import reviews exported from Judge.me. Column names from Judge.me exports are detected automatically.",
    status: "active",
    import_type: "file",
    accent: "violet",
    icon: "judgeme",
    config: {
      default_product_match: "product_handle",
      upload_help:
        "In Judge.me: Reviews → Import & Export → Export reviews. Upload that CSV file here.",
      product_match_hint:
        "Judge.me files usually include product_handle (slug) or product_id. Handle matching works best for WooCommerce.",
    },
  },
  {
    id: "yotpo",
    label: "Yotpo",
    description:
      "Import reviews exported from Yotpo (CSV). Yotpo column labels such as Review Score and Review Content are mapped automatically.",
    status: "active",
    import_type: "file",
    accent: "blue",
    icon: "yotpo",
    config: {
      default_product_match: "product_sku",
      upload_help:
        "In Yotpo: Reviews → Export. Upload the CSV export — we map Yotpo headers to Hyoka fields.",
      product_match_hint:
        "Yotpo exports often include Product SKU or Product ID. SKU is recommended for WooCommerce stores.",
    },
  },
  {
    id: "csv",
    label: "CSV / Excel",
    description:
      "Generic spreadsheet import — use our template or any export with review columns.",
    status: "active",
    import_type: "file",
    accent: "orange",
    icon: "spreadsheet",
    config: {
      default_product_match: "product_id",
      upload_help:
        "Upload a CSV file or save your Excel sheet as CSV. Download our template if you are building a file from scratch.",
    },
  },
];

/** Client-side fallback aliases (server sends fuller lists via AJAX). */
export const PROVIDER_HEADER_ALIASES = {
  judgeme: {
    title: ["title", "review_title"],
    body: ["body", "review", "review_body", "content"],
    rating: ["rating", "star_rating", "stars", "score"],
    review_date: ["review_date", "created_at", "date", "reviewed_at"],
    reviewer_name: ["reviewer_name", "reviewer", "author", "customer_name", "name"],
    reviewer_email: ["reviewer_email", "email", "customer_email"],
    reply: ["reply", "public_reply", "store_reply", "merchant_reply"],
    picture_urls: [
      "picture_urls",
      "pictures",
      "review_pictures",
      "photos",
      "images",
      "imageurl",
      "image_url",
    ],
    source: ["source", "review_source"],
    curated: ["curated", "published", "state"],
    product_id: ["product_id", "shopify_product_id", "woocommerce_product_id"],
    product_handle: ["product_handle", "handle", "product_slug", "slug"],
    product_sku: ["sku", "product_sku"],
  },
  yotpo: {
    title: ["title", "review_title", "review title"],
    body: ["body", "review_content", "review content", "content", "review_body"],
    rating: ["rating", "review_score", "review score", "score", "stars"],
    review_date: ["review_date", "review date", "created_at", "review created date"],
    reviewer_name: ["reviewer_name", "reviewer display name", "reviewer", "name", "customer_name"],
    reviewer_email: ["reviewer_email", "reviewer email", "email"],
    reply: ["reply", "comment", "merchant_comment", "merchant comment"],
    picture_urls: [
      "picture_urls",
      "published_image_url",
      "published image url",
      "images",
      "image_urls",
    ],
    source: ["source", "review_source", "review source"],
    product_id: ["product_id", "product id", "external_product_id"],
    product_handle: ["product_handle", "product handle", "handle"],
    product_sku: ["sku", "product_sku", "product sku"],
  },
  csv: {},
};

/** Normalize header for fuzzy alias matching (matches PHP ImportSanitizer). */
export function normalizeHeader(header) {
  let h = String(header ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "");
  h = h.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return h;
}

export function findProvider(providers, providerId) {
  const list = providers?.length ? providers : DEFAULT_IMPORT_PROVIDERS;
  return list.find((p) => p.id === providerId) || null;
}

function getAliasesForProvider(providerId, providers) {
  const provider = findProvider(providers, providerId);
  if (provider?.header_aliases && Object.keys(provider.header_aliases).length > 0) {
    return provider.header_aliases;
  }
  return PROVIDER_HEADER_ALIASES[providerId] || {};
}

/**
 * Map review columns (not product identifier columns).
 */
export function guessColumnMappingForProvider(headers, providerId, baseGuessFn, providers) {
  const aliases = getAliasesForProvider(providerId, providers);
  if (!aliases || Object.keys(aliases).length === 0) {
    return baseGuessFn(headers);
  }

  const mapping = { ...baseGuessFn(headers) };
  const normalized = headers.map(normalizeHeader);

  Object.keys(aliases).forEach((fieldKey) => {
    if (fieldKey.startsWith("product_")) {
      return;
    }
    const list = (aliases[fieldKey] || []).map(normalizeHeader);
    const index = normalized.findIndex((h) => list.includes(h));
    if (index >= 0) {
      mapping[fieldKey] = index;
    }
  });

  return mapping;
}

/**
 * Pick the CSV column index for product matching (ID, handle, SKU, etc.).
 */
export function guessProductColumnIndex(headers, matchType, providerId, providers) {
  const aliases = getAliasesForProvider(providerId, providers);
  const provider = findProvider(providers, providerId);
  const recommended = provider?.config?.recommended_product_columns || [];

  const byMatchType = {
    product_id: ["product_id", "id", "woocommerce_product_id", "external_product_id"],
    product_url: ["product_url", "url", "link", "product_link"],
    product_handle: ["product_handle", "handle", "slug", "product_slug"],
    product_sku: ["sku", "product_sku", "product sku"],
    manual: ["reference", "product_reference"],
  };

  const keys = [
    ...(aliases[matchType] || []),
    ...(aliases[`product_${matchType.replace("product_", "")}`] || []),
    ...(byMatchType[matchType] || []),
    ...recommended.filter((k) => k.includes(matchType.replace("product_", "")) || k === matchType),
  ];

  const list = [...new Set(keys.map(normalizeHeader))];
  const normalized = headers.map(normalizeHeader);
  const index = normalized.findIndex((h) => list.includes(h));
  return index >= 0 ? index : -1;
}

export function getProviderLabel(providerId, providers) {
  return findProvider(providers, providerId)?.label || providerId;
}

export function getProviderUploadHelp(providerId, providers) {
  const provider = findProvider(providers, providerId);
  return provider?.config?.upload_help || "";
}

export function getProviderProductMatchHint(providerId, providers) {
  const provider = findProvider(providers, providerId);
  return provider?.config?.product_match_hint || "";
}

export function getDefaultProductMatch(providerId, providers) {
  const provider = findProvider(providers, providerId);
  return provider?.config?.default_product_match || "product_id";
}
