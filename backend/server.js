const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const cors = require('cors'); // Import the cors package

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        console.log('File received:', req.file); // Log file details
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        console.log('Extracted text:', data.text); // Log extracted text
        res.send(data.text);
    } catch (error) {
        console.error('Error reading PDF file:', error); // Log error
        res.status(500).send('Error reading PDF file');
    } finally {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});