const ESSAY_LIKE_STORAGE_PREFIX = "essay-like:";
let essayArchiveState = null;
let didInitEssayArchiveScroll = false;
let activeEssayFilter = "all";

function updateEssayDate(element) {
  const rawDate = element.getAttribute("data-date");
  const locale = config.language || "en";
  const exactNode = element.querySelector(".essay-date-exact");
  const relativeNode = element.querySelector(".essay-date-relative");
  const parsed = moment(rawDate).locale(locale);
  const relativeText = parsed.isValid() ? parsed.calendar() : rawDate || "";

  if (relativeNode) {
    relativeNode.textContent = relativeText;
    return;
  }

  if (!exactNode) {
    element.textContent = relativeText;
  }
}

function getEssayLiked(slug) {
  try {
    return window.localStorage.getItem(`${ESSAY_LIKE_STORAGE_PREFIX}${slug}`) === "1";
  } catch (error) {
    return false;
  }
}

function setEssayLiked(slug, liked) {
  try {
    if (liked) {
      window.localStorage.setItem(`${ESSAY_LIKE_STORAGE_PREFIX}${slug}`, "1");
    } else {
      window.localStorage.removeItem(`${ESSAY_LIKE_STORAGE_PREFIX}${slug}`);
    }
  } catch (error) {
    // Ignore storage failures.
  }
}

function renderEssayLikeButtons(slug) {
  const buttons = document.querySelectorAll(`.essay-like-button[data-essay-slug="${slug}"]`);
  buttons.forEach((button) => {
    const baseLikes = Number.parseInt(button.getAttribute("data-base-likes") || "0", 10) || 0;
    const liked = getEssayLiked(slug);
    const countNode = button.querySelector(".essay-like-count");
    const totalLikes = baseLikes + (liked ? 1 : 0);

    button.setAttribute("aria-pressed", liked ? "true" : "false");
    button.classList.toggle("is-liked", liked);
    if (countNode) {
      countNode.textContent = String(totalLikes);
    }
  });
}

function bindEssayLikeButton(button) {
  const slug = button.getAttribute("data-essay-slug");
  if (!slug || button.dataset.likeBound === "true") {
    return;
  }

  button.dataset.likeBound = "true";
  renderEssayLikeButtons(slug);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const nextLiked = !getEssayLiked(slug);
    setEssayLiked(slug, nextLiked);
    renderEssayLikeButtons(slug);
  });
}

function getEssayFilterCriteria() {
  const rawFrom = document.getElementById("essay-date-from")?.value || "";
  const rawTo = document.getElementById("essay-date-to")?.value || "";
  return {
    keyword: (document.getElementById("essay-search-input")?.value || "").trim().toLocaleLowerCase(),
    month: document.getElementById("essay-month-input")?.value || "",
    from: rawFrom && rawTo && rawFrom > rawTo ? rawTo : rawFrom,
    to: rawFrom && rawTo && rawFrom > rawTo ? rawFrom : rawTo,
  };
}

