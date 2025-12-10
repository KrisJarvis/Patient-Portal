# Patient Portal Assignment

Hi there! This is my submission for the Patient Portal assignment. It's a full-stack web application designed to help patients manage their medical documents easily. I built it using **React**, **Node.js**, and **PostgreSQL**.

## What it does
*   **Uploads:** You can drag and drop PDF files to upload them. I added a 5MB limit to keep things reasonable.
*   **Preview Mode:** There's a "View" button that lets you read the PDF right in your browser without downloading it.
*   **Reliable Downloads:** I spent some time ensuring that when you hit "Download", you actually get a valid `.pdf` file every time (the system even validates the PDF structure before sending it to you).
*   **Management:** You can see a list of all your files and delete the ones you don't need.

## Setup Instructions

Prereqs: You'll need **Node.js** installed on your machine.

### 1. Database
I used **Neon DB** (Serverless Postgres) for this. You'll need a connection string in your `.env` file.

### 2. Backend
The backend runs the API and handles file storage.
```bash
cd backend
npm install

npm run dev
```
It runs on port **5000**.

### 3. Frontend
The frontend is the UI you interact with.
```bash
cd frontend
npm install
npm run dev
```
It usually runs on port **5173**. Open that link in your browser!

## API Quick Reference
If you prefer testing with `curl` or Postman, here are the main endpoints I built:

*   **Upload:** `POST /documents/upload` (Send a file as form-data)
*   **List:** `GET /documents`
*   **Download:** `GET /documents/:id` (Use query `?download=MyFile.pdf` to name it)
*   **Delete:** `DELETE /documents/:id`

## Notes
Everything is styled with **Tailwind CSS** because I wanted it to look clean and modern without writing a ton of custom CSS files.
