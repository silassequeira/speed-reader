const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const cors = require('cors');

console.log('Current directory:', __dirname);

// Express server section
function createExpressServer() {
    const expressApp = express();
    expressApp.use(cors());
    expressApp.use(express.json()); // Add JSON body parsing

    // Serve frontend build files
    const buildPath = path.join(__dirname, './frontend/build');
    console.log('Looking for frontend at:', buildPath);
    expressApp.use(express.static(buildPath));

    // Upload configuration
    const upload = multer({ dest: 'uploads/' });

    // Define API routes before 404 middleware
    expressApp.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
        try {
            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdfParse(dataBuffer);

            const processedText = await processPDFText(data.text);
            res.send(processedText);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Error processing PDF');
        } finally {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path); // Clean up uploaded file
            }
        }
    });

    return expressApp;
}

// Helper function for PDF processing
async function processPDFText(rawText) {
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

// Start server function
function startServer() {
    const expressApp = createExpressServer();
    return new Promise((resolve, reject) => {
        try {
            const server = expressApp.listen(3000, () => {
                console.log('Server running on port 3000');
                resolve(server);
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Electron app section
let window; // Main browser window
let isCustomMaximized = false; // Tracks custom maximize state

async function main() {
    // Wait for Electron to be ready
    await app.whenReady();

    // Create the main browser window
    window = new BrowserWindow({
        width: 1000,
        height: 900,
        frame: false, // Frameless window
        icon: path.join(__dirname, 'assets', 'logov3.png'), // Set the window icon
        transparent: false, // Disable transparency for debugging
        backgroundColor: '#FFFFFF', // White background for visibility
        webPreferences: {
            preload: path.join(__dirname, 'preloader.js'), // Connect to preloader.js
            contextIsolation: true, // Better security
            nodeIntegration: true, // Disable node integration
            //devTools: true, // Enable DevTools for debugging
        },
    });

    // Open DevTools on start
    //window.webContents.openDevTools();

    // Handle window close
    window.on('closed', () => {
        app.quit();
    });

    // Log loading events
    window.webContents.on('did-start-loading', () => {
        console.log('Window started loading content');
    });

    window.webContents.on('did-finish-load', () => {
        console.log('Window finished loading content');
    });

    window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorDescription, errorCode);
    });

    // Start the backend server
    try {
        await startServer();
        console.log('Backend server started successfully.');

        // Add a small delay before loading the URL
        setTimeout(() => {
            // Load the frontend from localhost
            console.log('Loading URL: http://localhost:3000');
            window.loadURL('http://localhost:3000');

            // Detect system theme and apply dark mode if necessary
            if (nativeTheme.shouldUseDarkColors) {
                window.webContents.send('apply-dark-mode');
            }
        }, 1000); // 1 second delay
    } catch (error) {
        console.error('Failed to start backend server:', error);
    }
}

// Handle IPC events for custom window controls
ipcMain.on('window-minimize', () => {
    if (window) window.minimize();
});

ipcMain.on('window-maximize', () => {
    if (window) {
        if (isCustomMaximized) {
            // Restore to original dimensions
            window.setBounds({ width: 1000, height: 900, x: 100, y: 100 }); // Adjust position as needed
            isCustomMaximized = false;
        } else {
            // Maximize the window
            window.maximize();
            isCustomMaximized = true;
        }
    }
});

ipcMain.on('window-close', () => {
    if (window) window.close();
});

// Run the app
main();