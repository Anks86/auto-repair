const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector("#primary-navigation");
const requestForm = document.querySelector("#service-request-form");
const formStatus = document.querySelector("#form-status");
const heroCarousel = document.querySelector("[data-hero-carousel]");
const reviewCarousel = document.querySelector("[data-review-carousel]");
const workGallery = document.querySelector("[data-work-gallery]");
const submitButton = requestForm?.querySelector(".form-submit");
const turnstileContainer = document.querySelector("#turnstile-widget");
const turnstileScriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const networkConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const isFrench = document.documentElement.lang.toLowerCase().startsWith("fr");
const uiText = isFrench ? {
  play: "Lire",
  pause: "Pause",
  heroNames: ["Survoltage de batterie", "Aide pour pneu crevé et roue", "Entretien de l’huile et des liquides"],
  heroStatus: (name, index, total) => `${name}, image ${index} sur ${total}.`,
  reviewGroupLabel: (start, end) => `Afficher les avis ${start} à ${end}`,
  reviewLabel: (name) => `Afficher l’avis de ${name}`,
  reviewGroupStatus: (start, end, total) => `Avis ${start} à ${end} sur ${total}.`,
  reviewStatus: (name, index, total) => `${name}, avis ${index} sur ${total}.`,
  photoCount: (index, total) => `Photo ${index} sur ${total}`,
  photoStatus: (index, total) => `Photo de travail réelle ${index} sur ${total}.`,
  requiredFields: "Veuillez remplir les champs obligatoires avant de continuer.",
  formPreparing: "Le formulaire est en cours de préparation. Attendez un moment, puis réessayez.",
  sendRequest: "Envoyer la demande de service",
  sendingButton: "Envoi en cours...",
  sendingStatus: "Envoi de votre demande...",
  sentStatus: "Votre demande a été envoyée. Babbal répondra par appel, texto ou WhatsApp.",
  timedOut: "Le formulaire a expiré. Veuillez réessayer.",
  notSent: "Votre demande n’a pas été envoyée. Réessayez, ou appelez, textez ou écrivez à Babbal sur WhatsApp."
} : {
  play: "Play",
  pause: "Pause",
  heroNames: ["Battery boosts", "Flat tire and wheel help", "Oil and fluid maintenance"],
  heroStatus: (name, index, total) => `${name}, image ${index} of ${total}.`,
  reviewGroupLabel: (start, end) => `Show reviews ${start} to ${end}`,
  reviewLabel: (name) => `Show review from ${name}`,
  reviewGroupStatus: (start, end, total) => `Reviews ${start} to ${end} of ${total}.`,
  reviewStatus: (name, index, total) => `${name}, review ${index} of ${total}.`,
  photoCount: (index, total) => `Photo ${index} of ${total}`,
  photoStatus: (index, total) => `Real work photo ${index} of ${total}.`,
  requiredFields: "Please complete the required fields before continuing.",
  formPreparing: "The form is still getting ready. Please wait a moment and try again.",
  sendRequest: "Send service request",
  sendingButton: "Sending...",
  sendingStatus: "Sending your request...",
  sentStatus: "Your request was sent. Babbal will reply by call, text, or WhatsApp.",
  timedOut: "The form timed out. Please try once more.",
  notSent: "Your request was not sent. Please try again, or call, text, or WhatsApp Babbal."
};
let turnstileToken = "";
let turnstileWidgetId = null;
let turnstileReady = false;

function updateFormStatus(message, type = "") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle("is-error", type === "error");
  formStatus.classList.toggle("is-success", type === "success");
}

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${turnstileScriptUrl}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = turnstileScriptUrl;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.append(script);
  });
}

