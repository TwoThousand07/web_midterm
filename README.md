# CodeRun Hackathon Website

Endterm continuation of the responsive CodeRun midterm website. It keeps the original hackathon topic and five connected pages, and adds browser interactions using JavaScript and jQuery.

## Group

- Erzhan
- Alisher
- Bekarys

## Pages

- Home: hackathon introduction and a schedule preview generated from event data.
- About: event details and an expandable FAQ.
- Schedule: event table generated from data, with a category filter.
- Projects: project cards generated from data, with search, category filters, and saved projects.
- Contact: team registration form with field-specific validation and a local success message.

All pages share responsive Bootstrap navigation and a light/dark theme control. Saved projects and the theme choice use this browser's local storage. Images in the images folder are replaceable project previews.

## Run locally

Open index.html in a browser, or serve this folder with a local static server. For example, from the project folder run:

    python3 -m http.server 8000

Then open http://localhost:8000. Bootstrap and jQuery are loaded from CDNs, so the browser needs an internet connection for those libraries.

## Try the interactive features

1. On Projects, search by a word such as “React”, change the category, and clear the filters.
2. Save a project, switch to saved projects, reload the page, and check that the saved list remains.
3. Press Escape in the project search box to clear it.
4. On Schedule, select a category and confirm that the matching rows and event count update.
5. Use the theme button on any page and navigate to another page to see the preference persist.
6. On About, open and close the FAQ answers. On Contact, open “Need a hand?”.
7. On Contact, submit the empty form to see field-specific messages. Then enter a team name of at least 2 characters, a valid email, a team size from 1 to 3, a technology category, and an idea of at least 20 characters. The valid form shows a success message.

The registration interaction is a front-end demonstration. It validates data in the browser and does not submit it to a server.

## Publish

The project is a static site and can be hosted on GitHub Pages or Netlify. For GitHub Pages, push the project to a GitHub repository, open Settings → Pages, select the main branch and the root folder, and save. After GitHub provides the site address, add it here before submitting:

    Live site: add the published URL here

## Group commit breakdown

The project history separates the work into member-sized commits: site foundation and shared design (Erzhan), dynamic project and schedule features (Alisher), and registration, jQuery interactions, and usage documentation (Bekarys). The original midterm image files are retained in a separate commit.
