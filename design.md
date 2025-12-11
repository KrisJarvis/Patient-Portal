# Design Document - Patient Portal

This doc is just a quick run-through of how I built the app and why I made certain choices.

## 1. The Stack
I stuck to a standard setup that I'm comfortable with:
*   **React (Vite):** Vite is just way faster than spinning up a classic CRA app. I paired it with **Tailwind** because I like having my styles right there in the markup—saves me from flipping between CSS files.
*   **Node/Express:** It's the standard for a reason. Flexible, easy to set up, and handles JSON APIs perfectly.
*   **Postgres (Neon):** This was a requirement, but honestly, serverless Postgres is nice to work with since I don't have to manage a local database service.

## 2. How it works (Architecture)
It's a pretty standard Client-Server setup:
1.  **React Frontend:** Where the user drags/drops files.
2.  **Express API:** Handles the requests.
3.  **Local Storage + DB:**
    *   I'm storing the actual PDF files on the disk (`uploads/` folder).
    *   I'm storing the *metadata* (filename, original name, size, date) in Postgres.

**The "Download" Flow:**
When you click download, I'm not just serving a static link. The server actually reads the file and streams it back to you with `Content-Disposition: attachment`. This forces the browser to pop up the "Save As" dialog instead of just navigating to the PDF URL, which I think is a better user experience for a "Portal".

## 3. Assumptions & Trade-offs
*   **No Auth:** I didn't add login/signup since it wasn't explicitly asked for, but obviously, in a real app, you'd want to lock this down so users only see their own records.
*   **Local Storage:** Storing files on disk works for a small demo, but if this were going to production with thousands of users, I'd move the storage to S3 or Google Cloud Storage to avoid running out of disk space on the server.
*   **Validation:** I'm strictly checking specifically for PDFs both on the frontend (for UX) and backend (for safety).

## 4. API Spec
Here's how the backend is listening:
*   `GET /documents` -> Lists everything.
*   `POST /documents/upload` -> Takes a `multipart/form-data` file.
*   `GET /documents/:id` -> Streams the file download.
*   `DELETE /documents/:id` -> Nukes the file from disk and DB.
