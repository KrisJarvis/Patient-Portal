const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');
const { PDFDocument } = require('pdf-lib');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error while fetching documents' });
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a valid PDF file.' });
    }

    try {
        const { filename, path: filepath, size } = req.file;

        const newDoc = await pool.query(
            'INSERT INTO documents (filename, filepath, size) VALUES ($1, $2, $3) RETURNING *',
            [req.file.originalname, filepath, size]
        );

        res.status(201).json({
            message: 'File uploaded successfully',
            document: newDoc.rows[0]
        });

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: 'Failed to save document metadata.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const doc = result.rows[0];
        // Use path.join with __dirname to be safe regardless of where node process started.
        // Assuming documents.js is in /routes, and uploads is in /uploads (sibling to routes).
        const absolutePath = path.join(__dirname, '..', 'uploads', path.basename(doc.filepath));

        if (fs.existsSync(absolutePath)) {
            let downloadName = req.query.download || doc.filename;
            downloadName = path.basename(downloadName);

            if (!downloadName.toLowerCase().endsWith('.pdf')) {
                downloadName += '.pdf';
            }

            try {
                const fileBuffer = fs.readFileSync(absolutePath);

                const pdfDoc = await PDFDocument.load(fileBuffer);
                const pdfBytes = await pdfDoc.save();
                const processedBuffer = Buffer.from(pdfBytes);

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Length', processedBuffer.length);

                if (req.query.inline === 'true') {
                    res.setHeader('Content-Disposition', `inline; filename="${downloadName.replace(/"/g, '')}"`);
                } else {
                    res.attachment(downloadName);
                }

                res.send(processedBuffer);

            } catch (err) {
                console.error("PDF processing failed, falling back to raw file:", err);

                if (req.query.inline === 'true') {
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `inline; filename="${downloadName.replace(/"/g, '')}"`);
                    res.sendFile(absolutePath);
                } else {
                    res.download(absolutePath, downloadName);
                }
            }
        } else {
            console.error("File not found at path:", absolutePath);
            res.status(404).json({ error: 'File missing from server storage.' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find file first
        const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const doc = result.rows[0];
        const absolutePath = path.resolve(doc.filepath);

        await pool.query('DELETE FROM documents WHERE id = $1', [id]);

        fs.unlink(absolutePath, (err) => {
            if (err) {
                console.error("Failed to delete local file:", err);
            }
        });

        res.json({ message: 'File deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
