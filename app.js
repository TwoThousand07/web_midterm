"use strict";

// JavaScript builds the project gallery and schedule from these arrays.
const projectData = [
    {
        id: "booking-system",
        title: "Booking System",
        category: "web",
        stack: "React and Django",
        year: "2025",
        image: "images/booking.jpg",
        imageAltKey: "project.bookingAlt",
        descriptionKey: "project.bookingDescription",
        description: "A web application for reserving shared workspaces and managing room availability."
    },
    {
        id: "epub-reader",
        title: "iOS EPUB Reader",
        category: "mobile",
        stack: "Swift",
        year: "2025",
        image: "images/reader.jpg",
        imageAltKey: "project.readerAlt",
        descriptionKey: "project.readerDescription",
        description: "A Swift app for reading EPUB books with asynchronous loading and a clean library view."
    },
    {
        id: "smart-home-ui",
        title: "Smart Home UI",
        category: "iot",
        stack: "Web and IoT",
        year: "2024",
        image: "images/smart-home.jpeg",
        imageAltKey: "project.homeAlt",
        descriptionKey: "project.homeDescription",
        description: "A cross-platform interface for checking room status and managing connected devices."
    }
];

const scheduleData = [
    { day: "friday", time: "18:00", title: "Opening Ceremony & Pitching", titleKey: "event.opening", location: "Main Hall", locationKey: "location.main", category: "ceremony" },
    { day: "friday", time: "20:00", title: "Coding Starts", titleKey: "event.coding", location: "Coworking Zones", locationKey: "location.coworking", category: "coding" },
    { day: "saturday", time: "14:00", title: "Workshop: Project Architecture", titleKey: "event.workshop", location: "Room 101", locationKey: "location.room101", category: "workshop" },
    { day: "sunday", time: "15:00", title: "Project Submission Deadline", titleKey: "event.deadline", location: "Online Platform", locationKey: "location.online", category: "deadline" },
    { day: "sunday", time: "17:00", title: "Awards Ceremony", titleKey: "event.awards", location: "Main Hall", locationKey: "location.main", category: "ceremony" }
];

function translated(key, values = {}) {
    return window.coderunT ? window.coderunT(key, values) : key;
}

let savedProjectIds = loadFromStorage("coderun-saved-projects", []);
if (!Array.isArray(savedProjectIds)) {
    savedProjectIds = [];
}
let onlyShowSaved = false;

function loadFromStorage(key, fallbackValue) {
    try {
        const storedValue = window.localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : fallbackValue;
    } catch (error) {
        // Use the default value if saved data is missing or unreadable.
        return fallbackValue;
    }
}

function saveToStorage(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
    }
}

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    return element;
}

function createProjectCard(project) {
    const column = document.createElement("div");
    column.className = "col project-card";

    const card = document.createElement("article");
    card.className = "card h-100 shadow-sm";

    const image = document.createElement("img");
    image.className = "card-img-top";
    image.src = project.image;
    image.alt = translated(project.imageAltKey);
    image.loading = "lazy";

    const body = document.createElement("div");
    body.className = "card-body d-flex flex-column";
    const badge = createTextElement("span", "badge text-bg-light border align-self-start mb-2", translated("category." + project.category));
    const title = createTextElement("h2", "h5 card-title", project.title);
    const description = createTextElement("p", "card-text", translated(project.descriptionKey));
    const details = createTextElement("p", "small text-muted mt-auto mb-3", project.stack + " · " + project.year);
    const saveButton = document.createElement("button");
    const isSaved = savedProjectIds.includes(project.id);
    saveButton.type = "button";
    saveButton.className = isSaved ? "btn btn-primary js-favorite" : "btn btn-outline-primary js-favorite";
    saveButton.dataset.projectId = project.id;
    saveButton.setAttribute("aria-pressed", String(isSaved));
    saveButton.setAttribute("aria-label", translated(isSaved ? "gallery.unsaveAria" : "gallery.saveAria", { title: project.title }));
    saveButton.textContent = translated(isSaved ? "gallery.savedOne" : "gallery.save");

    body.append(badge, title, description, details, saveButton);
    card.append(image, body);
    column.append(card);
    return column;
}

function getVisibleProjects(projects, query, category, favoritesOnly) {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter(function (project) {
        const searchableText = (project.title + " " + project.description + " " + translated(project.descriptionKey) + " " + project.stack).toLowerCase();
        const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
        const matchesCategory = category === "all" || project.category === category;
        const matchesFavorite = !favoritesOnly || savedProjectIds.includes(project.id);
        return matchesQuery && matchesCategory && matchesFavorite;
    });
}

