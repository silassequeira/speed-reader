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

    let text = rawText
        .replace(/(\r\n|\n|\r)/gm, '\n')
        .replace(/\s+/g, ' ');


    text = text.replace(/(\w+)-\n(\w+)/g, '$1$2');


    const paragraphs = text.split(/\n{2,}/);


    return paragraphs
        .map(p => p.replace(/\n/g, ' ').trim())
        .filter(p => p.length > 0)
        .join('\n%%PAGE_BREAK%%\n');
}

app.listen(3000, () => console.log('Server running on port 3000'));