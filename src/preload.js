const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose safe APIs to renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Overlay controls
  startOverlay: () => ipcRenderer.invoke('start-overlay'),
  stopOverlay: () => ipcRenderer.invoke('stop-overlay'),
  
  // Screen capture
  getSources: () => ipcRenderer.invoke('get-sources'),
  
  // Settings
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  
  // AI responses
  sendAIResponse: (response) => ipcRenderer.send('ai-response', response),
  onDisplayResponse: (callback) => ipcRenderer.on('display-response', (event, data) => callback(data)),
  
  // Overlay positioning
  updateOverlayPosition: (position) => ipcRenderer.invoke('update-overlay-position', position),
  updateOverlaySize: (size) => ipcRenderer.invoke('update-overlay-size', size),
  
  // Settings updates
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (event, data) => callback(data)),
  
  // Platform info
  platform: process.platform
});

console.log('Preload script loaded successfully');