function setEssayFilter(filter = activeEssayFilter) {
  activeEssayFilter = filter;
  const filterButtons = document.querySelectorAll(".essay-filter-button");
  const essayEntries = document.querySelectorAll(".essay-entry");
  const groupHeadings = document.querySelectorAll(".essay-group-heading");
  const criteria = getEssayFilterCriteria();
  let visibleCount = 0;

  filterButtons.forEach((button) => {
    const active = button.getAttribute("data-filter") === filter;
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  essayEntries.forEach((entry) => {
    const pinnedMatches = filter === "all" || entry.getAttribute("data-pinned") === "true";
    const dateKey = entry.getAttribute("data-date-key") || "";
    const searchText = (entry.getAttribute("data-search-text") || "").toLocaleLowerCase();
    const keywordMatches = !criteria.keyword || searchText.includes(criteria.keyword);
    const monthMatches = !criteria.month || dateKey.startsWith(criteria.month);
    const fromMatches = !criteria.from || (dateKey && dateKey >= criteria.from);
    const toMatches = !criteria.to || (dateKey && dateKey <= criteria.to);
    const matches = pinnedMatches && keywordMatches && monthMatches && fromMatches && toMatches;
    entry.style.display = matches ? "" : "none";
    if (matches) visibleCount += 1;
  });

  groupHeadings.forEach((heading) => {
    const nextVisibleEntry = (() => {
      let current = heading.nextElementSibling;
      while (current && !current.classList.contains("essay-group-heading")) {
        if (current.classList.contains("essay-entry") && current.style.display !== "none") {
          return current;
        }
        current = current.nextElementSibling;
      }
      return null;
    })();
    heading.style.display = nextVisibleEntry ? "" : "none";
  });

  document.querySelectorAll(".essay-mobile-archive-link").forEach((link) => {
    const targetId = link.getAttribute("data-target-id");
    const target = targetId ? document.getElementById(targetId) : null;
    link.style.display = target && target.style.display !== "none" ? "" : "none";
  });

  document.querySelectorAll(".essay-mobile-archive-group").forEach((group) => {
    const hasVisibleLink = [...group.querySelectorAll(".essay-mobile-archive-link")]
      .some((link) => link.style.display !== "none");
    group.style.display = hasVisibleLink ? "" : "none";
  });

  const emptyState = document.getElementById("essay-filter-empty");
  if (emptyState) {
    emptyState.classList.toggle("hidden", visibleCount !== 0);
  }

  const summary = document.getElementById("essay-filter-summary");
  if (summary) {
    summary.textContent = `${visibleCount} 条记录`;
  }

  updateArchiveGroupVisibility();
  essayArchiveState?.updateArchiveActiveLink();
}

function bindEssayFilterButtons() {
  const filterButtons = document.querySelectorAll(".essay-filter-button");
  if (!filterButtons.length) {
    return;
  }

  filterButtons.forEach((button) => {
    if (button.dataset.filterBound === "true") {
      return;
    }
    button.dataset.filterBound = "true";
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter") || "all";
      setEssayFilter(filter);
    });
  });

  document.querySelectorAll(".essay-filter-input").forEach((input) => {
    if (input.dataset.filterBound === "true") {
      return;
    }
    input.dataset.filterBound = "true";
    input.addEventListener("input", () => setEssayFilter());
    input.addEventListener("change", () => setEssayFilter());
  });

  const resetButton = document.getElementById("essay-filter-reset");
  if (resetButton && resetButton.dataset.filterBound !== "true") {
    resetButton.dataset.filterBound = "true";
    resetButton.addEventListener("click", () => {
      document.querySelectorAll(".essay-filter-input").forEach((input) => {
        input.value = "";
      });
      setEssayFilter("all");
    });
  }

  setEssayFilter("all");
}

function registerEssayArchiveScroll() {
  if (didInitEssayArchiveScroll) {
    return;
  }

  didInitEssayArchiveScroll = true;
  window.addEventListener(
    "scroll",
    () => {
      essayArchiveState?.updateArchiveActiveLink();
    },
    { passive: true },
  );
}

function setArchiveGroupExpanded(groupKey, options = {}) {
  const { scrollIntoView = false } = options;
  const groupToggles = document.querySelectorAll(".essay-archive-group-toggle");
  const groupItems = document.querySelectorAll(".essay-archive-group-items");

  groupToggles.forEach((toggle) => {
    const expanded = toggle.getAttribute("data-group-key") === groupKey;
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.style.borderLeftColor = expanded ? "var(--primary-color)" : "transparent";
    toggle.style.backgroundColor = expanded ? "var(--background-color-transparent-40)" : "transparent";
    const arrow = toggle.querySelector(".essay-archive-arrow");
    if (arrow) {
      arrow.textContent = expanded ? "▾" : "▸";
    }
  });

  groupItems.forEach((items) => {
    const expanded = items.getAttribute("data-group-key") === groupKey;
    items.style.display = expanded ? "" : "none";
    if (expanded && scrollIntoView) {
      items.scrollIntoView({ block: "nearest" });
    }
  });
}

function updateArchiveGroupVisibility() {
  const archiveGroups = document.querySelectorAll(".essay-archive-group");
  archiveGroups.forEach((group) => {
    const links = [...group.querySelectorAll(".essay-archive-link")];
    const visibleLinks = links.filter((link) => {
      const targetId = link.getAttribute("data-target-id");
      const target = targetId ? document.getElementById(targetId) : null;
      const visible = target && target.style.display !== "none";
      link.style.display = visible ? "" : "none";
      return visible;
    });
    group.style.display = visibleLinks.length ? "" : "none";
  });
}

