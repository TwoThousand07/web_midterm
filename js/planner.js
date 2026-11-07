import { t, getCurrentLanguage } from "./i18n.js";

const STORAGE_KEY = "coderun-team-tasks-v1";
const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 };

// A task keeps its own data and methods, while TaskBoard handles the full list.
export class PlannerTask {
    constructor(data = {}) {
        this.id = data.id || (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
        this.title = String(data.title || "").trim();
        this.notes = String(data.notes || "").trim();
        this.priority = ["high", "normal", "low"].includes(data.priority) ? data.priority : "normal";
        this.dueDate = String(data.dueDate || "");
        this.completed = Boolean(data.completed);
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || this.createdAt;
    }

    update(details) {
        this.title = String(details.title || "").trim();
        this.notes = String(details.notes || "").trim();
        this.priority = ["high", "normal", "low"].includes(details.priority) ? details.priority : "normal";
        this.dueDate = String(details.dueDate || "");
        this.updatedAt = new Date().toISOString();
    }

    setCompleted(value) {
        this.completed = Boolean(value);
        this.updatedAt = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            notes: this.notes,
            priority: this.priority,
            dueDate: this.dueDate,
            completed: this.completed,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export class TaskBoard {
    constructor(storage) {
        try {
            this.storage = storage || window.localStorage;
        } catch (error) {
            this.storage = null;
        }
        this.tasks = [];
        this.storageAvailable = Boolean(this.storage);
        this.invalidSavedData = false;
        this.load();
    }

    load() {
        if (!this.storage) {
            this.storageAvailable = false;
            return;
        }
        try {
            const saved = this.storage.getItem(STORAGE_KEY);
            const data = saved ? JSON.parse(saved) : [];
            if (!Array.isArray(data)) {
                throw new Error("Saved tasks are not a list.");
            }
            this.tasks = data.map((item) => new PlannerTask(item));
        } catch (error) {
            // Ignore broken saved JSON so the planner can still open with an empty list.
            this.tasks = [];
            if (error && error.name === "SecurityError") {
                this.storageAvailable = false;
            } else {
                this.invalidSavedData = true;
            }
        }
    }

    save() {
        if (!this.storage) {
            this.storageAvailable = false;
            return false;
        }
        try {
            // localStorage accepts strings, so save the task objects as JSON.
            this.storage.setItem(STORAGE_KEY, JSON.stringify(this.tasks.map((task) => task.toJSON())));
            this.storageAvailable = true;
            return true;
        } catch (error) {
            this.storageAvailable = false;
            return false;
        }
    }

    add(details) {
        const task = new PlannerTask(details);
        this.tasks.push(task);
        return { task, saved: this.save() };
    }

    update(id, details) {
        const task = this.tasks.find((item) => item.id === id);
        if (!task) {
            return false;
        }
        task.update(details);
        return this.save();
    }

    setCompleted(id, completed) {
        const task = this.tasks.find((item) => item.id === id);
        if (!task) {
            return false;
        }
        task.setCompleted(completed);
        return this.save();
    }

    delete(id) {
        const previousLength = this.tasks.length;
        this.tasks = this.tasks.filter((item) => item.id !== id);
        return previousLength !== this.tasks.length ? this.save() : false;
    }

    clearCompleted() {
        const previousLength = this.tasks.length;
        this.tasks = this.tasks.filter((item) => !item.completed);
        return previousLength !== this.tasks.length ? this.save() : true;
    }

    getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const stats = { total: this.tasks.length, completed: 0, overdue: 0, high: 0, normal: 0, low: 0 };
        this.tasks.forEach((task) => {
            if (task.completed) {
                stats.completed += 1;
            } else if (task.dueDate && new Date(task.dueDate + "T00:00:00") < today) {
                stats.overdue += 1;
            }
            stats[task.priority] += 1;
        });
        stats.open = stats.total - stats.completed;
        stats.percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
        return stats;
    }

    getVisibleTasks(filter, sort) {
        const result = this.tasks.filter((task) => {
            if (filter === "open") return !task.completed;
            if (filter === "done") return task.completed;
            return true;
        });
        result.sort((a, b) => {
            if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        });
        return result;
    }
}

function formattedDate(dateValue) {
    if (!dateValue) return t("planner.noDate");
    const date = new Date(dateValue + "T00:00:00");
    return date.toLocaleDateString(getCurrentLanguage() === "ru" ? "ru-RU" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

function taskCard(task) {
    const article = document.createElement("article");
    article.className = "task-card" + (task.completed ? " task-completed" : "");
    article.dataset.taskId = task.id;

    const top = document.createElement("div");
    top.className = "task-card-top";
    const title = document.createElement("h3");
    title.className = "h6 mb-1";
    title.textContent = task.title;
    const priority = document.createElement("span");
    priority.className = "priority-label priority-" + task.priority;
    priority.textContent = t("planner." + task.priority);
    top.append(title, priority);

    const notes = document.createElement("p");
    notes.className = "task-notes";
    notes.textContent = task.notes;
    notes.hidden = !task.notes;

    const meta = document.createElement("p");
    meta.className = "small text-muted mb-3";
    meta.textContent = t("planner.due", { date: formattedDate(task.dueDate) });

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.className = "btn btn-sm btn-outline-primary js-task-complete";
    completeButton.dataset.completed = String(!task.completed);
    completeButton.textContent = t(task.completed ? "planner.markOpen" : "planner.markDone");
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn btn-sm btn-outline-secondary js-task-edit";
    editButton.textContent = t("planner.edit");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-sm btn-link text-danger js-task-delete";
    deleteButton.textContent = t("planner.delete");
    actions.append(completeButton, editButton, deleteButton);
    article.append(top, notes, meta, actions);
    return article;
}

export function initializePlanner() {
    const form = document.getElementById("taskForm");
    if (!form) return;

    const board = new TaskBoard();
    const list = document.getElementById("taskList");
    const notice = document.getElementById("plannerNotice");
    const titleField = document.getElementById("taskTitle");
    const dateField = document.getElementById("taskDueDate");
    const editIdField = document.getElementById("editingTaskId");
    const submitButton = document.getElementById("taskSubmit");
    const cancelEdit = document.getElementById("cancelTaskEdit");
    let noticeKey = board.invalidSavedData ? "planner.invalidData" : "planner.storageOk";
    let noticeIsError = board.invalidSavedData;

    function announce(messageKey, isError = false) {
        noticeKey = messageKey;
        noticeIsError = isError;
        notice.textContent = t(messageKey);
        notice.className = "alert " + (isError ? "alert-warning" : "alert-success") + " py-2";
        notice.hidden = false;
    }

    function renderDashboard() {
        const stats = board.getStats();
        document.getElementById("taskTotal").textContent = stats.total;
        document.getElementById("taskCompleted").textContent = stats.completed;
        document.getElementById("taskOverdue").textContent = stats.overdue;
        document.getElementById("taskCompletionText").textContent = stats.percent + "%";
        const progress = document.getElementById("taskProgress");
        progress.style.width = stats.percent + "%";
        progress.setAttribute("aria-valuenow", String(stats.percent));
        progress.setAttribute("aria-label", t("planner.progress") + " " + stats.percent + "%");
        ["high", "normal", "low"].forEach((priority) => {
            const bar = document.getElementById("priorityBar-" + priority);
            const amount = stats.total ? Math.round((stats[priority] / stats.total) * 100) : 0;
            bar.style.width = amount + "%";
            bar.setAttribute("aria-valuenow", String(amount));
            document.getElementById("priorityCount-" + priority).textContent = stats[priority];
        });
    }

    function renderTasks() {
        const visibleTasks = board.getVisibleTasks(document.getElementById("taskFilter").value, document.getElementById("taskSort").value);
        list.replaceChildren();
        visibleTasks.forEach((task) => list.append(taskCard(task)));
        document.getElementById("taskEmpty").hidden = visibleTasks.length > 0;
        renderDashboard();
        if (!board.storageAvailable) {
            announce("planner.storageError", true);
        }
    }

    function resetForm() {
        form.reset();
        editIdField.value = "";
        document.getElementById("taskFormTitle").textContent = t("planner.newTask");
        submitButton.textContent = t("planner.addButton");
        cancelEdit.hidden = true;
        titleField.classList.remove("is-invalid");
        dateField.classList.remove("is-invalid");
        document.getElementById("taskTitleError").textContent = "";
        document.getElementById("taskDateError").textContent = "";
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const title = titleField.value.trim();
        const dueDate = dateField.value;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = dueDate ? new Date(dueDate + "T00:00:00") : null;
        const titleError = title.length < 3 ? t("planner.titleError") : "";
        const dateError = selectedDate && selectedDate < today ? t("planner.dateError") : "";
        titleField.classList.toggle("is-invalid", Boolean(titleError));
        dateField.classList.toggle("is-invalid", Boolean(dateError));
        document.getElementById("taskTitleError").textContent = titleError;
        document.getElementById("taskDateError").textContent = dateError;
        if (titleError || dateError) {
            (titleError ? titleField : dateField).focus();
            return;
        }

        const details = {
            title,
            notes: document.getElementById("taskNotes").value.trim(),
            priority: document.getElementById("taskPriority").value,
            dueDate
        };
        const editingId = editIdField.value;
        let saved;
        if (editingId) {
            saved = board.update(editingId, details);
            announce(saved ? "planner.updated" : "planner.storageError", !saved);
        } else {
            const result = board.add(details);
            saved = result.saved;
            announce(saved ? "planner.created" : "planner.storageError", !saved);
        }
        resetForm();
        renderTasks();
    }

    form.addEventListener("submit", handleFormSubmit);
    cancelEdit.addEventListener("click", resetForm);
    document.getElementById("taskFilter").addEventListener("change", renderTasks);
    document.getElementById("taskSort").addEventListener("change", renderTasks);
    document.getElementById("clearCompletedTasks").addEventListener("click", function () {
        if (window.confirm(t("planner.clearConfirm"))) {
            board.clearCompleted();
            announce("planner.clearDoneMessage");
            renderTasks();
        }
    });

    list.addEventListener("click", function (event) {
        const card = event.target.closest("[data-task-id]");
        if (!card) return;
        const id = card.dataset.taskId;
        if (event.target.closest(".js-task-complete")) {
            const button = event.target.closest(".js-task-complete");
            const saved = board.setCompleted(id, button.dataset.completed === "true");
            if (!saved) announce("planner.storageError", true);
            renderTasks();
        } else if (event.target.closest(".js-task-edit")) {
            const task = board.tasks.find((item) => item.id === id);
            if (!task) return;
            editIdField.value = task.id;
            titleField.value = task.title;
            document.getElementById("taskNotes").value = task.notes;
            document.getElementById("taskPriority").value = task.priority;
            dateField.value = task.dueDate;
            document.getElementById("taskFormTitle").textContent = t("planner.editTask");
            submitButton.textContent = t("planner.saveButton");
            cancelEdit.hidden = false;
            titleField.focus();
        } else if (event.target.closest(".js-task-delete")) {
            if (window.confirm(t("planner.deleteConfirm"))) {
                board.delete(id);
                announce("planner.deleted");
                renderTasks();
            }
        }
    });

    window.addEventListener("coderun:languagechange", function () {
        if (noticeKey) announce(noticeKey, noticeIsError);
        if (titleField.classList.contains("is-invalid")) {
            document.getElementById("taskTitleError").textContent = t("planner.titleError");
        }
        if (dateField.classList.contains("is-invalid")) {
            document.getElementById("taskDateError").textContent = t("planner.dateError");
        }
        if (editIdField.value) {
            document.getElementById("taskFormTitle").textContent = t("planner.editTask");
            submitButton.textContent = t("planner.saveButton");
        }
        renderTasks();
    });

    announce(noticeKey, noticeIsError);
    renderTasks();
}
