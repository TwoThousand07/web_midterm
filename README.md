# CodeRun Hackathon

CodeRun is a responsive, bilingual hackathon website continued from the group’s midterm and endterm projects. It uses HTML, CSS, Bootstrap, JavaScript, and jQuery.

## Group

- Erzhan
- Alisher
- Bekarys

## Pages

- **Home:** event details and schedule preview
- **About:** hackathon information and FAQ
- **Schedule:** event list with category filtering
- **Projects:** project gallery, favorites, and GitHub search
- **Team planner:** task creation and management
- **Contact:** validated team registration form

## Features

- GitHub repository search using `fetch` and `async`/`await`, with loading, success, empty, and error states
- `GitHubRepository`, `PlannerTask`, and `TaskBoard` classes
- Task CRUD saved as JSON in `localStorage`
- Repository search, filtering, sorting, saved items, and pagination
- Task dashboard with totals, overdue counts, completion percentage, and priority statistics
- Saved language and theme preferences
- Dynamic content, form validation, project favorites, schedule filtering, and jQuery FAQ and help interactions

## Run locally

From the project folder, start a local server:

    python3 -m http.server 8000

Open http://localhost:8000. Bootstrap, jQuery, and GitHub search require an internet connection.

## Test the features

1. Switch the language and theme, then open another page to check that preferences persist.
2. On Projects, search and filter gallery items, save a project, and reload the page.
3. Search GitHub repositories; try filtering, sorting, pagination, and saving a result.
4. In Team planner, add, edit, complete, filter, sort, and delete tasks. Reload the page to check saved tasks and dashboard statistics.
5. On Contact, submit an empty form, then submit valid data to see the validation messages and success state.
6. On About, open and close FAQ answers. On Schedule, filter events by category.

## GitHub API

The Projects page uses the public `GET https://api.github.com/search/repositories` endpoint. It displays repository names, descriptions, languages, star counts, update dates, and links. The endpoint does not require an API key. Search results are cached in the browser for 10 minutes; network errors and rate limits are handled in the interface.

The registration form validates data in the browser and does not send it to a server.

## Project links

- Published site: [URL]
- GitHub repository: [URL]