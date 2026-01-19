const { app, BrowserWindow, ipcMain, screen, desktopCapturer, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let overlayWindow;
let settings = {
  transparency: 0.9,
  fontSize: 14,
  stealthLevel: 'balanced',
  profile: 'interview',
  layout: 'normal'
};

// Handle Squirrel events for Windows
if (require('electron-squirrel-startup')) {
  app.quit();
}

/**
 * Create the main application window
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets', 'logo.png'),
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * Create the overlay window for AI responses
 */
function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: width - 420,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));
  
  // Apply stealth settings
  if (settings.stealthLevel === 'ultra') {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

/**
 * Request necessary permissions for screen and audio capture
 */
async function requestPermissions() {
  if (process.platform === 'darwin') {
    try {
      const screenStatus = await systemPreferences.getMediaAccessStatus('screen');
      const micStatus = await systemPreferences.getMediaAccessStatus('microphone');
      
      if (screenStatus !== 'granted') {
        await systemPreferences.askForMediaAccess('screen');
      }
      if (micStatus !== 'granted') {
        await systemPreferences.askForMediaAccess('microphone');
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  }
}

/**
 * Initialize the application
 */
app.whenReady().then(async () => {
  await requestPermissions();
  createMainWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

/**
 * Start the overlay window
 */
ipcMain.handle('start-overlay', async () => {
  if (!overlayWindow) {
    createOverlayWindow();
  }
  return { success: true };
});

/**
 * Stop/hide the overlay window
 */
ipcMain.handle('stop-overlay', () => {
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
  return { success: true };
});

/**
 * Get available sources for screen capture
 */
ipcMain.handle('get-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 150, height: 150 }
    });
    
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }));
  } catch (error) {
    console.error('Error getting sources:', error);
    return [];
  }
});

/**
 * Update settings
 */
ipcMain.handle('update-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings };
  
  // Apply settings to overlay if it exists
  if (overlayWindow) {
    overlayWindow.webContents.send('settings-updated', settings);
    
    // Update stealth level
    if (settings.stealthLevel === 'ultra') {
      overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      overlayWindow.setIgnoreMouseEvents(false);
    }
  }
  
  // Save settings to file
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  
  return { success: true, settings };
});

/**
 * Get current settings
 */
ipcMain.handle('get-settings', () => {
  return settings;
});

/**
 * Load saved settings on startup
 */
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
if (fs.existsSync(settingsPath)) {
  try {
    const savedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    settings = { ...settings, ...savedSettings };
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Send AI response to overlay
 */
ipcMain.on('ai-response', (event, response) => {
  if (overlayWindow) {
    overlayWindow.webContents.send('display-response', response);
  }
});

/**
 * Update overlay position
 */
ipcMain.handle('update-overlay-position', (event, { x, y }) => {
  if (overlayWindow) {
    overlayWindow.setPosition(x, y);
  }
  return { success: true };
});

/**
 * Update overlay size
 */
ipcMain.handle('update-overlay-size', (event, { width, height }) => {
  if (overlayWindow) {
    overlayWindow.setSize(width, height);
  }
  return { success: true };
});

console.log('Cheating Daddy Enhanced - Main process initialized');