function bindEssayArchiveNav() {
  const archivePanel = document.querySelector(".essay-archive-panel");
  const archiveLinks = [...document.querySelectorAll(".essay-archive-link")];
  const archiveToggles = [...document.querySelectorAll(".essay-archive-group-toggle")];
  if (!archivePanel || archiveLinks.length === 0) {
    essayArchiveState = null;
    return;
  }

  registerEssayArchiveScroll();

  const activateArchiveLink = (index) => {
    const target = archiveLinks[index];
    if (!target || target.classList.contains("active-current")) {
      return;
    }

    archiveLinks.forEach((link) => {
      link.classList.remove("active", "active-current");
      link.style.borderLeftColor = "transparent";
      link.style.backgroundColor = "transparent";
      link.style.color = "";
      link.style.fontWeight = "";
    });

    target.classList.add("active", "active-current");
    target.style.borderLeftColor = "var(--primary-color)";
    target.style.backgroundColor = "var(--background-color-transparent-40)";
    target.style.color = "var(--primary-color)";
    target.style.fontWeight = "600";
    const targetGroupKey = target.getAttribute("data-group-key");
    if (targetGroupKey) {
      setArchiveGroupExpanded(targetGroupKey);
    }

    const panelTop = archivePanel.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top - panelTop;
    archivePanel.scrollTo({
      top: archivePanel.scrollTop + targetTop - archivePanel.clientHeight / 2 + target.clientHeight,
      behavior: "smooth",
    });
  };

  const updateArchiveActiveLink = () => {
    const visibleLinks = archiveLinks.filter((link) => {
      const targetId = link.getAttribute("data-target-id");
      const target = targetId ? document.getElementById(targetId) : null;
      return target && target.style.display !== "none";
    });

    if (!visibleLinks.length) {
      return;
    }

    let activeIndex = visibleLinks.findIndex((link) => {
      const targetId = link.getAttribute("data-target-id");
      const target = targetId ? document.getElementById(targetId) : null;
      return target && target.getBoundingClientRect().top - 120 > 0;
    });

    if (activeIndex === -1) {
      activeIndex = visibleLinks.length - 1;
    } else if (activeIndex > 0) {
      activeIndex -= 1;
    }

    activateArchiveLink(archiveLinks.indexOf(visibleLinks[activeIndex]));
  };

  archiveLinks.forEach((link) => {
    if (link.dataset.archiveBound === "true") {
      return;
    }
    link.dataset.archiveBound = "true";
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("data-target-id");
      const targetIndex = archiveLinks.findIndex((item) => item === link);
      if (targetId) {
        event.preventDefault();
        activateArchiveLink(targetIndex);
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${targetId}`);
      }
    });
  });

  archiveToggles.forEach((toggle) => {
    if (toggle.dataset.archiveBound === "true") {
      return;
    }
    toggle.dataset.archiveBound = "true";
    toggle.addEventListener("click", () => {
      const groupKey = toggle.getAttribute("data-group-key");
      const targetId = toggle.getAttribute("data-target-id");
      if (groupKey) {
        setArchiveGroupExpanded(groupKey, { scrollIntoView: true });
      }
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  essayArchiveState = {
    updateArchiveActiveLink,
  };
  updateArchiveGroupVisibility();
  const firstVisibleToggle = archiveToggles.find((toggle) => {
    const group = toggle.closest(".essay-archive-group");
    return group && group.style.display !== "none";
  });
  if (firstVisibleToggle) {
    const initialGroupKey = firstVisibleToggle.getAttribute("data-group-key");
    if (initialGroupKey) {
      setArchiveGroupExpanded(initialGroupKey);
    }
  }
  updateArchiveActiveLink();
}

export default function initEssays() {
  const dateElements = document.querySelectorAll(".essay-date");
  dateElements.forEach(updateEssayDate);

  const likeButtons = document.querySelectorAll(".essay-like-button");
  likeButtons.forEach(bindEssayLikeButton);

  bindEssayFilterButtons();
  bindEssayArchiveNav();
}
