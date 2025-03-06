const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const { startServer } = require('./server.js');
const path = require('path');

let window; // Main browser window
let isCustomMaximized = false; // Tracks custom maximize state

async function main() {
    // Wait for Electron to be ready
    await app.whenReady();

    // Create the main browser window
    window = new BrowserWindow({
        width: 1000,
        height: 700,
        frame: false, // Frameless window
        transparent: true, // Enable transparency
        backgroundColor: '#00000000', // Transparent background
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'), // Connect to preloader.js
            contextIsolation: true, // Better security
            devTools: true, // Enable DevTools
        },
    });

    // Handle window close
    window.on('closed', () => {
        app.quit();
    });

    // Start the backend server
    try {
        await startServer();
        console.log('Backend server started successfully.');
    } catch (error) {
        console.error('Failed to start backend server:', error);
    }

    // Load the frontend from the build folder or localhost
    // window.loadFile(path.join(__dirname, './frontend/build/index.html'));
    // Alternatively, use this if serving from localhost:
    window.loadURL('http://localhost:3000');

    // Detect system theme and apply dark mode if necessary
    if (nativeTheme.shouldUseDarkColors) {
        window.webContents.send('apply-dark-mode');
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
            window.setBounds({ width: 1000, height: 700, x: 100, y: 100 }); // Adjust position as needed
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
