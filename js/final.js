import { initializeLanguage, getCurrentLanguage } from "./i18n.js";
import { initializeGitHubIdeas } from "./github-ideas.js";
import { initializePlanner } from "./planner.js";
import { eventInfo } from "./event-config.js";

initializeLanguage();

function renderEventDetails() {
    const language = getCurrentLanguage();
    document.querySelectorAll("[data-event-info]").forEach((element) => {
        const detail = eventInfo[element.dataset.eventInfo];
        if (detail) element.textContent = detail[language];
    });
}

renderEventDetails();
window.addEventListener("coderun:languagechange", renderEventDetails);

function initializeFinalFeatures() {
    initializeGitHubIdeas();
    initializePlanner();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeFinalFeatures, { once: true });
} else {
    initializeFinalFeatures();
}
