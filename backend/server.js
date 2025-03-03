const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);

        // Enhanced text processing
        const processedText = processPDFText(data.text);

        res.send(processedText);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error processing PDF');
    } finally {
        fs.unlinkSync(req.file.path);
    }
});

function processPDFText(rawText) {
    // Step 1: Normalize line breaks and whitespace
    let text = rawText
        .replace(/(\r\n|\n|\r)/gm, '\n')  // Standardize line breaks
        .replace(/\s+/g, ' ');             // Collapse multiple spaces

    // Step 2: Merge hyphenated words
    text = text.replace(/(\w+)-\n(\w+)/g, '$1$2');

    // Step 3: Identify paragraphs
    const paragraphs = text.split(/\n{2,}/); // Split on 2+ newlines

    // Step 4: Clean paragraphs and join with markers
    return paragraphs
        .map(p => p.replace(/\n/g, ' ').trim()) // Remove inner line breaks
        .filter(p => p.length > 0)              // Remove empty paragraphs
        .join('\n%%PAGE_BREAK%%\n');           // Add custom paragraph marker
}

app.listen(3000, () => console.log('Server running on port 3000'));