function renderProjects() {
    const projectGrid = document.getElementById("projectGrid");
    if (!projectGrid) {
        return;
    }

    const searchInput = document.getElementById("projectSearch");
    const categorySelect = document.getElementById("projectCategory");
    const visibleProjects = getVisibleProjects(
        projectData,
        searchInput.value,
        categorySelect.value,
        onlyShowSaved
    );

    projectGrid.replaceChildren();
    visibleProjects.forEach(function (project) {
        projectGrid.append(createProjectCard(project));
    });

    const count = document.getElementById("projectCount");
    const emptyMessage = document.getElementById("projectEmpty");
    const savedButton = document.getElementById("favoritesFilter");
    count.textContent = translated("gallery.count", { shown: visibleProjects.length, saved: savedProjectIds.length });
    emptyMessage.hidden = visibleProjects.length > 0;
    savedButton.setAttribute("aria-pressed", String(onlyShowSaved));
    savedButton.textContent = translated(onlyShowSaved ? "gallery.showAll" : "gallery.saved");
}

function createScheduleRow(item) {
    const row = document.createElement("tr");
    const timeCell = createTextElement("td", "", translated("day." + item.day) + ", " + item.time);
    const eventCell = createTextElement("th", "fw-normal", translated(item.titleKey));
    eventCell.scope = "row";
    const locationCell = createTextElement("td", "", translated(item.locationKey));
    const categoryCell = document.createElement("td");
    categoryCell.append(createTextElement("span", "badge text-bg-light border", translated("category." + item.category)));
    row.append(timeCell, eventCell, locationCell, categoryCell);
    return row;
}

function renderSchedule() {
    const scheduleRows = document.getElementById("scheduleRows");
    if (!scheduleRows) {
        return;
    }

    const category = document.getElementById("scheduleFilter").value;
    const matchingEvents = scheduleData.filter(function (item) {
        return category === "all" || item.category === category;
    });

    scheduleRows.replaceChildren();
    for (const item of matchingEvents) {
        scheduleRows.append(createScheduleRow(item));
    }

    const eventCount = matchingEvents.length;
    document.getElementById("scheduleCount").textContent = translated("schedule.count", { shown: eventCount, total: scheduleData.length });
    document.getElementById("scheduleEmpty").hidden = eventCount > 0;
}

function renderHomeEvents() {
    const homeEvents = document.getElementById("homeEvents");
    if (!homeEvents) {
        return;
    }

    homeEvents.replaceChildren();
    scheduleData.slice(0, 3).forEach(function (item) {
        const column = document.createElement("div");
        column.className = "col-md-4";
        const panel = document.createElement("article");
        panel.className = "feature-panel h-100 p-3";
        panel.append(
            createTextElement("p", "small text-muted mb-1", translated("day." + item.day) + " · " + item.time),
            createTextElement("h3", "h5", translated(item.titleKey)),
            createTextElement("p", "mb-0", translated(item.locationKey))
        );
        column.append(panel);
        homeEvents.append(column);
    });
}

function initializeTheme() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) {
        return;
    }

    const storedTheme = loadFromStorage("coderun-theme", "light");
    const isDark = storedTheme === "dark";
    document.body.classList.toggle("theme-dark", isDark);
    toggle.textContent = translated(isDark ? "theme.light" : "theme.dark");
    toggle.setAttribute("aria-pressed", String(isDark));

    toggle.addEventListener("click", function () {
        const darkModeEnabled = document.body.classList.toggle("theme-dark");
        toggle.textContent = translated(darkModeEnabled ? "theme.light" : "theme.dark");
        toggle.setAttribute("aria-pressed", String(darkModeEnabled));
        saveToStorage("coderun-theme", darkModeEnabled ? "dark" : "light");
    });
}

function getRegistrationData(form) {
    return {
        teamName: form.elements.teamName.value.trim(),
        email: form.elements.email.value.trim(),
        members: form.elements.members.value.trim(),
        techStack: form.elements.techStack.value,
        message: form.elements.message.value.trim()
    };
}

function validateRegistration(data) {
    // Keep each rule here so the form can show an error beside the right field.
    const errors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const memberCount = Number(data.members);

    if (data.teamName.length < 2) {
        errors.teamName = translated("contact.teamError");
    }
    if (!emailPattern.test(data.email)) {
        errors.email = translated("contact.emailError");
    }
    if (!Number.isInteger(memberCount) || memberCount < 1 || memberCount > 3) {
        errors.members = translated("contact.membersError");
    }
    if (!data.techStack) {
        errors.techStack = translated("contact.stackError");
    }
    if (data.message.length < 20) {
        errors.message = translated("contact.ideaError");
    }
    return errors;
}

function setFieldState(field, errorMessage, errorId) {
    const feedback = document.getElementById(errorId);
    feedback.textContent = errorMessage || "";
    field.classList.toggle("is-invalid", Boolean(errorMessage));
    field.classList.toggle("is-valid", !errorMessage);
    field.setAttribute("aria-invalid", String(Boolean(errorMessage)));
}

function updateIdeaCounter(messageField) {
    const count = messageField.value.length;
    document.getElementById("ideaCounter").textContent = translated("contact.characters", { count });
}

