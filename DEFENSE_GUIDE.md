# CodeRun Final — Defence Guide

## Suggested live demonstration

1. Start on Home. Switch to Russian and dark mode, then open another page to show that both preferences persist.
2. Open Projects. Search GitHub for `hackathon`, point out the loading message, API cards, search filter, sort menu, paging buttons, and saved-idea control. Mention that the browser cache avoids repeat calls.
3. Open Team planner. Add two tasks with different priorities and due dates. Edit one, complete one, filter or sort the list, and show the dashboard bars and counts changing.
4. Reload the page to show that task records are restored from localStorage. Clear completed tasks and show that this action persists too.
5. Submit the registration form empty, explain the field errors, then submit valid sample data to show the success state.
6. Briefly open Schedule and About to show that the endterm filter and jQuery FAQ are still present.

If the public API is offline or rate-limited, explain the error state and show cached data if the browser has a previous successful search. Do not repeatedly refresh the search: unauthenticated GitHub searches are rate-limited.

## Suggested contribution split

- **Erzhan:** shared visual system, responsive layout, navigation, bilingual interface, and accessibility labels.
- **Alisher:** GitHub API request, `GitHubRepository` class, result search/sort/filter/pagination, and API states.
- **Bekarys:** `PlannerTask` and `TaskBoard` classes, localStorage CRUD, dashboard calculations, registration form, and README/defence walkthrough.

These are useful presentation roles. Every member should still be able to locate and explain the other parts of the site.

## Practice questions and answer points

### Erzhan

1. **What shapes the design?** Warm paper, dark navigation, and lime actions. CSS variables define colors; Bootstrap and CSS Grid shape pages, and media queries stack the layout on phones.
2. **How does the language control work?** `js/i18n.js` looks up text by key, applies translations to marked elements, updates the document language, and saves the choice in localStorage.
3. **How is the dark theme remembered?** `app.js` reads and writes the `coderun-theme` key and toggles the `theme-dark` body class. CSS variables change the page colors.
4. **Why use labels and ARIA attributes?** Labels connect form controls to their names; live regions and expanded states make changing content easier to understand with assistive technology.

### Alisher

1. **What does `fetch` return?** A Promise. `await` pauses the async function until the response arrives, after which the code checks the status and reads JSON.
2. **What is sent to GitHub?** A public repository search query with optional language, sort, order, and result-count parameters. No secret key is included.
3. **How are loading, empty, and error states different?** Loading waits for a response; an empty state is a successful response with no matching items; an error state means the request failed or was rate-limited.
4. **What does `GitHubRepository` do?** Its constructor normalizes API fields into a repository object. Methods match search text and build a safe card from the object's values.

### Bekarys

1. **What does the `PlannerTask` constructor do?** It creates one task with an ID, normalized fields, priority, completion state, and timestamps.
2. **How does task CRUD work?** `TaskBoard` adds objects, finds and updates them by ID, changes completion, and removes selected tasks; rendering then rebuilds the visible list.
3. **Why use JSON with localStorage?** localStorage stores strings, so the app serializes task objects with `JSON.stringify` and restores them with `JSON.parse`. Invalid or unavailable storage is handled with a visible message.
4. **How is dashboard progress calculated?** `getStats()` counts all and completed tasks, calculates overdue and priority totals, then computes completed divided by total as a percentage.

## Earlier-stage topics to review

- Arrays: `projectData`, `scheduleData`, repository objects, and task objects.
- Loops and array methods: `for...of`, `forEach`, `filter`, `sort`, `map`, and `find`.
- DOM: `createElement`, `textContent`, `append`, `replaceChildren`, attributes, and class changes.
- Events: `input`, `change`, `click`, `submit`, `keydown`, and `DOMContentLoaded`.
- Validation: `preventDefault()`, checking each value, and showing field-specific feedback.
- jQuery: selectors, `.closest()`, `.find()`, `.parent()`, `.children()`, `.slideToggle()`, and `.fadeToggle()` in `jquery-interactions.js`.
