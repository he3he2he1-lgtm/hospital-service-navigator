const db = window.SERVICE_DATABASE;
const tree = window.QUESTION_TREE;

const state = {
  choices: [],
  search: "",
  mode: "finder",
  selectedService: null,
  cart: JSON.parse(localStorage.getItem("clientServiceCart") || "[]"),
};

const priorityServiceNames = [
  "Inner Melbourne Post Acute Care (IMPAC)",
  "Post-acute Care",
  "Health Independence Program (HIP) Complex Care",
  "ALERT Psychosocial (HIP Complex Care)",
  "Hospital in the Home",
  "The Cottage",
  "District Nursing",
  "Rehab at home",
];

const categoryOrder = [
  "Discharge",
  "Clinical care at home",
  "Rehabilitation",
  "Housing",
  "Disability",
  "Carer",
  "FV",
  "Transport",
  "Financial",
  "Legal",
  "MH/AOD",
  "Condition-specific",
  "Identity-specific",
];

const el = {
  body: document.body,
  workspace: document.querySelector(".workspace"),
  count: document.getElementById("service-count"),
  step: document.getElementById("step-label"),
  title: document.getElementById("question-title"),
  help: document.getElementById("question-help"),
  options: document.getElementById("options"),
  reset: document.getElementById("reset-button"),
  back: document.getElementById("back-button"),
  breadcrumb: document.getElementById("breadcrumb"),
  search: document.getElementById("quick-search"),
  finderTab: document.getElementById("finder-tab"),
  allTab: document.getElementById("all-tab"),
  allServices: document.getElementById("all-services"),
  result: document.getElementById("result-content"),
  resultEmpty: document.getElementById("result-empty"),
  name: document.getElementById("result-name"),
  resultSubtitle: document.getElementById("result-subtitle"),
  descriptionBlock: document.getElementById("result-description-block"),
  referralBlock: document.getElementById("result-referral-block"),
  eligibilityBlock: document.getElementById("result-eligibility-block"),
  description: document.getElementById("result-description"),
  referral: document.getElementById("result-referral"),
  eligibility: document.getElementById("result-eligibility"),
  link: document.getElementById("result-link"),
  confidence: document.getElementById("confidence-pill"),
  alternatives: document.getElementById("alternatives"),
  copy: document.getElementById("copy-button"),
  add: document.getElementById("add-button"),
  cartCount: document.getElementById("cart-count"),
  cartList: document.getElementById("cart-list"),
  clearCart: document.getElementById("clear-cart"),
  copyCart: document.getElementById("copy-cart"),
  cartFloatCount: document.getElementById("cart-float-count"),
  allEmpty: document.getElementById("all-empty"),
  allDetail: document.getElementById("all-detail"),
  allDetailName: document.getElementById("all-detail-name"),
  allDetailSubtitle: document.getElementById("all-detail-subtitle"),
  allDetailLink: document.getElementById("all-detail-link"),
  allDetailAdd: document.getElementById("all-detail-add"),
  allDetailCopy: document.getElementById("all-detail-copy"),
  allDescriptionBlock: document.getElementById("all-description-block"),
  allReferralBlock: document.getElementById("all-referral-block"),
  allEligibilityBlock: document.getElementById("all-eligibility-block"),
  allDescription: document.getElementById("all-description"),
  allReferral: document.getElementById("all-referral"),
  allEligibility: document.getElementById("all-eligibility"),
  categoryNav: document.getElementById("category-nav"),
  allBrowserScroll: document.querySelector(".all-browser-scroll"),
  priorityList: document.getElementById("priority-list"),
  categoryList: document.getElementById("category-list"),
};

function selectedPath() {
  const selected = [];
  let current = tree;
  for (const id of state.choices) {
    const option = current?.options?.find((item) => item.id === id);
    if (!option) break;
    selected.push(option);
    current = option.next;
  }
  return selected;
}

function activeNode() {
  let current = tree;
  for (const id of state.choices) {
    const option = current?.options?.find((item) => item.id === id);
    if (!option) return { node: tree, done: false };
    if (option.rules?.mode === "all") return { node: null, done: true, all: true };
    if (!option.next) return { node: null, done: true };
    current = option.next;
  }
  return { node: current, done: false };
}

function exactName(service, names = []) {
  return names.some((name) => service.name.toLowerCase() === name.toLowerCase());
}

