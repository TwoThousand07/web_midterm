import { t, getCurrentLanguage } from "./i18n.js";

const GITHUB_SEARCH_URL = "https://api.github.com/search/repositories";
const CACHE_KEY = "coderun-github-search-cache-v2";
const CACHE_MAX_AGE = 10 * 60 * 1000;
const PAGE_SIZE = 6;

// Keep only the repository fields that the page uses from GitHub's response.
export class GitHubRepository {
    constructor(data) {
        this.id = String(data.id || data.full_name);
        this.name = data.name || "Untitled repository";
        this.fullName = data.full_name || this.name;
        this.description = data.description || "";
        this.language = data.language || "";
        this.stars = Number(data.stargazers_count) || 0;
        this.updatedAt = data.updated_at || "";
        this.url = data.html_url || "https://github.com";
    }

    matchesSearch(searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        const text = (this.fullName + " " + this.description + " " + this.language).toLowerCase();
        return !term || text.includes(term);
    }

    toCard(isSaved) {
        const column = document.createElement("div");
        column.className = "col";
        const card = document.createElement("article");
        card.className = "card repo-card h-100";
        const body = document.createElement("div");
        body.className = "card-body d-flex flex-column";

        const heading = document.createElement("h3");
        heading.className = "h6 mb-2";
        const titleLink = document.createElement("a");
        titleLink.href = this.url;
        titleLink.target = "_blank";
        titleLink.rel = "noopener noreferrer";
        titleLink.textContent = this.fullName;
        heading.append(titleLink);

        const description = document.createElement("p");
        description.className = "small repo-description";
        description.textContent = this.description || t("github.noDescription");

        const metadata = document.createElement("p");
        metadata.className = "small text-muted mt-auto mb-3";
        const language = this.language || t("github.noLanguage");
        const date = this.updatedAt ? new Date(this.updatedAt).toLocaleDateString(getCurrentLanguage() === "ru" ? "ru-RU" : "en-US") : "—";
        metadata.textContent = language + " · " + t("github.stars", { count: this.stars.toLocaleString() }) + " · " + t("github.updated", { date });

        const actions = document.createElement("div");
        actions.className = "d-flex gap-2 flex-wrap";
        const openLink = document.createElement("a");
        openLink.href = this.url;
        openLink.target = "_blank";
        openLink.rel = "noopener noreferrer";
        openLink.className = "btn btn-sm btn-outline-secondary";
        openLink.textContent = t("github.openRepo");

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.className = isSaved ? "btn btn-sm btn-primary js-save-repository" : "btn btn-sm btn-outline-primary js-save-repository";
        saveButton.dataset.repositoryId = this.id;
        saveButton.setAttribute("aria-pressed", String(isSaved));
        saveButton.textContent = isSaved ? t("github.savedOne") : t("github.save");
        actions.append(openLink, saveButton);

        body.append(heading, description, metadata, actions);
        card.append(body);
        column.append(card);
        return column;
    }
}

// Cache recent searches and use matching saved results if the request fails.
export class GitHubRepositoryService {
    readCache() {
        try {
            const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
            return cached && Array.isArray(cached.items) ? cached : null;
        } catch (error) {
            return null;
        }
    }