function initializeRegistrationForm() {
    const form = document.getElementById("registrationForm");
    if (!form) {
        return;
    }

    const fields = [
        [form.elements.teamName, "teamName", "teamNameError"],
        [form.elements.email, "email", "emailError"],
        [form.elements.members, "members", "membersError"],
        [form.elements.techStack, "techStack", "techStackError"],
        [form.elements.message, "message", "messageError"]
    ];
    const successMessage = document.getElementById("registrationSuccess");
    const messageField = form.elements.message;
    updateIdeaCounter(messageField);

    form.addEventListener("input", function (event) {
        if (event.target === messageField) {
            updateIdeaCounter(messageField);
        }
        successMessage.hidden = true;
        if (form.dataset.submitted === "true") {
            const errors = validateRegistration(getRegistrationData(form));
            fields.forEach(function (fieldInfo) {
                setFieldState(fieldInfo[0], errors[fieldInfo[1]], fieldInfo[2]);
            });
        }
    });

    form.addEventListener("change", function () {
        successMessage.hidden = true;
        if (form.dataset.submitted === "true") {
            const errors = validateRegistration(getRegistrationData(form));
            fields.forEach(function (fieldInfo) {
                setFieldState(fieldInfo[0], errors[fieldInfo[1]], fieldInfo[2]);
            });
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        form.dataset.submitted = "true";
        const errors = validateRegistration(getRegistrationData(form));
        let firstInvalidField = null;

        fields.forEach(function (fieldInfo) {
            const errorMessage = errors[fieldInfo[1]];
            setFieldState(fieldInfo[0], errorMessage, fieldInfo[2]);
            if (errorMessage && !firstInvalidField) {
                firstInvalidField = fieldInfo[0];
            }
        });

        if (firstInvalidField) {
            firstInvalidField.focus();
            successMessage.hidden = true;
            return;
        }

        successMessage.textContent = translated("contact.success");
        successMessage.hidden = false;
        form.reset();
        form.dataset.submitted = "false";
        fields.forEach(function (fieldInfo) {
            fieldInfo[0].classList.remove("is-valid", "is-invalid");
            fieldInfo[0].setAttribute("aria-invalid", "false");
        });
        updateIdeaCounter(messageField);
    });
}

function initializeProjectFilters() {
    const searchInput = document.getElementById("projectSearch");
    if (!searchInput) {
        return;
    }

    searchInput.addEventListener("input", renderProjects);
    document.getElementById("projectCategory").addEventListener("change", renderProjects);
    document.getElementById("favoritesFilter").addEventListener("click", function () {
        onlyShowSaved = !onlyShowSaved;
        renderProjects();
    });
    document.getElementById("clearProjectFilters").addEventListener("click", function () {
        searchInput.value = "";
        document.getElementById("projectCategory").value = "all";
        onlyShowSaved = false;
        renderProjects();
        searchInput.focus();
    });
    document.getElementById("projectGrid").addEventListener("click", function (event) {
        const button = event.target.closest(".js-favorite");
        if (!button) {
            return;
        }

        const projectId = button.dataset.projectId;
        savedProjectIds = savedProjectIds.includes(projectId)
            ? savedProjectIds.filter(function (savedId) { return savedId !== projectId; })
            : savedProjectIds.concat(projectId);
        saveToStorage("coderun-saved-projects", savedProjectIds);
        renderProjects();
    });
    renderProjects();
}

function initializeScheduleFilter() {
    const scheduleFilter = document.getElementById("scheduleFilter");
    if (!scheduleFilter) {
        return;
    }
    scheduleFilter.addEventListener("change", renderSchedule);
    renderSchedule();
}

function initializePage() {
    initializeTheme();
    renderHomeEvents();
    initializeProjectFilters();
    initializeScheduleFilter();
    initializeRegistrationForm();
}

document.addEventListener("DOMContentLoaded", initializePage);

window.addEventListener("coderun:languagechange", function () {
    renderHomeEvents();
    renderProjects();
    renderSchedule();
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.textContent = translated(document.body.classList.contains("theme-dark") ? "theme.light" : "theme.dark");
    }
    const form = document.getElementById("registrationForm");
    if (form && form.dataset.submitted === "true") {
        const errors = validateRegistration(getRegistrationData(form));
        [[form.elements.teamName, "teamName", "teamNameError"], [form.elements.email, "email", "emailError"], [form.elements.members, "members", "membersError"], [form.elements.techStack, "techStack", "techStackError"], [form.elements.message, "message", "messageError"]].forEach(function (fieldInfo) {
            setFieldState(fieldInfo[0], errors[fieldInfo[1]], fieldInfo[2]);
        });
    }
    const successMessage = document.getElementById("registrationSuccess");
    if (successMessage && !successMessage.hidden) {
        successMessage.textContent = translated("contact.success");
    }
    const messageField = document.getElementById("message");
    if (messageField) updateIdeaCounter(messageField);
});
