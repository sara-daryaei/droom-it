const translations = {
  en: {
    navServices: "Services",
    navWork: "Work",
    navProcess: "Process",
    navAbout: "About",
    navContact: "Contact",
    startProject: "Start a project",
    heroEyebrow: "Independent digital studio · Belgium",
    heroTitle: "We build what others only dream of.",
    heroText:
      "DROOM IT designs, builds and launches thoughtful digital solutions for ambitious businesses, startups and brands.",
    exploreServices: "Explore services",
    basedIn: "Based in",
    workingWith: "Working with",
    workingWithValue: "Belgian & international clients",
    introBand:
      "Strategy, design and development brought together to turn a strong idea into a polished digital product.",
    servicesEyebrow: "What we do",
    servicesTitle: "Digital solutions built around your business.",
    servicesIntro:
      "From first idea to final launch, DROOM IT creates clear, elegant and practical digital experiences.",
    serviceDesign:
      "Strategic, responsive websites designed to make your business look credible and convert attention into action.",
    serviceDevelopment:
      "Fast, accessible and maintainable websites built for reliable everyday use.",
    serviceApplications:
      "Purpose-built digital tools that simplify workflows and support business growth.",
    serviceUx: "User-focused interfaces that feel intuitive, consistent and easy to navigate.",
    workEyebrow: "Selected work",
    workTitle: "A place for work we are proud to launch.",
    workIntro: "Our project archive is being prepared. New case studies will be published here soon.",
    comingSoon: "Coming soon",
    workPlaceholderTitle: "The first DROOM IT case studies are on their way.",
    becomeFirst: "Become one of our first featured projects",
    processEyebrow: "How we work",
    processTitle: "A clear process from idea to launch.",
    discoverTitle: "Discover",
    discoverText: "We define your goals, audience and the right digital direction.",
    designTitle: "Design",
    designText: "We shape a focused experience and a visual system that fits your brand.",
    buildTitle: "Build",
    buildText: "We turn the approved design into a responsive, dependable product.",
    launchTitle: "Launch",
    launchText: "We test, refine and prepare everything for a confident release.",
    aboutEyebrow: "About DROOM IT",
    aboutTitle: "A small studio with direct communication and ambitious standards.",
    aboutText:
      "DROOM IT is an independent digital studio based in Belgium. Every project is personally guided from strategy and design through development and launch.",
    founderRole: "Founder & Digital Solutions Developer",
    contactEyebrow: "Start a conversation",
    contactTitle: "Have an idea? Let’s build it into something real.",
    contactText:
      "Tell us what you are planning, where you are now and what a successful result would look like.",
    locationLabel: "Location",
    phoneLabel: "Phone",
    phonePlaceholder: "Available soon",
    nameLabel: "Name",
    emailLabel: "Email",
    companyLabel: "Company",
    projectLabel: "Tell us about your project",
    sendRequest: "Send project request",
    sendingRequest: "Sending your request...",
    requestSuccess: "Thank you. Your project request has been saved and we will contact you soon.",
    requestError: "Something went wrong. Please email info@droomit.be or try again.",
  },
  nl: {
    navServices: "Diensten",
    navWork: "Werk",
    navProcess: "Werkwijze",
    navAbout: "Over ons",
    navContact: "Contact",
    startProject: "Start een project",
    heroEyebrow: "Onafhankelijke digitale studio · België",
    heroTitle: "Wij bouwen waar anderen alleen van dromen.",
    heroText:
      "DROOM IT ontwerpt, bouwt en lanceert doordachte digitale oplossingen voor ambitieuze bedrijven, startups en merken.",
    exploreServices: "Ontdek onze diensten",
    basedIn: "Gevestigd in",
    workingWith: "Wij werken met",
    workingWithValue: "Belgische & internationale klanten",
    introBand:
      "Strategie, design en development komen samen om een sterk idee te vertalen naar een verfijnd digitaal product.",
    servicesEyebrow: "Wat we doen",
    servicesTitle: "Digitale oplossingen gebouwd rond jouw bedrijf.",
    servicesIntro:
      "Van het eerste idee tot de lancering creëert DROOM IT heldere, elegante en praktische digitale ervaringen.",
    serviceDesign:
      "Strategische, responsive websites die jouw bedrijf professioneel presenteren en aandacht omzetten in actie.",
    serviceDevelopment:
      "Snelle, toegankelijke en onderhoudbare websites gebouwd voor betrouwbaar dagelijks gebruik.",
    serviceApplications:
      "Digitale tools op maat die workflows vereenvoudigen en bedrijfsgroei ondersteunen.",
    serviceUx: "Gebruiksvriendelijke interfaces die intuïtief, consistent en helder aanvoelen.",
    workEyebrow: "Geselecteerd werk",
    workTitle: "Een plek voor projecten die we met trots lanceren.",
    workIntro: "Ons projectarchief wordt voorbereid. Nieuwe cases verschijnen hier binnenkort.",
    comingSoon: "Binnenkort",
    workPlaceholderTitle: "De eerste DROOM IT-cases zijn onderweg.",
    becomeFirst: "Word een van onze eerste uitgelichte projecten",
    processEyebrow: "Onze werkwijze",
    processTitle: "Een helder proces van idee tot lancering.",
    discoverTitle: "Ontdekken",
    discoverText: "We bepalen jouw doelen, doelgroep en de juiste digitale richting.",
    designTitle: "Ontwerpen",
    designText: "We creëren een gerichte ervaring en een visueel systeem dat bij jouw merk past.",
    buildTitle: "Bouwen",
    buildText: "We vertalen het goedgekeurde ontwerp naar een responsive en betrouwbaar product.",
    launchTitle: "Lanceren",
    launchText: "We testen, verfijnen en bereiden alles voor op een sterke lancering.",
    aboutEyebrow: "Over DROOM IT",
    aboutTitle: "Een kleine studio met direct contact en ambitieuze kwaliteitsnormen.",
    aboutText:
      "DROOM IT is een onafhankelijke digitale studio in België. Elk project wordt persoonlijk begeleid van strategie en ontwerp tot ontwikkeling en lancering.",
    founderRole: "Oprichter & Digital Solutions Developer",
    contactEyebrow: "Start een gesprek",
    contactTitle: "Heb je een idee? Laten we het samen werkelijkheid maken.",
    contactText:
      "Vertel ons wat je plant, waar je nu staat en hoe een succesvol resultaat eruitziet.",
    locationLabel: "Locatie",
    phoneLabel: "Telefoon",
    phonePlaceholder: "Binnenkort beschikbaar",
    nameLabel: "Naam",
    emailLabel: "E-mail",
    companyLabel: "Bedrijf",
    projectLabel: "Vertel ons over je project",
    sendRequest: "Verstuur projectaanvraag",
    sendingRequest: "Je aanvraag wordt verzonden...",
    requestSuccess: "Bedankt. Je projectaanvraag is opgeslagen en we nemen snel contact met je op.",
    requestError: "Er ging iets mis. Mail naar info@droomit.be of probeer opnieuw.",
  },
};

