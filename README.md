# Patient Portal Assignment

Hey! Here is my submission for the Patient Portal simple full-stack app. I've built this to handle medical document management (uploading, viewing, downloading PDFs) using **React**, **Node/Express**, and **PostgreSQL**.

## Features
I focused on keeping the experience smooth and the code clean:
*   **Drag & Drop Upload:** You can easily drop PDF files to upload them (capped at 5MB).
*   **In-Browser View:** Added a button to open PDFs directly in a new tab so you don't always have to download them.
*   **Downloads:** Files are streamed back to the client with the correct filename.
*   **File Management:** You can list all files and delete the ones you don't want.

## Quick Setup
I set this up so you don't have to jump between folders to get it running.

**Prerequisites:** Just Node.js.

1.  **Database:** I'm using **Neon DB** (Serverless Postgres). You'll need to grab the connection string and pop it into `backend/.env`.

2.  **Run it:**
    I added a script in the root so you can install and run everything at once:
    ```bash
    # Install dependencies for both frontend and backend
    npm install

    # Start the servers
    npm run dev
    ```
    
    This will spin up:
    *   Frontend at `http://localhost:5173`
    *   Backend at `http://localhost:5000`

(If you really want to run them manually, you can still `cd` into frontend/backend folders and run `npm run dev` in each).

## Tech Stack & Notes
*   **Frontend:** React + Vite. I used **Tailwind CSS** for styling because it's just faster to iterate with, and I wanted a nice dark mode.
*   **Backend:** Simple Express server.
*   **Storage:** Files are currently saved locally in an `uploads/` folder for simplicity.

## API Endpoints
If you want to hit the API directly (Postman/cURL):
*   `POST /documents/upload` - Send file as form-data.
*   `GET /documents` - JSON list of files.
*   `GET /documents/:id` - Downloads the file.
*   `DELETE /documents/:id` - Deletes file & DB record.

Let me know if you run into any issues!