    async search(query, language) {
        const normalizedQuery = query.trim() || "hackathon";
        if (normalizedQuery.length < 2 || normalizedQuery.length > 120) {
            const queryError = new Error("invalid-query");
            queryError.code = "invalid-query";
            throw queryError;
        }
        const cache = this.readCache();
        const cacheMatches = cache && cache.query === normalizedQuery && cache.language === language;
        const cacheAge = cacheMatches ? Date.now() - cache.savedAt : Infinity;

        if (cacheMatches && cacheAge < CACHE_MAX_AGE) {
            return { repositories: cache.items.map((item) => new GitHubRepository(item)), source: "cache", stale: false };
        }

        const terms = normalizedQuery + " in:name,description" + (language ? " language:" + language : "");
        const params = new URLSearchParams({ q: terms, sort: "stars", order: "desc", per_page: "50" });
        const url = GITHUB_SEARCH_URL + "?" + params.toString();

        try {
            const response = await fetch(url, {
                headers: {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });
            if (!response.ok) {
                if (response.status === 403 || response.status === 429) {
                    const rateLimitError = new Error("rate-limit");
                    rateLimitError.code = "rate-limit";
                    throw rateLimitError;
                }
                throw new Error("request-failed");
            }

            const payload = await response.json();
            const items = Array.isArray(payload.items) ? payload.items : [];
            const nextCache = {
                query: normalizedQuery,
                language,
                savedAt: Date.now(),
                items
            };
            try {
                window.localStorage.setItem(CACHE_KEY, JSON.stringify(nextCache));
            } catch (error) {
            }
            return {
                repositories: items.map((item) => new GitHubRepository(item)),
                source: "api",
                stale: false,
                incomplete: Boolean(payload.incomplete_results)
            };
        } catch (error) {
            if (cacheMatches && cache.items.length) {
                return { repositories: cache.items.map((item) => new GitHubRepository(item)), source: "cache", stale: true };
            }
            if (error.code === "rate-limit") {
                throw error;
            }
            throw new Error("network");
        }
    }
}

function readSavedIds() {
    try {
        const saved = JSON.parse(window.localStorage.getItem("coderun-saved-repositories") || "[]");
        return Array.isArray(saved) ? saved.map(String) : [];
    } catch (error) {
        return [];
    }
}

export function initializeGitHubIdeas() {
    const form = document.getElementById("repoSearchForm");
    if (!form) {
        return;
    }

    const service = new GitHubRepositoryService();
    const queryField = document.getElementById("repoQuery");
    const languageField = document.getElementById("repoLanguage");
    const refineField = document.getElementById("repoRefine");
    const sortField = document.getElementById("repoSort");
    const grid = document.getElementById("repoGrid");
    const status = document.getElementById("repoStatus");
    const pager = document.getElementById("repoPager");
    let repositories = [];
    let savedIds = readSavedIds();
    let savedOnly = false;
    let page = 1;
    let loading = false;
    let errorCode = "";

    function setStatus(kind, message) {
        status.className = "api-status api-status-" + kind;
        status.textContent = message;
        status.setAttribute("role", kind === "error" ? "alert" : "status");
        status.setAttribute("aria-busy", String(kind === "loading"));
    }

    function getVisibleRepositories() {
        const refined = repositories.filter((repo) => {
            const matchesText = repo.matchesSearch(refineField.value);
            const matchesLanguage = !languageField.value || repo.language.toLowerCase() === languageField.value.toLowerCase();
            const matchesSaved = !savedOnly || savedIds.includes(repo.id);
            return matchesText && matchesLanguage && matchesSaved;
        });
        if (sortField.value === "updated") {
            refined.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else if (sortField.value === "name") {
            refined.sort((a, b) => a.fullName.localeCompare(b.fullName));
        } else {
            refined.sort((a, b) => b.stars - a.stars);
        }
        return refined;
    }

    function renderResults() {
        const visible = getVisibleRepositories();
        const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
        page = Math.min(page, pageCount);
        const start = (page - 1) * PAGE_SIZE;
        const pageItems = visible.slice(start, start + PAGE_SIZE);
        grid.replaceChildren();
        pageItems.forEach((repo) => grid.append(repo.toCard(savedIds.includes(repo.id))));

        if (!loading && !errorCode && repositories.length > 0 && visible.length === 0) {
            setStatus("empty", savedOnly && savedIds.length === 0 ? t("github.empty") : t("github.empty"));
        } else if (!loading && !errorCode && repositories.length === 0) {
            setStatus("empty", t("github.empty"));
        } else if (!loading && !errorCode) {
            const shownEnd = Math.min(start + PAGE_SIZE, visible.length);
            const prefix = sourceLabel === "cache" && isStale ? t("github.cached") + " " : "";
            setStatus("success", prefix + t("github.success", { shown: shownEnd - start, total: visible.length }));
        }

        pager.hidden = visible.length <= PAGE_SIZE;
        document.getElementById("repoPageLabel").textContent = t("github.page", { page, pages: pageCount });
        document.getElementById("repoPrevious").disabled = page <= 1;
        document.getElementById("repoNext").disabled = page >= pageCount;
        document.getElementById("savedIdeasToggle").setAttribute("aria-pressed", String(savedOnly));
        document.getElementById("savedIdeasToggle").textContent = savedOnly ? t("github.allIdeas") : t("github.savedOnly");
    }

    let sourceLabel = "api";
    let isStale = false;

    async function searchRepositories(event) {
        if (event) {
            event.preventDefault();
        }
        const submittedQuery = queryField.value.trim();
        const queryError = submittedQuery.length < 2 || submittedQuery.length > 120;
        queryField.classList.toggle("is-invalid", queryError);
        document.getElementById("repoQueryError").textContent = queryError ? t("github.queryError") : "";
        if (queryError) {
            loading = false;
            errorCode = "invalid-query";
            repositories = [];
            grid.replaceChildren();
            pager.hidden = true;
            setStatus("error", t("github.queryError"));
            document.getElementById("repoRetry").hidden = true;
            queryField.focus();
            return;
        }
        loading = true;
        errorCode = "";
        page = 1;
        pager.hidden = true;
        document.getElementById("repoRetry").hidden = true;
        grid.replaceChildren();
        setStatus("loading", t("github.loading"));
        document.getElementById("repoSearchButton").disabled = true;
        try {
            const result = await service.search(queryField.value, languageField.value);
            repositories = result.repositories;
            sourceLabel = result.source;
            isStale = result.stale;
            loading = false;
            if (repositories.length === 0) {
                setStatus("empty", t("github.empty"));
            } else {
                renderResults();
            }
        } catch (error) {
            loading = false;
            errorCode = error.code || "network";
            repositories = [];
            grid.replaceChildren();
            setStatus("error", errorCode === "rate-limit" ? t("github.rateLimit") : t("github.error"));
            document.getElementById("repoRetry").hidden = false;
        } finally {
            document.getElementById("repoSearchButton").disabled = false;
        }
    }

    form.addEventListener("submit", searchRepositories);
    document.getElementById("repoRetry").addEventListener("click", searchRepositories);
    queryField.addEventListener("input", function () {
        const length = queryField.value.trim().length;
        if (length >= 2 && length <= 120) {
            queryField.classList.remove("is-invalid");
            document.getElementById("repoQueryError").textContent = "";
        }
    });
    refineField.addEventListener("input", function () { page = 1; renderResults(); });
    sortField.addEventListener("change", renderResults);
    document.getElementById("savedIdeasToggle").addEventListener("click", function () {
        savedOnly = !savedOnly;
        page = 1;
        renderResults();
    });
    document.getElementById("repoPrevious").addEventListener("click", function () {
        page = Math.max(1, page - 1);
        renderResults();
    });
    document.getElementById("repoNext").addEventListener("click", function () {
        page += 1;
        renderResults();
    });
    grid.addEventListener("click", function (event) {
        const button = event.target.closest(".js-save-repository");
        if (!button) {
            return;
        }
        const id = button.dataset.repositoryId;
        savedIds = savedIds.includes(id) ? savedIds.filter((savedId) => savedId !== id) : savedIds.concat(id);
        try {
            window.localStorage.setItem("coderun-saved-repositories", JSON.stringify(savedIds));
        } catch (error) {
            errorCode = "storage";
        }
        renderResults();
        if (errorCode === "storage") setStatus("error", t("github.storageError"));
    });

    window.addEventListener("coderun:languagechange", function () {
        if (loading) {
            setStatus("loading", t("github.loading"));
        } else if (errorCode) {
            const message = errorCode === "rate-limit" ? t("github.rateLimit") : (errorCode === "storage" ? t("github.storageError") : (errorCode === "invalid-query" ? t("github.queryError") : t("github.error")));
            setStatus("error", message);
        } else if (repositories.length) {
            renderResults();
        } else {
            setStatus("empty", t("github.empty"));
        }
    });

    searchRepositories();
}