const languageButtons = document.querySelectorAll("[data-lang]");
const translatableElements = document.querySelectorAll("[data-i18n]");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const projectForm = document.querySelector("[data-project-form]");
const formStatus = document.querySelector("[data-form-status]");
let currentLanguage = localStorage.getItem("droom-it-language") || "en";

function setLanguage(language) {
  const dictionary = translations[language];
  currentLanguage = language;
  document.documentElement.lang = language;

  translatableElements.forEach((element) => {
    const key = element.dataset.i18n;
    if (dictionary[key]) element.textContent = dictionary[key];
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === language);
  });

  localStorage.setItem("droom-it-language", language);
}

function setFormStatus(message, isError = false) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle("error", isError);
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

menuToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("menu-open", isOpen);
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  });
});

if (projectForm) {
  projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = projectForm.querySelector("button[type='submit']");
    const dictionary = translations[currentLanguage] || translations.en;
    const formData = new FormData(projectForm);
    const payload = Object.fromEntries(formData.entries());
    payload.language = currentLanguage;

    submitButton.disabled = true;
    setFormStatus(dictionary.sendingRequest);

    try {
      const response = await fetch(projectForm.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Request failed");
      }

      projectForm.reset();
      setFormStatus(dictionary.requestSuccess);
    } catch (error) {
      setFormStatus(dictionary.requestError, true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
setLanguage(currentLanguage);