async function initializeTurnstile() {
  if (!requestForm || !turnstileContainer) return;

  try {
    const response = await fetch("/api/form-config", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin"
    });

    if (!response.ok) throw new Error("form-config-unavailable");

    const { siteKey } = await response.json();
    if (!siteKey) throw new Error("turnstile-site-key-missing");

    await loadTurnstileScript();
    turnstileWidgetId = window.turnstile.render(turnstileContainer, {
      sitekey: siteKey,
      action: "service_request",
      appearance: "interaction-only",
      size: "flexible",
      theme: "light",
      callback(token) {
        turnstileToken = token;
        turnstileReady = true;
      },
      "expired-callback"() {
        turnstileToken = "";
        turnstileReady = false;
      },
      "error-callback"() {
        turnstileToken = "";
        turnstileReady = false;
      }
    });
  } catch {
    turnstileReady = false;
  }
}

if (heroCarousel) {
  const slides = [...heroCarousel.querySelectorAll("[data-hero-slide]")];
  const dots = [...heroCarousel.querySelectorAll("[data-hero-dot]")];
  const previousButton = heroCarousel.querySelector("[data-hero-previous]");
  const nextButton = heroCarousel.querySelector("[data-hero-next]");
  const toggleButton = heroCarousel.querySelector("[data-hero-toggle]");
  const toggleLabel = heroCarousel.querySelector("[data-hero-toggle-label]");
  const status = heroCarousel.querySelector("[data-hero-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const slideNames = uiText.heroNames;
  let activeIndex = 0;
  let autoplayEnabled = !reducedMotion.matches && !networkConnection?.saveData;
  let carouselVisible = false;
  let pointerInside = false;
  let focusInside = false;
  let playOverride = false;
  let autoplayTimer = null;

  function clearAutoplay() {
    window.clearTimeout(autoplayTimer);
    autoplayTimer = null;
  }

  function canAutoplay() {
    const interactionAllowsPlayback = playOverride || (!pointerInside && !focusInside);
    return autoplayEnabled && carouselVisible && interactionAllowsPlayback && !document.hidden;
  }

  function updateToggle() {
    const paused = !autoplayEnabled;
    toggleButton.setAttribute("aria-pressed", String(paused));
    toggleLabel.textContent = paused ? uiText.play : uiText.pause;
  }

  function showSlide(nextIndex, announce = false) {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    dots.forEach((dot, index) => {
      const active = index === activeIndex;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

    if (announce) status.textContent = uiText.heroStatus(slideNames[activeIndex], activeIndex + 1, slides.length);
  }

  function scheduleAutoplay() {
    clearAutoplay();
    if (!canAutoplay()) return;

    autoplayTimer = window.setTimeout(() => {
      showSlide(activeIndex + 1);
      scheduleAutoplay();
    }, 8000);
  }

  function setAutoplay(enabled, requestedByUser = false) {
    autoplayEnabled = enabled;
    playOverride = enabled && requestedByUser;
    updateToggle();
    scheduleAutoplay();
  }

  function selectSlide(index) {
    showSlide(index, true);
    setAutoplay(false);
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => selectSlide(Number(dot.dataset.heroDot)));
  });

  previousButton.addEventListener("click", () => selectSlide(activeIndex - 1));
  nextButton.addEventListener("click", () => selectSlide(activeIndex + 1));
  toggleButton.addEventListener("click", () => setAutoplay(!autoplayEnabled, true));

  heroCarousel.addEventListener("mouseenter", () => {
    pointerInside = true;
    playOverride = false;
    scheduleAutoplay();
  });

  heroCarousel.addEventListener("mouseleave", () => {
    pointerInside = false;
    scheduleAutoplay();
  });

  heroCarousel.addEventListener("focusin", () => {
    focusInside = true;
    playOverride = false;
    scheduleAutoplay();
  });

  heroCarousel.addEventListener("focusout", (event) => {
    if (heroCarousel.contains(event.relatedTarget)) return;
    focusInside = false;
    scheduleAutoplay();
  });

  heroCarousel.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") setAutoplay(false);
  });

  document.addEventListener("visibilitychange", scheduleAutoplay);
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) setAutoplay(false);
  });
  networkConnection?.addEventListener("change", () => {
    if (networkConnection.saveData) setAutoplay(false);
  });

  const carouselObserver = new IntersectionObserver(
    ([entry]) => {
      carouselVisible = entry.isIntersecting;
      scheduleAutoplay();
    },
    { threshold: 0.4 }
  );

  carouselObserver.observe(heroCarousel);
  showSlide(0);
  updateToggle();
}