function serviceText(service) {
  return [
    service.name,
    service.category,
    service.displayCategory,
    service.eligibility,
    service.provider,
    service.catchment,
    service.referral,
    service.description,
    service.linkLabel,
  ]
    .join(" ")
    .toLowerCase();
}

function serviceCategory(service) {
  return service.displayCategory || service.category || "Other";
}

function normalise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleCaseService(text) {
  return String(text || "")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayParts(service) {
  if (service.name.startsWith("Carer Gateway - ")) {
    return {
      title: titleCaseService(service.name.replace("Carer Gateway - ", "")),
      subtitle: "Carer Gateway",
    };
  }

  const provider = cleanFragment(service.provider);
  const name = cleanFragment(service.name);
  const providerSameAsName = provider && normalise(name).includes(normalise(provider));
  const genericProvider = /^(hospital|victorian government|australian government|services australia|community organisation)/i.test(provider);

  return {
    title: name,
    subtitle: provider && !providerSameAsName && !genericProvider ? provider : "",
  };
}

function serviceLabel(service) {
  const parts = displayParts(service);
  return parts.subtitle ? `${parts.title} (${parts.subtitle})` : parts.title;
}

function scoreService(service) {
  let score = 0;
  for (const option of selectedPath()) {
    const rules = option.rules || {};
    if (exactName(service, rules.boostServices)) score += 40;
    if (rules.needTags?.some((tag) => service.needTags.includes(tag))) score += 9;
    if (rules.situationTags?.some((tag) => service.situationTags.includes(tag))) score += 7;
    if (rules.supportTags?.some((tag) => service.supportTags.includes(tag))) score += 6;
    if (rules.context === "hospital" && service.confidence === "verified-public-source") score += 2;
  }
  if (service.referral) score += 2;
  if (service.confidence === "verified-public-source") score += 2;
  if (service.link) score += 1;

  const query = state.search.trim().toLowerCase();
  if (query) {
    const haystack = serviceText(service);
    if (haystack.includes(query)) score += 24;
    for (const token of query.split(/\s+/).filter(Boolean)) {
      if (haystack.includes(token)) score += 3;
    }
  }

  if (service.name === "ALERT Psychosocial (HIP Complex Care)") {
    const explicitlyAlert =
      selectedPath().some((option) => option.rules?.boostServices?.includes("ALERT Psychosocial (HIP Complex Care)")) ||
      state.search.toLowerCase().includes("alert");
    if (!explicitlyAlert) score -= 24;
  }
  return score;
}

function rankedServices(includeAll = false) {
  const hasInput = selectedPath().length > 0 || state.search.trim();
  const ranked = db.services
    .map((service) => ({ service, score: scoreService(service) }))
    .filter((item) => includeAll || (hasInput ? item.score > 0 : item.service.confidence === "verified-public-source"))
    .sort((a, b) => b.score - a.score || a.service.name.localeCompare(b.service.name));
  return ranked;
}

function allServiceRows() {
  const query = state.search.trim().toLowerCase();
  return db.services
    .filter((service) => !query || serviceText(service).includes(query))
    .sort((a, b) => {
      const categorySort = serviceCategory(a).localeCompare(serviceCategory(b));
      return categorySort || a.name.localeCompare(b.name);
    });
}

function priorityRows() {
  const rows = allServiceRows();
  return priorityServiceNames
    .map((name) => rows.find((service) => service.name === name))
    .filter(Boolean);
}

function groupedServiceRows() {
  const groups = new Map();
  for (const service of allServiceRows()) {
    const category = serviceCategory(service);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(service);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    }
    return a.localeCompare(b);
  });
}

function isFinal() {
  const node = activeNode();
  return node.done && !node.all;
}

function serviceDescription(service) {
  return service.description || service.linkLabel || "Open the source link for current service details.";
}

function referralText(service) {
  if (service.referral) return service.referral;
  if (service.link) return "Referral pathway not stored. Open source before referral.";
  return "Referral pathway not stored. Treat as a directory lead only.";
}

function hasReferralPathway(service) {
  return Boolean(cleanFragment(service.referral));
}

function eligibilityText(service) {
  return [service.eligibility, service.catchment].filter(Boolean).join(" ") || "Not stored.";
}

function cleanFragment(text) {
  return String(text || "")
    .replace(/^Directory entry from pasted SVHM-adjacent resource list:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "");
}

