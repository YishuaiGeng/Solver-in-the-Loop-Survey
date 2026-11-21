const search = document.querySelector("#catalogue-search");
const query = document.querySelector("#study-query");
const role = document.querySelector("#study-role");
const status = document.querySelector("#study-status");
const results = document.querySelector("#study-results");
const previous = document.querySelector("#study-previous");
const next = document.querySelector("#study-next");
const pageLabel = document.querySelector("#study-page");
const pagination = pageLabel.parentElement;

const roleNames = Object.fromEntries(
  [...role.options].filter(option => option.value).map(option => [option.value, option.textContent])
);
const pageSize = 8;
let studies = [];
let page = 0;

function renderStudy(study) {
  const item = document.createElement("li");
  const title = document.createElement(study.url === "not_reported" ? "strong" : "a");
  title.textContent = study.title;
  if (title instanceof HTMLAnchorElement) {
    title.href = study.url;
  }

  const details = document.createElement("span");
  details.className = "study-meta";
  details.textContent = [study.authors, study.year, study.venue]
    .filter(value => value && value !== "not_reported")
    .join(" · ");
  const badges = document.createElement("span");
  badges.className = "study-badges";
  for (const code of study.solver_roles) {
    if (!roleNames[code]) continue;
    const badge = document.createElement("span");
    badge.className = `badge role-${code}`;
    badge.textContent = roleNames[code];
    badges.append(badge);
  }
  item.append(title, details, badges);
  return item;
}

function render() {
  const terms = query.value.toLowerCase().trim().split(/\s+/);
  const matches = studies.filter(study =>
    (!role.value || study.solver_roles.includes(role.value)) &&
    terms.every(term => study.searchText.includes(term))
  );
  const totalPages = Math.ceil(matches.length / pageSize);

  status.textContent = matches.length === 0
    ? "No studies match these filters."
    : `${matches.length.toLocaleString("en-US")} ${matches.length === 1 ? "study" : "studies"}`;
  results.replaceChildren(...matches.slice(page * pageSize, (page + 1) * pageSize).map(renderStudy));
  pagination.hidden = totalPages < 2;
  pageLabel.textContent = `Page ${page + 1} of ${totalPages}`;
  previous.disabled = page === 0;
  next.disabled = page + 1 >= totalPages;
}

function resetPage() {
  page = 0;
  render();
}

async function loadCatalogue() {
  search.hidden = false;
  pagination.hidden = true;
  query.disabled = true;
  role.disabled = true;
  status.textContent = "Loading the study catalogue…";
  try {
    const response = await fetch("data/papers.json");
    if (!response.ok) {
      throw new Error(`Catalogue request returned ${response.status}`);
    }
    const data = await response.json();
    studies = data.map(study => ({
      ...study,
      searchText: `${study.title} ${study.authors} ${study.year}`.toLowerCase()
    })).sort((left, right) => right.year - left.year || left.title.localeCompare(right.title));
    query.disabled = false;
    role.disabled = false;
    render();
  } catch {
    status.textContent = "The study search could not load. Browse the full catalogue on GitHub or download the CSV below.";
  }
}

query.addEventListener("input", resetPage);
role.addEventListener("change", resetPage);
previous.addEventListener("click", () => {
  page -= 1;
  render();
  if (previous.disabled) next.focus();
});
next.addEventListener("click", () => {
  page += 1;
  render();
  if (next.disabled) previous.focus();
});

const catalogue = document.querySelector("#catalogue");
const observer = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) {
    observer.disconnect();
    loadCatalogue();
  }
}, { rootMargin: "350px" });
observer.observe(catalogue);