if (reviewCarousel) {
  const slides = [...reviewCarousel.querySelectorAll("[data-review-slide]")];
  const dots = [...reviewCarousel.querySelectorAll("[data-review-dot]")];
  const track = reviewCarousel.querySelector("[data-review-track]");
  const previousButton = reviewCarousel.querySelector("[data-review-previous]");
  const nextButton = reviewCarousel.querySelector("[data-review-next]");
  const toggleButton = reviewCarousel.querySelector("[data-review-toggle]");
  const toggleLabel = reviewCarousel.querySelector("[data-review-toggle-label]");
  const status = reviewCarousel.querySelector("[data-review-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const threeCardView = window.matchMedia("(min-width: 781px)");
  const reviewerNames = ["Kathryn F", "Amritpal Singh", "Chanchal", "Paulina Kalucka", "Archana Babbar", "Karan Singh"];
  let activePage = 0;
  let autoplayEnabled = !reducedMotion.matches && !networkConnection?.saveData;
  let carouselVisible = false;
  let pointerInside = false;
  let focusInside = false;
  let playOverride = false;
  let autoplayTimer = null;

  function clearAutoplay() {
    window.clearTimeout(autoplayTimer);
    autoplayTimer = null;
  }

  function canAutoplay() {
    const interactionAllowsPlayback = playOverride || (!pointerInside && !focusInside);
    return autoplayEnabled && carouselVisible && interactionAllowsPlayback && !document.hidden;
  }

  function updateToggle() {
    const paused = !autoplayEnabled;
    toggleButton.setAttribute("aria-pressed", String(paused));
    toggleLabel.textContent = paused ? uiText.play : uiText.pause;
  }

  function reviewsPerPage() {
    return threeCardView.matches ? 3 : 1;
  }

  function pageCount() {
    return Math.ceil(slides.length / reviewsPerPage());
  }

  function showPage(nextPage, announce = false) {
    const totalPages = pageCount();
    const pageSize = reviewsPerPage();
    activePage = (nextPage + totalPages) % totalPages;
    const firstVisibleIndex = activePage * pageSize;
    const lastVisibleIndex = Math.min(firstVisibleIndex + pageSize, slides.length);
    track.style.transform = `translate3d(calc(-${activePage * 100}% - ${activePage * 18}px), 0, 0)`;

    slides.forEach((slide, index) => {
      const active = index >= firstVisibleIndex && index < lastVisibleIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    dots.forEach((dot, index) => {
      const available = index < totalPages;
      const active = index === activePage;
      dot.hidden = !available;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");

      if (!available) return;
      if (pageSize === 3) {
        const groupStart = (index * pageSize) + 1;
        const groupEnd = Math.min(groupStart + pageSize - 1, slides.length);
        dot.setAttribute("aria-label", uiText.reviewGroupLabel(groupStart, groupEnd));
      } else {
        dot.setAttribute("aria-label", uiText.reviewLabel(reviewerNames[index]));
      }
    });

    if (announce) {
      status.textContent = pageSize === 3
        ? uiText.reviewGroupStatus(firstVisibleIndex + 1, lastVisibleIndex, slides.length)
        : uiText.reviewStatus(reviewerNames[firstVisibleIndex], firstVisibleIndex + 1, slides.length);
    }
  }

  function scheduleAutoplay() {
    clearAutoplay();
    if (!canAutoplay()) return;

    autoplayTimer = window.setTimeout(() => {
      showPage(activePage + 1);
      scheduleAutoplay();
    }, 9000);
  }

  function setAutoplay(enabled, requestedByUser = false) {
    autoplayEnabled = enabled;
    playOverride = enabled && requestedByUser;
    updateToggle();
    scheduleAutoplay();
  }

  function selectPage(index) {
    showPage(index, true);
    setAutoplay(false);
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => selectPage(Number(dot.dataset.reviewDot)));
  });

  previousButton.addEventListener("click", () => selectPage(activePage - 1));
  nextButton.addEventListener("click", () => selectPage(activePage + 1));
  toggleButton.addEventListener("click", () => setAutoplay(!autoplayEnabled, true));

  reviewCarousel.addEventListener("mouseenter", () => {
    pointerInside = true;
    playOverride = false;
    scheduleAutoplay();
  });

  reviewCarousel.addEventListener("mouseleave", () => {
    pointerInside = false;
    scheduleAutoplay();
  });

  reviewCarousel.addEventListener("focusin", () => {
    focusInside = true;
    playOverride = false;
    scheduleAutoplay();
  });

  reviewCarousel.addEventListener("focusout", (event) => {
    if (reviewCarousel.contains(event.relatedTarget)) return;
    focusInside = false;
    scheduleAutoplay();
  });

  reviewCarousel.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") setAutoplay(false);
  });

  document.addEventListener("visibilitychange", scheduleAutoplay);
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) setAutoplay(false);
  });
  networkConnection?.addEventListener("change", () => {
    if (networkConnection.saveData) setAutoplay(false);
  });
  threeCardView.addEventListener("change", () => {
    showPage(0);
    scheduleAutoplay();
  });

  const carouselObserver = new IntersectionObserver(
    ([entry]) => {
      carouselVisible = entry.isIntersecting;
      scheduleAutoplay();
    },
    { threshold: 0.45 }
  );

  carouselObserver.observe(reviewCarousel);
  showPage(0);
  updateToggle();
}

