const ACCESS_ANSWER = "123";

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

function normalizeValue(value) {
  return value.trim().toLowerCase();
}

function checkAccessAnswer(answer) {
  return normalizeValue(answer) === normalizeValue(ACCESS_ANSWER);
}

function unlockExperience() {
  gateError.textContent = "";
  accessScreen.classList.add("hidden");
  experience.classList.add("active");
  experience.setAttribute("aria-hidden", "false");
  body.classList.remove("is-locked");

  window.setTimeout(() => {
    accessScreen.setAttribute("hidden", "");
  }, 750);
}

function showError(message) {
  gateError.textContent = message;
}

function updateScrollProgress() {
  const documentElement = document.documentElement;
  const maxScrollableDistance = documentElement.scrollHeight - window.innerHeight;
  const progress = maxScrollableDistance > 0 ? window.scrollY / maxScrollableDistance : 0;

  documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
}

function queueProgressUpdate() {
  if (progressUpdateQueued) {
    return;
  }

  progressUpdateQueued = true;
  window.requestAnimationFrame(() => {
    progressUpdateQueued = false;
    updateScrollProgress();
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

const revealObserver = new IntersectionObserver(
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
    threshold: 0.2,
    rootMargin: "0px 0px -10% 0px",
  }
);

hideMissingDayImages();

document.querySelectorAll(".reveal").forEach((element) => {
  if (!element.hidden) {
    revealObserver.observe(element);
  }
});

window.addEventListener("scroll", queueProgressUpdate, { passive: true });
window.addEventListener("resize", queueProgressUpdate);
window.addEventListener("orientationchange", queueProgressUpdate);
updateScrollProgress();

function handleSecretReveal() {
  if (!secretMessage.hidden) {
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

secretTrigger.addEventListener("click", handleSecretReveal);
secretTrigger.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  handleSecretReveal();
});
