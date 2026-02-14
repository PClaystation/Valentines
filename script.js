const ACCESS_ANSWER = "Charlie";

const body = document.body;
const accessScreen = document.getElementById("access-screen");
const experience = document.getElementById("experience");
const accessForm = document.getElementById("access-form");
const answerInput = document.getElementById("answer-input");
const gateError = document.getElementById("gate-error");
const secretTrigger = document.getElementById("secret-trigger");
const secretMessage = document.getElementById("secret-message");

let secretTapCount = 0;
const requiredTaps = 5;
let progressUpdateQueued = false;
let progressTrackingActive = false;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const isMobileViewport = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;

function normalizeValue(value) {
  return value.trim().toLowerCase();
}

function checkAccessAnswer(answer) {
  return normalizeValue(answer) === normalizeValue(ACCESS_ANSWER);
}

function unlockExperience() {
  if (!accessScreen || !experience) {
    return;
  }

  showError("");
  accessScreen.classList.add("hidden");
  experience.classList.add("active");
  experience.setAttribute("aria-hidden", "false");
  body.classList.remove("is-locked");
  startScrollTracking();

  window.setTimeout(() => {
    accessScreen.setAttribute("hidden", "");
  }, 750);
}

function showError(message) {
  if (!gateError) {
    return;
  }

  gateError.textContent = message;
}

function updateScrollProgress() {
  const documentElement = document.documentElement;
  const maxScrollableDistance = documentElement.scrollHeight - window.innerHeight;
  const rawProgress = maxScrollableDistance > 0 ? window.scrollY / maxScrollableDistance : 0;
  const progress = Math.max(0, Math.min(1, rawProgress));

  documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
}

function queueProgressUpdate() {
  if (!progressTrackingActive) {
    return;
  }

  if (progressUpdateQueued) {
    return;
  }

  progressUpdateQueued = true;
  window.requestAnimationFrame(() => {
    progressUpdateQueued = false;
    updateScrollProgress();
  });
}

function startScrollTracking() {
  if (progressTrackingActive) {
    return;
  }

  progressTrackingActive = true;
  window.addEventListener("scroll", queueProgressUpdate, { passive: true });
  window.addEventListener("resize", queueProgressUpdate);
  window.addEventListener("orientationchange", queueProgressUpdate);
  queueProgressUpdate();
}

function optimizeStoryImages() {
  document.querySelectorAll(".story-image img").forEach((image) => {
    if (!image.getAttribute("loading")) {
      image.loading = "lazy";
    }

    if (!image.getAttribute("decoding")) {
      image.decoding = "async";
    }

    if (!image.getAttribute("fetchpriority")) {
      image.setAttribute("fetchpriority", "low");
    }

    image.setAttribute("draggable", "false");
  });
}

function hideMissingDayImages() {
  document.querySelectorAll(".day-image").forEach((figure) => {
    const image = figure.querySelector("img");
    if (!image) {
      return;
    }

    const source = (image.getAttribute("src") || "").trim();
    const hasNoSource = source.length === 0;
    const isPlaceholderSource = source.toLowerCase().startsWith("placeholder");

    const hideFigure = () => {
      figure.classList.add("is-image-missing");
      figure.setAttribute("hidden", "");
    };

    if (hasNoSource || isPlaceholderSource) {
      hideFigure();
      return;
    }

    if (image.complete && image.naturalWidth === 0) {
      hideFigure();
      return;
    }

    image.addEventListener("error", hideFigure, { once: true });
  });
}

if (accessForm && answerInput) {
  accessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const submittedAnswer = answerInput.value;

    if (checkAccessAnswer(submittedAnswer)) {
      unlockExperience();
      queueProgressUpdate();
      return;
    }

    showError("Incorrect answer. Please try again.");
  });
}

let revealObserver = null;
if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      root: null,
      threshold: isMobileViewport ? 0.06 : 0.2,
      rootMargin: isMobileViewport ? "0px 0px -2% 0px" : "0px 0px -10% 0px",
    }
  );
}

optimizeStoryImages();
hideMissingDayImages();

const revealElements = document.querySelectorAll(".reveal");
if (prefersReducedMotion.matches || !revealObserver) {
  revealElements.forEach((element) => element.classList.add("visible"));
} else {
  revealElements.forEach((element) => {
    if (!element.hidden) {
      revealObserver.observe(element);
    }
  });
}

if (experience && experience.classList.contains("active")) {
  startScrollTracking();
}

function handleSecretReveal() {
  if (!secretTrigger || !secretMessage || !secretMessage.hidden) {
    return;
  }

  secretTapCount += 1;
  const tapsRemaining = requiredTaps - secretTapCount;

  if (tapsRemaining > 0) {
    secretTrigger.textContent =
      tapsRemaining === 1
        ? "PLACEHOLDER: one more tap to reveal"
        : `PLACEHOLDER: ${tapsRemaining} more taps`;
    return;
  }

  secretMessage.hidden = false;
  secretTrigger.classList.add("unlocked");
  secretTrigger.setAttribute("aria-pressed", "true");
  secretTrigger.textContent = "PLACEHOLDER: Secret unlocked";
}

if (secretTrigger && secretMessage) {
  secretTrigger.addEventListener("click", handleSecretReveal);
  secretTrigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleSecretReveal();
  });
}