if (workGallery) {
  const photos = [...workGallery.querySelectorAll("[data-work-photo]")];
  const dots = [...workGallery.querySelectorAll("[data-work-dot]")];
  const previousButton = workGallery.querySelector("[data-work-previous]");
  const nextButton = workGallery.querySelector("[data-work-next]");
  const toggleButton = workGallery.querySelector("[data-work-toggle]");
  const toggleLabel = workGallery.querySelector("[data-work-toggle-label]");
  const count = workGallery.querySelector("[data-work-count]");
  const status = workGallery.querySelector("[data-work-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let autoplayEnabled = !reducedMotion.matches && !networkConnection?.saveData;
  let galleryVisible = false;
  let pointerInside = false;
  let focusInside = false;
  let playOverride = false;
  let autoplayTimer = null;

  function clearAutoplay() {
    window.clearTimeout(autoplayTimer);
    autoplayTimer = null;
  }

  function canAutoplay() {
    const interactionAllowsPlayback = playOverride || (!pointerInside && !focusInside);
    return autoplayEnabled && galleryVisible && interactionAllowsPlayback && !document.hidden;
  }

  function updateToggle() {
    const paused = !autoplayEnabled;
    toggleButton.setAttribute("aria-pressed", String(paused));
    toggleLabel.textContent = paused ? uiText.play : uiText.pause;
  }

  function showPhoto(nextIndex, announce = false) {
    activeIndex = (nextIndex + photos.length) % photos.length;

    photos.forEach((photo, index) => {
      const active = index === activeIndex;
      photo.classList.toggle("is-active", active);
      photo.setAttribute("aria-hidden", String(!active));
    });

    dots.forEach((dot, index) => {
      const active = index === activeIndex;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

    count.textContent = uiText.photoCount(activeIndex + 1, photos.length);
    if (announce) status.textContent = uiText.photoStatus(activeIndex + 1, photos.length);
  }

  function scheduleAutoplay() {
    clearAutoplay();
    if (!canAutoplay()) return;

    autoplayTimer = window.setTimeout(() => {
      showPhoto(activeIndex + 1);
      scheduleAutoplay();
    }, 9000);
  }

  function setAutoplay(enabled, requestedByUser = false) {
    autoplayEnabled = enabled;
    playOverride = enabled && requestedByUser;
    updateToggle();
    scheduleAutoplay();
  }

  function selectPhoto(index) {
    showPhoto(index, true);
    setAutoplay(false);
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => selectPhoto(Number(dot.dataset.workDot)));
  });

  previousButton.addEventListener("click", () => selectPhoto(activeIndex - 1));
  nextButton.addEventListener("click", () => selectPhoto(activeIndex + 1));
  toggleButton.addEventListener("click", () => setAutoplay(!autoplayEnabled, true));

  workGallery.addEventListener("mouseenter", () => {
    pointerInside = true;
    playOverride = false;
    scheduleAutoplay();
  });

  workGallery.addEventListener("mouseleave", () => {
    pointerInside = false;
    scheduleAutoplay();
  });

  workGallery.addEventListener("focusin", () => {
    focusInside = true;
    playOverride = false;
    scheduleAutoplay();
  });

  workGallery.addEventListener("focusout", (event) => {
    if (workGallery.contains(event.relatedTarget)) return;
    focusInside = false;
    scheduleAutoplay();
  });

  workGallery.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") setAutoplay(false);
  });

  document.addEventListener("visibilitychange", scheduleAutoplay);
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) setAutoplay(false);
  });
  networkConnection?.addEventListener("change", () => {
    if (networkConnection.saveData) setAutoplay(false);
  });

  const galleryObserver = new IntersectionObserver(
    ([entry]) => {
      galleryVisible = entry.isIntersecting;
      scheduleAutoplay();
    },
    { threshold: 0.4 }
  );

  galleryObserver.observe(workGallery);
  showPhoto(0);
  updateToggle();
}

