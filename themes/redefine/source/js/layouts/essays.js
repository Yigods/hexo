const ESSAY_LIKE_STORAGE_PREFIX = "essay-like:";

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

export default function initEssays() {
  const dateElements = document.querySelectorAll(".essay-date");
  dateElements.forEach(updateEssayDate);

  const likeButtons = document.querySelectorAll(".essay-like-button");
  likeButtons.forEach(bindEssayLikeButton);
}