function splitBullets(text, fallback) {
  const source = cleanFragment(text);
  if (!source) return [fallback];
  const pieces = source
    .split(/;\s+|\. (?=[A-Z])/)
    .map(cleanFragment)
    .filter(Boolean);
  return pieces.length ? pieces.slice(0, 5) : [source];
}

function setBullets(listElement, bullets) {
  listElement.innerHTML = "";
  for (const bullet of bullets) {
    const li = document.createElement("li");
    li.textContent = bullet;
    listElement.appendChild(li);
  }
}

function setBlock(blockElement, listElement, bullets, visible = true) {
  blockElement.hidden = !visible;
  if (visible) setBullets(listElement, bullets);
}

function descriptionBullets(service) {
  const bullets = splitBullets(serviceDescription(service), "Description not stored. Open source or confirm locally before use.");
  if (service.provider && bullets.length < 4) bullets.push(`Provider: ${service.provider}`);
  return bullets;
}

function referralBullets(service) {
  return splitBullets(referralText(service), "Referral pathway not stored. Open source or confirm locally before referral.");
}

function eligibilityBullets(service) {
  const bullets = [];
  if (service.eligibility) bullets.push(...splitBullets(service.eligibility, ""));
  if (service.catchment) bullets.push(`Catchment: ${cleanFragment(service.catchment)}`);
  if (!bullets.length) bullets.push("Eligibility/catchment not stored. Confirm before referral.");
  return bullets.slice(0, 5);
}

function setMode(mode) {
  state.mode = mode;
  if (mode === "all") {
    state.choices = [];
    state.selectedService = null;
  } else {
    state.search = "";
    state.selectedService = null;
  }
  render();
}

function setServiceTitle(titleElement, subtitleElement, service) {
  const parts = displayParts(service);
  titleElement.textContent = parts.title;
  subtitleElement.textContent = parts.subtitle;
  subtitleElement.hidden = !parts.subtitle;
}

function setSourceLink(linkElement, service) {
  if (service.link) {
    linkElement.href = service.link;
    linkElement.classList.remove("disabled");
    linkElement.textContent = "Open source";
  } else {
    linkElement.href = "#";
    linkElement.classList.add("disabled");
    linkElement.textContent = "No source URL";
  }
}

function populateDetail(target, service) {
  setServiceTitle(target.name, target.subtitle, service);
  setBlock(target.descriptionBlock, target.description, descriptionBullets(service), true);
  setBlock(target.referralBlock, target.referral, referralBullets(service), hasReferralPathway(service));
  setBlock(target.eligibilityBlock, target.eligibility, eligibilityBullets(service), true);
  setSourceLink(target.link, service);
}

function showService(service) {
  state.selectedService = service;
  populateDetail(
    {
      name: el.name,
      subtitle: el.resultSubtitle,
      descriptionBlock: el.descriptionBlock,
      referralBlock: el.referralBlock,
      eligibilityBlock: el.eligibilityBlock,
      description: el.description,
      referral: el.referral,
      eligibility: el.eligibility,
      link: el.link,
    },
    service,
  );
  el.confidence.textContent = service.confidence === "verified-public-source" ? "Verified source" : "Directory lead";
  el.result.hidden = false;
  el.resultEmpty.hidden = true;

  populateDetail(
    {
      name: el.allDetailName,
      subtitle: el.allDetailSubtitle,
      descriptionBlock: el.allDescriptionBlock,
      referralBlock: el.allReferralBlock,
      eligibilityBlock: el.allEligibilityBlock,
      description: el.allDescription,
      referral: el.allReferral,
      eligibility: el.allEligibility,
      link: el.allDetailLink,
    },
    service,
  );
  el.allDetail.hidden = false;
  renderAlternatives(service);
  if (state.mode === "all") renderAllServices();
}

function showPending() {
  el.result.hidden = true;
  el.resultEmpty.hidden = false;
  el.confidence.textContent = "Narrowing";
}