function setMenu(open) {
  if (!header || !menuButton) return;

  header.classList.toggle("menu-active", open);
  document.body.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
}

menuButton?.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 780) setMenu(false);
});

requestForm?.querySelectorAll("input, textarea").forEach((field) => {
  field.addEventListener("input", () => {
    field.removeAttribute("aria-invalid");
    updateFormStatus("");
  });
});

requestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  let firstInvalidField = null;

  requestForm.querySelectorAll("input[required], textarea[required]").forEach((field) => {
    const invalid = !field.checkValidity();
    if (invalid) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
    if (invalid && !firstInvalidField) firstInvalidField = field;
  });

  if (firstInvalidField) {
    updateFormStatus(uiText.requiredFields, "error");
    firstInvalidField.focus();
    return;
  }

  if (!turnstileReady || !turnstileToken) {
    updateFormStatus(uiText.formPreparing, "error");
    return;
  }

  const formData = Object.fromEntries(new FormData(requestForm));
  const originalButtonText = submitButton?.textContent || uiText.sendRequest;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = uiText.sendingButton;
  }
  updateFormStatus(uiText.sendingStatus);

  try {
    const response = await fetch(requestForm.action, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ ...formData, turnstileToken })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 422 && result.code === "verification_failed") {
        throw new Error("verification_failed");
      }
      throw new Error("request_failed");
    }

    requestForm.reset();
    turnstileToken = "";
    turnstileReady = false;
    if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
    updateFormStatus(uiText.sentStatus, "success");
  } catch (error) {
    turnstileToken = "";
    turnstileReady = false;
    if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);

    const message = error.message === "verification_failed"
      ? uiText.timedOut
      : uiText.notSent;
    updateFormStatus(message, "error");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});

document.querySelector("#current-year").textContent = String(new Date().getFullYear());

initializeTurnstile();
