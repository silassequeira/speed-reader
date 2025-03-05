const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json()); // Add JSON body parsing

// Serve frontend build files
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));

// Upload configuration
const upload = multer({ dest: 'uploads/' });

// Define API routes before 404 middleware
app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);

        const processedText = processPDFText(data.text);
        res.send(processedText);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error processing PDF');
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Handle all GET requests for single-page app (React)
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

// 404 Not Found middleware (must be last)
app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found' });
});

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Helper function
function processPDFText(rawText) {
    let text = rawText
        .replace(/(\r\n|\n|\r)/gm, '\n')
        .replace(/\s+/g, ' ')
        .replace(/(\w+)-\n(\w+)/g, '$1$2');

    const paragraphs = text.split(/\n{2,}/);

    return paragraphs
        .map(p => p.replace(/\n/g, ' ').trim())
        .filter(p => p.length > 0)
        .join('\n%%PAGE_BREAK%%\n');
}

// Start server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});