function renderQuestion() {
  const current = activeNode();
  el.options.innerHTML = "";
  el.back.disabled = state.choices.length === 0;

  const path = selectedPath();
  if (el.breadcrumb) {
    el.breadcrumb.textContent = path.length ? path.map((item) => item.label).join(" -> ") : "";
  }

  if (state.mode === "all" || current.all) {
    el.step.textContent = "Browse";
    el.title.textContent = "All services";
    el.help.textContent = "";
    el.help.hidden = true;
    return;
  }

  if (current.done) {
    el.step.textContent = "Matched";
    el.title.textContent = "This path is specific enough.";
    el.help.textContent = "";
    el.help.hidden = true;
    const findAnother = document.createElement("button");
    findAnother.type = "button";
    findAnother.className = "option-button";
    findAnother.textContent = "Find another one";
    findAnother.addEventListener("click", () => {
      state.choices = [];
      state.search = "";
      state.mode = "finder";
      state.selectedService = null;
      el.search.value = "";
      render();
    });
    el.options.appendChild(findAnother);
    return;
  }

  el.step.textContent = `Question ${state.choices.length + 1}`;
  el.title.textContent = current.node.title;
  el.help.textContent = current.node.help;
  el.help.hidden = !current.node.help;

  for (const option of current.node.options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option.label;
    button.addEventListener("click", () => {
      if (option.rules?.mode === "all") {
        setMode("all");
        return;
      }
      state.choices.push(option.id);
      render();
    });
    el.options.appendChild(button);
  }
}

function renderAlternatives(currentService) {
  el.alternatives.innerHTML = "";
  if (state.mode === "all") return;

  const ranked = rankedServices()
    .map((item) => item.service)
    .filter((service, index, services) => services.findIndex((candidate) => candidate.id === service.id) === index);
  const rows = [currentService, ...ranked.filter((service) => service.id !== currentService.id)].slice(0, 4);

  for (const service of rows) {
    const alt = document.createElement("button");
    const isActive = service.id === currentService.id;
    alt.type = "button";
    alt.className = `alt-item${isActive ? " active" : ""}`;
    alt.setAttribute("aria-pressed", String(isActive));

    const title = document.createElement("strong");
    title.textContent = serviceLabel(service);
    const meta = document.createElement("span");
    meta.textContent = isActive ? `Selected - ${serviceCategory(service)}` : serviceCategory(service);
    alt.append(title, meta);

    alt.addEventListener("click", () => showService(service));
    el.alternatives.appendChild(alt);
  }
}

function renderResult() {
  if (state.mode === "all") {
    if (!state.selectedService) showPending();
    return;
  }
  if (!isFinal() && !state.search.trim()) {
    showPending();
    return;
  }
  const best = rankedServices()[0]?.service;
  if (!best) {
    showPending();
    return;
  }
  showService(best);
}

function renderServiceRows(container, rows) {
  container.innerHTML = "";
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "No matching services.";
    container.appendChild(empty);
    return;
  }
  for (const service of rows) {
    const parts = displayParts(service);
    const row = document.createElement("button");
    row.type = "button";
    row.className = `service-row${state.selectedService?.id === service.id ? " active" : ""}`;
    const name = document.createElement("strong");
    name.textContent = parts.title;
    const category = document.createElement("span");
    category.textContent = parts.subtitle || serviceCategory(service);
    const summary = document.createElement("small");
    summary.textContent = cleanFragment(serviceDescription(service));
    const tag = document.createElement("em");
    tag.textContent = serviceCategory(service);
    row.append(name, category, summary);
    if (parts.subtitle) row.appendChild(tag);
    row.addEventListener("pointerdown", (event) => {
      if (event.button === 0) showService(service);
    });
    row.addEventListener("click", () => showService(service));
    container.appendChild(row);
  }
}

function renderAllServices() {
  el.allServices.hidden = state.mode !== "all";
  if (state.mode !== "all") return;
  el.allDetail.hidden = !state.selectedService;
  el.allEmpty.hidden = Boolean(state.selectedService);

  renderServiceRows(el.priorityList, priorityRows());
  el.categoryList.innerHTML = "";
  el.categoryNav.innerHTML = "";

  for (const [category, rows] of groupedServiceRows()) {
    const categoryId = `category-${normalise(category).replace(/\s+/g, "-")}`;
    const jump = document.createElement("button");
    jump.type = "button";
    jump.className = "category-jump";
    jump.textContent = category;
    jump.addEventListener("click", () => {
      const target = document.getElementById(categoryId);
      if (!target) return;
      el.allBrowserScroll.scrollTo({
        top: target.offsetTop - el.allBrowserScroll.offsetTop,
        behavior: "smooth",
      });
    });
    el.categoryNav.appendChild(jump);

    const section = document.createElement("section");
    section.className = "service-section";
    section.id = categoryId;
    const heading = document.createElement("div");
    heading.className = "section-head compact";
    const title = document.createElement("h3");
    title.textContent = category;
    const count = document.createElement("p");
    count.textContent = `${rows.length} services`;
    heading.append(title, count);

    const list = document.createElement("div");
    list.className = "service-card-grid";
    renderServiceRows(list, rows);

    section.append(heading, list);
    el.categoryList.appendChild(section);
  }
}

