export const CSV_TEMPLATE_HEADERS = [
  "title",
  "body",
  "rating",
  "review_date",
  "source",
  "curated",
  "reviewer_name",
  "reviewer_email",
  "product_id",
  "product_handle",
  "reply",
  "reply_date",
  "picture_urls",
];

export const CSV_TEMPLATE_SAMPLE_ROWS = [
  [
    "Great everyday shoes",
    "Comfortable from day one. True to size and the cushioning is excellent for long walks.",
    "5",
    "2025-08-15",
    "csv_import",
    "true",
    "Casey Garcia",
    "casey.garcia@example.com",
    "42",
    "everyday-runner",
    "",
    "",
    "https://example.com/images/review-1.jpg",
  ],
  [
    "Solid value",
    "Good quality for the price. Shipping was fast. Would buy again.",
    "4",
    "2025-09-02",
    "csv_import",
    "true",
    "Jordan Lee",
    "jordan.lee@example.com",
    "42",
    "everyday-runner",
    "Thanks for your feedback!",
    "2025-09-05",
    "",
  ],
];

export const REVIEW_FIELDS = [
  { key: "title", label: "Review title", required: false },
  {
    key: "body",
    label: "Review body",
    required: true,
    hint: "Main content of the review",
  },
  { key: "rating", label: "Rating", required: true, hint: "1 to 5 stars" },
  { key: "review_date", label: "Review date", required: false },
  { key: "reviewer_name", label: "Reviewer name", required: false },
  { key: "reviewer_email", label: "Reviewer email", required: false },
  { key: "reply", label: "Reply", required: false, hint: "The public reply of the review" },
  {
    key: "picture_urls",
    label: "Picture URLs",
    required: false,
    hint: "URLs of images (comma or pipe separated)",
  },
  { key: "source", label: "Source", required: false },
  { key: "curated", label: "Curated", required: false },
];

export const OPTIONAL_FIELD_WARNINGS = {
  review_date:
    "You did not select a column that corresponds to the review date. This means we will assign today's date to all your reviews.",
  reviewer_name:
    "You did not map reviewer name. Imported reviews will use a generic reviewer label.",
  reviewer_email:
    "You did not map reviewer email. Email will be left empty for imported reviews.",
  title: "You did not map review title. Titles will be left empty.",
  reply: "You did not map a reply column. Replies will not be imported.",
  picture_urls: "You did not map picture URLs. Review images will not be imported.",
};

export const PRODUCT_MATCH_TYPES = [
  {
    id: "product_id",
    label: "Product ID",
    description: "Match by internal product ID",
    columnLabel: "Product ID column in your file",
  },
  {
    id: "product_url",
    label: "Product URL",
    description: "Match by product page URL",
    columnLabel: "Product URL column in your file",
  },
  {
    id: "product_handle",
    label: "Handle",
    description: "Match by URL handle / slug",
    columnLabel: "Product handle column in your file",
  },
  {
    id: "product_sku",
    label: "SKU",
    description: "Match by stock keeping unit",
    columnLabel: "Product SKU column in your file",
  },
  {
    id: "manual",
    label: "Manual mapping",
    description: "Match by a reference column",
    columnLabel: "Reference column in your file",
  },
];

export const WIZARD_STEPS = [
  { id: 0, label: "Select Source", sublabel: "Choose import source" },
  { id: 1, label: "Upload file", sublabel: "Add your export file" },
  { id: 2, label: "Map columns", sublabel: "Match review fields" },
  { id: 3, label: "Product identifier", sublabel: "Choose matching method" },
  { id: 4, label: "Preview", sublabel: "Review import summary" },
];

const HEADER_ALIASES = {
  title: ["title", "review_title"],
  body: ["body", "review_body", "content", "review", "review_content"],
  rating: ["rating", "stars", "score"],
  review_date: ["review_date", "date", "created_at", "reviewed_at"],
  reviewer_name: ["reviewer_name", "name", "author", "customer_name"],
  reviewer_email: ["reviewer_email", "email", "customer_email"],
  reply: ["reply", "merchant_reply", "store_reply"],
  picture_urls: ["picture_urls", "pictures", "images", "image_urls", "photos"],
  source: ["source"],
  curated: ["curated", "published", "approved"],
};

function escapeCsvCell(value) {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function guessColumnMapping(headers) {
  const mapping = {};
  const normalized = headers.map((h) => String(h || "").trim().toLowerCase());

  REVIEW_FIELDS.forEach((field) => {
    const aliases = HEADER_ALIASES[field.key] || [field.key];
    const index = normalized.findIndex((h) => aliases.includes(h));
    mapping[field.key] = index >= 0 ? index : null;
  });

  return mapping;
}

export function downloadCsvTemplate() {
  const lines = [
    CSV_TEMPLATE_HEADERS.map(escapeCsvCell).join(","),
    ...CSV_TEMPLATE_SAMPLE_ROWS.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  const blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hyoka-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
