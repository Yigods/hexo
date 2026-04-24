const moment = require("moment");

function arrayify(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function slugify(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseEssayDate(value) {
  if (value instanceof Date) {
    return moment(value);
  }

  if (moment.isMoment(value)) {
    return value.clone();
  }

  const parsed = moment(value, ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm", moment.ISO_8601], true);
  return parsed.isValid() ? parsed : moment(value);
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return false;
}

function normalizeEssay(rawEssay, index, usedSlugs) {
  const raw = rawEssay && typeof rawEssay === "object" ? rawEssay : {};
  const content = String(raw.content || "").trim();
  const parsedDate = parseEssayDate(raw.date);
  const date = parsedDate.isValid()
    ? parsedDate.clone().utc().format("YYYY-MM-DD HH:mm:ss")
    : String(raw.date || "").trim();
  const datePart = parsedDate.isValid() ? parsedDate.format("YYYYMMDD-HHmm") : "undated";
  const excerptPart = slugify(content.replace(/[#>*`\[\]()!]/g, " ").slice(0, 36)) || "entry";
  const requestedSlug = String(raw.slug || "").trim();
  let slug = slugify(requestedSlug || `essay-${datePart}-${excerptPart}`) || `essay-${index + 1}`;

  if (usedSlugs.has(slug)) {
    let suffix = 2;
    while (usedSlugs.has(`${slug}-${suffix}`)) {
      suffix += 1;
    }
    slug = `${slug}-${suffix}`;
  }
  usedSlugs.add(slug);

  const title = String(raw.title || "").trim() || content.split(/\n+/)[0].trim().slice(0, 40) || "说说";
  const images = arrayify(raw.images || raw.image).slice(0, 9);
  const videos = arrayify(raw.videos || raw.video);

  return {
    ...raw,
    title,
    slug,
    url: `/essays/${slug}/`,
    content,
    date,
    dateValue: parsedDate.isValid() ? parsedDate.valueOf() : 0,
    images,
    videos,
    location_name: String(raw.location_name || raw.location || "").trim(),
    location_url: String(raw.location_url || "").trim(),
    pinned: normalizeBoolean(raw.pinned || raw.sticky || raw.top),
    likes: Math.max(0, Number.parseInt(raw.likes, 10) || 0),
  };
}

function normalizeEssays(essays) {
  const usedSlugs = new Set();
  return (Array.isArray(essays) ? essays : []).map((essay, index) => normalizeEssay(essay, index, usedSlugs));
}

function getRawEssays() {
  const data = hexo.locals.get("data") || {};
  return data.essays || data.essay || data.shuoshuo || [];
}

function getSortedEssays(essays) {
  return normalizeEssays(essays).sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.dateValue - a.dateValue;
  });
}

hexo.extend.helper.register("getNormalizedEssays", function (essays) {
  return getSortedEssays(essays);
});

hexo.extend.helper.register("getEssayUrl", function (essay) {
  return essay && essay.url ? essay.url : "/essays/";
});

hexo.extend.generator.register("essay_detail_pages", function () {
  const essays = getSortedEssays(getRawEssays());

  return essays.map((essay) => ({
    path: `essays/${essay.slug}/index.html`,
    data: {
      layout: "page",
      template: "essay-detail",
      type: "essay-detail",
      title: essay.title,
      comment: true,
      comments: true,
      essay,
    },
    layout: ["page"],
  }));
});