function saveCart() {
  localStorage.setItem("clientServiceCart", JSON.stringify(state.cart));
}

function addToCart(service) {
  if (!service) return;
  if (!state.cart.some((item) => item.id === service.id)) {
    state.cart.push({
      id: service.id,
      name: serviceLabel(service),
      referral: hasReferralPathway(service) ? referralText(service) : "",
      description: serviceDescription(service),
    });
    saveCart();
    renderCart();
  }
}

function removeFromCart(id) {
  state.cart = state.cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  el.cartCount.textContent = `${state.cart.length} selected`;
  el.cartFloatCount.textContent = state.cart.length;
  el.cartList.innerHTML = "";
  if (!state.cart.length) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "No services added yet.";
    el.cartList.appendChild(empty);
    return;
  }
  for (const item of state.cart) {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `<strong>${item.name}</strong><span>${item.referral || item.description}</span>`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeFromCart(item.id));
    row.appendChild(remove);
    el.cartList.appendChild(row);
  }
}

function renderTabs() {
  el.finderTab.classList.toggle("active", state.mode === "finder");
  el.allTab.classList.toggle("active", state.mode === "all");
  el.body.classList.toggle("all-mode", state.mode === "all");
}

function syncSearchInputs() {
  if (el.search.value !== state.search) el.search.value = state.search;
}

function render() {
  renderTabs();
  syncSearchInputs();
  renderQuestion();
  renderResult();
  renderAllServices();
  renderCart();
}

function setSearch(value) {
  state.search = value;
  render();
}

function serviceSummaryText(service) {
  const rows = [
    `Service: ${serviceLabel(service)}`,
    `Description:\n- ${descriptionBullets(service).join("\n- ")}`,
  ];
  if (hasReferralPathway(service)) rows.push(`Referral pathway:\n- ${referralBullets(service).join("\n- ")}`);
  rows.push(`Eligibility/catchment:\n- ${eligibilityBullets(service).join("\n- ")}`);
  return rows.join("\n");
}

async function copyServiceSummary(button, service) {
  if (!service) return;
  try {
    await navigator.clipboard.writeText(serviceSummaryText(service));
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = "Copy summary";
    }, 1200);
  } catch {
    button.textContent = "Copy unavailable";
  }
}

el.count.textContent = `${db.services.length} services`;
el.search.addEventListener("input", (event) => {
  setSearch(event.target.value);
});
el.search.addEventListener("search", (event) => {
  setSearch(event.target.value);
});
el.search.addEventListener("change", (event) => {
  state.search = event.target.value;
  render();
});
el.reset.addEventListener("click", () => {
  state.choices = [];
  state.search = "";
  state.mode = "finder";
  state.selectedService = null;
  el.search.value = "";
  render();
});
el.back.addEventListener("click", () => {
  state.choices.pop();
  state.mode = "finder";
  render();
});
el.finderTab.addEventListener("click", () => setMode("finder"));
el.allTab.addEventListener("click", () => setMode("all"));
el.add.addEventListener("click", () => addToCart(state.selectedService));
el.allDetailAdd.addEventListener("click", () => addToCart(state.selectedService));
el.clearCart.addEventListener("click", () => {
  state.cart = [];
  saveCart();
  renderCart();
});
el.copyCart.addEventListener("click", async () => {
  if (!state.cart.length) return;
  const summary = state.cart
    .map((item, index) => [`${index + 1}. ${item.name}`, item.description, item.referral ? `Referral: ${item.referral}` : ""].filter(Boolean).join("\n"))
    .join("\n\n");
  try {
    await navigator.clipboard.writeText(summary);
    el.copyCart.textContent = "Copied";
    setTimeout(() => {
      el.copyCart.textContent = "Copy all";
    }, 1200);
  } catch {
    el.copyCart.textContent = "Copy unavailable";
  }
});
el.copy.addEventListener("click", async () => {
  await copyServiceSummary(el.copy, state.selectedService);
});
el.allDetailCopy.addEventListener("click", async () => {
  await copyServiceSummary(el.allDetailCopy, state.selectedService);
});

render();
