const languageButtons = document.querySelectorAll("[data-lang]");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const projectForms = document.querySelectorAll("[data-project-form]");

const routePairs = {
  "/en": "/nl",
  "/en/": "/nl/",
  "/en/services": "/nl/diensten",
  "/en/web-design": "/nl/webdesign",
  "/en/website-redesign": "/nl/website-redesign",
  "/en/ecommerce": "/nl/ecommerce",
  "/en/web-applications": "/nl/webapplicaties",
  "/en/work": "/nl/werk",
  "/en/work/polychem-mb": "/nl/werk/polychem-mb",
  "/en/work/bubble-paws": "/nl/werk/bubble-paws",
  "/en/process": "/nl/werkwijze",
  "/en/about": "/nl/over",
  "/en/contact": "/nl/contact",
  "/en/privacy": "/nl/privacy",
  "/en/legal": "/nl/juridisch",
};

const legacyEnglishRoutes = {
  "/": "/en",
  "/services": "/en/services",
  "/web-design": "/en/web-design",
  "/website-redesign": "/en/website-redesign",
  "/ecommerce": "/en/ecommerce",
  "/web-applications": "/en/web-applications",
  "/work": "/en/work",
  "/work/polychem-mb": "/en/work/polychem-mb",
  "/work/bubble-paws": "/en/work/bubble-paws",
  "/process": "/en/process",
  "/about": "/en/about",
  "/contact": "/en/contact",
  "/privacy": "/en/privacy",
  "/legal": "/en/legal",
};

const reverseRoutePairs = Object.fromEntries(Object.entries(routePairs).map(([en, nl]) => [nl, en]));
const currentLanguage = window.location.pathname.startsWith("/nl") ? "nl" : "en";
const formMessages = {
  en: {
    sending: "Your request is being sent...",
    requestSuccess: "Thank you. Your project request has been saved and we'll contact you soon.",
    auditSuccess: "Thank you. We'll review your website and get back to you soon with practical improvement ideas.",
    error: "Something went wrong. Please email info@droomit.be or try again.",
  },
  nl: {
    sending: "Je aanvraag wordt verzonden...",
    requestSuccess: "Bedankt. Je projectaanvraag is opgeslagen en we nemen snel contact met je op.",
    auditSuccess: "Bedankt. We bekijken je website en sturen je snel praktische verbeterideeën.",
    error: "Er ging iets mis. Mail naar info@droomit.be of probeer opnieuw.",
  },
};

function routeForLanguage(language) {
  const path = window.location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  if (language === "nl") return routePairs[path] || legacyEnglishRoutes[path]?.replace(/^\/en/, "/nl") || "/nl";
  return reverseRoutePairs[path] || legacyEnglishRoutes[path] || "/en";
}

languageButtons.forEach((button) => {
  button.classList.toggle("active", button.dataset.lang === currentLanguage);
  button.addEventListener("click", () => {
    const language = button.dataset.lang;
    localStorage.setItem("droom-it-language", language);
    window.location.href = routeForLanguage(language);
  });
});

function closeMenu() {
  if (!menuToggle || !siteNav) return;
  siteNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", menuToggle.dataset.openLabel || "Open menu");
  const menuLabel = menuToggle.querySelector(".sr-only");
  if (menuLabel) menuLabel.textContent = menuToggle.dataset.openLabel || "Open menu";
  document.body.classList.remove("menu-open");
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = siteNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? menuToggle.dataset.closeLabel || "Close menu" : menuToggle.dataset.openLabel || "Open menu");
    const menuLabel = menuToggle.querySelector(".sr-only");
    if (menuLabel) menuLabel.textContent = isOpen ? menuToggle.dataset.closeLabel || "Close menu" : menuToggle.dataset.openLabel || "Open menu";
    document.body.classList.toggle("menu-open", isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("click", (event) => {
    const header = document.querySelector(".site-header");
    if (!header || !siteNav.classList.contains("open")) return;
    if (!header.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("open")) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 1080) closeMenu();
});

function setFormStatus(form, message, isError = false) {
  const formStatus = form.querySelector("[data-form-status]");
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle("error", isError);
}

const verificationMessage = currentLanguage === "nl"
  ? "Voltooi de beveiligingscontrole. Probeer het opnieuw als deze niet laadt."
  : "Please complete the security check. Try again if it does not load.";
const captchaWidgets = new WeakMap();
if (projectForms.length) {
  const ready = new Promise((resolve, reject) => {
    window.droomTurnstileReady = resolve;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=droomTurnstileReady&render=explicit";
    script.async = true;
    script.onerror = reject;
    document.head.append(script);
  });
  Promise.all([ready, fetch("/api/turnstile-config").then(async (response) => {
    if (!response.ok) throw new Error("Verification unavailable");
    return response.json();
  })]).then(([, config]) => {
    projectForms.forEach((form) => {
      const container = document.createElement("div");
      container.style.gridColumn = "1 / -1";
      form.querySelector("button[type='submit']").before(container);
      const widget = window.turnstile.render(container, {
        sitekey: config.siteKey,
        action: "contact",
        language: currentLanguage,
        size: "flexible",
        "expired-callback": () => setFormStatus(form, verificationMessage, true),
        "error-callback": () => setFormStatus(form, verificationMessage, true),
      });
      captchaWidgets.set(form, widget);
    });
  }).catch(() => projectForms.forEach((form) => setFormStatus(form, verificationMessage, true)));
}

projectForms.forEach((projectForm) => {
  projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = projectForm.querySelector("button[type='submit']");
    if (submitButton.disabled) return;
    const widget = captchaWidgets.get(projectForm);
    if (widget === undefined || !window.turnstile?.getResponse(widget)) {
      setFormStatus(projectForm, verificationMessage, true);
      return;
    }
    const messages = formMessages[currentLanguage] || formMessages.en;
    const successKey = projectForm.dataset.successKey || "requestSuccess";
    const formData = new FormData(projectForm);
    const payload = Object.fromEntries(formData.entries());
    payload["cf-turnstile-response"] = window.turnstile.getResponse(widget);
    payload.language = currentLanguage;

    submitButton.disabled = true;
    setFormStatus(projectForm, messages.sending);

    try {
      const response = await fetch(projectForm.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        const error = new Error(result.message || "Request failed");
        error.verification = result.code === "verification_failed";
        throw error;
      }
      projectForm.reset();
      setFormStatus(projectForm, messages[successKey] || messages.requestSuccess);
    } catch (error) {
      setFormStatus(projectForm, error.verification ? verificationMessage : messages.error, true);
    } finally {
      window.turnstile.reset(widget);
      submitButton.disabled = false;
    }
  });
});

const yearElement = document.getElementById("year");
if (yearElement) yearElement.textContent = new Date().getFullYear();
