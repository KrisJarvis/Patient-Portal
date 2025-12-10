# Design Document - Patient Portal Assignment

This document outlines the choices I made while building the Patient Portal and how the system is put together.

## 1. Technology Choices

**Frontend: React.js (Vite)**
I chose React because it's component-based, which makes building interactive UIs (like the file upload list) much more extensive. I used Vite instead of CRA because it's significantly faster and provides a better developer experience. I also used **Tailwind CSS** for styling because it allows for rapid UI development and easy dark mode support.

**Backend: Node.js & Express**
Express is the industry standard for Node servers. It’s lightweight but powerful enough to handle file streams and JSON APIs easily. Keeping the stack JavaScript-based (Frontend + Backend) reduces context switching and simplifies data sharing.

**Database: PostgreSQL (Neon)**
The requirement specificed Neon DB, which is a great choice. It gives us a robust, scalable SQL database without the hassle of managing a local Postgres instance. I used it to store metadata (filenames, sizes, timestamps) while keeping the actual heavy files on the disk.

## 2. Architecture & Data Flow

It's a standard Client-Server architecture:

1.  **The User Interface** (React) runs in the browser.
2.  **The API** (Express) runs on the server.
3.  **The Database** (Neon) stores the records.

**How a file travels:**
*   **Upload:** When you upload a file, the frontend checks if it's a PDF. Then it sends it to the backend. The backend saves the file to a local `uploads/` folder and saves the file *info* (name, path) to the database.
*   **Download:** This was the tricky part! To ensure users always get a working file, I implemented a validation step. When you request a download:
    1.  The server reads the file from the disk.
    2.  It uses a library called `pdf-lib` to load and "re-save" the PDF in memory. This effectively validates the file structure.
    3.  If it's valid, it streams this clean PDF to you. If not, it falls back to the original file.
    4.  It strictly enforces `Content-Disposition: attachment` so your browser knows to save it, not just open it.

## 3. Assumptions & Trade-offs

*   **Authentication:** I didn't implement a login system (like Auth0 or JWT) since it wasn't strictly asked for. In a real app, I'd definitely lock this down so users can only see their own files.
*   **File Storage:** Currently detailed to local disk storage (`uploads/` folder). This is fine for a demo or single server, but if we scaled to 1,000 users or multiple servers, this would break. In that case, I would move the file storage to **AWS S3** or Google Cloud Storage.
*   **Validation:** I'm strictly allowing only `.pdf` files. I handle this check on the frontend (for UX) and the backend (for security).

## 4. API Specification

Here is a quick look at how the backend endpoints work:

*   `GET /documents`: Returns a JSON list of all uploaded files.
*   `POST /documents/upload`: Expects a `multipart/form-data` body with a `file` field.
*   `GET /documents/:id`: Downloads the file. Supports `?inline=true` to view in browser, or `?download=Filename.pdf` to specify a name.
*   `DELETE /documents/:id`: Removes the file from the disk and the database entry.
