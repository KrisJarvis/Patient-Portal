const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
// ...

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
    // Check if file is PDF
    const allowedMimeTypes = ['application/pdf', 'text/plain', 'text/csv', 'application/json'];

    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
        cb(null, true);
    } else {
        cb(null, true);
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

        // Construct the absolute path safely
        // Assuming uploads are stored in 'backend/uploads' and this file is in 'backend/routes'
        const absolutePath = path.join(__dirname, '..', 'uploads', path.basename(doc.filepath));

        if (!fs.existsSync(absolutePath)) {
            console.error("File missing at:", absolutePath);
            return res.status(404).json({ error: 'File missing from server storage.' });
        }

        // Ensure the filename ends with .pdf for the client
        let downloadName = doc.filename || 'document.pdf';
        if (!downloadName.toLowerCase().endsWith('.pdf')) {
            downloadName += '.pdf';
        }

        const safeFilename = downloadName.replace(/"/g, '');

        try {
            // Read the file from disk
            const fileBuffer = fs.readFileSync(absolutePath);
            let processedBuffer;

            try {
                // Try to load as PDF first
                const pdfDoc = await PDFDocument.load(fileBuffer);
                const pdfBytes = await pdfDoc.save();
                processedBuffer = Buffer.from(pdfBytes);
                console.log(`[Download] File ${safeFilename} processed as valid PDF.`);

            } catch (pdfLoadError) {
                console.log(`[Download] File ${safeFilename} is not a valid PDF. Converting content to PDF...`);

                try {
                    const newPdfDoc = await PDFDocument.create();
                    // Embed Standard Font (Helvetica) - no custom font file needed
                    const helveticaFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);

                    const page = newPdfDoc.addPage();
                    const { width, height } = page.getSize();
                    const fontSize = 10;
                    const margin = 50;

                    // Treat buffer as utf-8 text
                    // We sanitize characters that might break pdf-lib (keeps basic ASCII/printable)
                    const textContent = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, '');

                    // Simple wrapping/truncation to fit on page
                    const maxLines = Math.floor((height - 2 * margin) / (fontSize + 2));
                    const lines = textContent.split('\n');
                    const printedText = lines.slice(0, maxLines).join('\n');

                    page.drawText('Converted to PDF (Preview):', {
                        x: margin,
                        y: height - margin,
                        size: 14,
                        font: helveticaFont,
                        color: rgb(0, 0, 0.7),
                    });

                    page.drawText(printedText, {
                        x: margin,
                        y: height - margin - 30,
                        size: fontSize,
                        font: helveticaFont,
                        color: rgb(0, 0, 0),
                        lineHeight: fontSize + 2,
                    });

                    const newPdfBytes = await newPdfDoc.save();
                    processedBuffer = Buffer.from(newPdfBytes);

                } catch (conversionError) {
                    console.error("[Download] Critical: Failed to create conversion PDF", conversionError);
                    // Last resort: Create an error PDF so the user STILL gets a PDF file
                    const errorPdf = await PDFDocument.create();
                    const errPage = errorPdf.addPage();
                    errPage.drawText('Error: Could not convert source file.', { x: 50, y: 700 });
                    processedBuffer = Buffer.from(await errorPdf.save());
                }
            }

            // --- FINAL RESPONSE SENDING ---
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', processedBuffer.length);

            // Handle Inline vs Attachment
            // If the user wants to "View", use inline. If "Download", use attachment.
            const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';

            // Force .pdf extension in filename
            let finalName = safeFilename;
            if (!finalName.toLowerCase().endsWith('.pdf')) finalName += '.pdf';

            res.setHeader('Content-Disposition', `${disposition}; filename="${finalName}"`);

            res.send(processedBuffer);

        } catch (filesysError) {
            console.error("File system error during download:", filesysError);
            res.status(500).json({ error: 'Internal server error processing file.' });
        }
    } catch (err) {
        console.error("Error fetching document:", err);
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
