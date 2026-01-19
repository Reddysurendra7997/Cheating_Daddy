/**
 * Renderer Process - Main Window Logic
 */

// State
let isOverlayActive = false;
let mediaStream = null;
let aiClient = null;
let currentSettings = {};

// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const apiKeyInput = document.getElementById('apiKey');
const profileSelect = document.getElementById('profileSelect');
const contextInput = document.getElementById('contextInput');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const transparencySlider = document.getElementById('transparencySlider');
const transparencyValue = document.getElementById('transparencyValue');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const stealthSelect = document.getElementById('stealthSelect');
const layoutSelect = document.getElementById('layoutSelect');
const overlayStatus = document.getElementById('overlayStatus');
const captureStatus = document.getElementById('captureStatus');
const stealthStatus = document.getElementById('stealthStatus');

// Load saved API key from localStorage
const savedApiKey = localStorage.getItem('geminiApiKey');
if (savedApiKey) {
  apiKeyInput.value = savedApiKey;
}

// Load saved context
const savedContext = localStorage.getItem('customContext');
if (savedContext) {
  contextInput.value = savedContext;
}

// Load saved profile
const savedProfile = localStorage.getItem('aiProfile');
if (savedProfile) {
  profileSelect.value = savedProfile;
}

/**
 * Initialize AI client with Gemini API
 */
async function initializeAI() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    alert('Please enter your Gemini API key');
    return false;
  }

  // Save API key
  localStorage.setItem('geminiApiKey', apiKey);
  
  // Initialize Gemini (note: actual implementation would use @google/generative-ai)
  aiClient = {
    apiKey,
    model: 'gemini-2.0-flash-exp',
    profile: profileSelect.value,
    context: contextInput.value
  };

  return true;
}

/**
 * Start screen capture
 */
async function startScreenCapture() {
  try {
    const sources = await window.electronAPI.getSources();
    
    if (sources.length === 0) {
      throw new Error('No screen sources available');
    }

    // Use the first screen source
    const constraints = {
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop'
        }
      },
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sources[0].id
        }
      }
    };

    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    captureStatus.textContent = 'Capturing';
    captureStatus.classList.remove('inactive');
    captureStatus.classList.add('active');
    
    // Start processing stream
    processMediaStream(mediaStream);
    
    return true;
  } catch (error) {
    console.error('Screen capture error:', error);
    alert('Failed to start screen capture. Please grant permissions.');
    return false;
  }
}

/**
 * Process media stream and send to AI
 */
function processMediaStream(stream) {
  const videoTrack = stream.getVideoTracks()[0];
  const audioTrack = stream.getAudioTracks()[0];
  
  if (!videoTrack || !audioTrack) {
    console.error('Missing video or audio track');
    return;
  }

  // Create video element for frame extraction
  const video = document.createElement('video');
  video.srcObject = new MediaStream([videoTrack]);
  video.play();

  // Create audio context for audio processing
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
  
  // Process frames every 2 seconds
  const frameInterval = setInterval(() => {
    if (!isOverlayActive) {
      clearInterval(frameInterval);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Get frame as base64
    const frameData = canvas.toDataURL('image/jpeg', 0.7);
    
    // Send to AI for analysis
    sendToAI(frameData);
  }, 2000);
}

/**
 * Send data to AI and get response
 */
async function sendToAI(frameData) {
  if (!aiClient) return;

  try {
    // Simulate AI response (actual implementation would call Gemini API)
    const mockResponse = generateMockResponse();
    
    // Send response to overlay window
    window.electronAPI.sendAIResponse({
      text: mockResponse,
      timestamp: new Date().toISOString(),
      profile: aiClient.profile
    });

    // Add to history
    addToHistory(mockResponse);
  } catch (error) {
    console.error('AI request error:', error);
  }
}

/**
 * Generate mock AI response for testing
 */
function generateMockResponse() {
  const profile = profileSelect.value;
  const responses = {
    interview: [
      "Great question! I'd approach this by first understanding the requirements...",
      "Based on my experience, the key considerations here are performance and scalability...",
      "Let me walk you through my thought process on this problem..."
    ],
    sales: [
      "That's an excellent point. Our solution addresses this by...",
      "I appreciate your concern about pricing. Let me show you the ROI...",
      "Many of our clients had similar questions. Here's how we helped them..."
    ],
    meeting: [
      "Building on what was just mentioned, we should also consider...",
      "To summarize the key action items from this discussion...",
      "Great point! We could enhance this approach by..."
    ]
  };

  const profileResponses = responses[profile] || responses.interview;
  return profileResponses[Math.floor(Math.random() * profileResponses.length)];
}

/**
 * Add response to history
 */
function addToHistory(text) {
  const historyList = document.getElementById('historyList');
  const emptyState = historyList.querySelector('.empty-state');
  
  if (emptyState) {
    emptyState.remove();
  }

  const historyItem = document.createElement('div');
  historyItem.className = 'history-item';
  
  const time = new Date().toLocaleTimeString();
  historyItem.innerHTML = `
    <div class="history-time">${time}</div>
    <div class="history-text">${text}</div>
  `;

  historyList.insertBefore(historyItem, historyList.firstChild);

  // Keep only last 10 items
  while (historyList.children.length > 10) {
    historyList.removeChild(historyList.lastChild);
  }
}

/**
 * Start overlay
 */
async function startOverlay() {
  const aiReady = await initializeAI();
  if (!aiReady) return;

  const captureStarted = await startScreenCapture();
  if (!captureStarted) return;

  const result = await window.electronAPI.startOverlay();
  
  if (result.success) {
    isOverlayActive = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    overlayStatus.textContent = 'Active';
    overlayStatus.classList.remove('inactive');
    overlayStatus.classList.add('active');
    
    // Save current context and profile
    localStorage.setItem('customContext', contextInput.value);
    localStorage.setItem('aiProfile', profileSelect.value);
  }
}

/**
 * Stop overlay
 */
async function stopOverlay() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  await window.electronAPI.stopOverlay();
  
  isOverlayActive = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  overlayStatus.textContent = 'Inactive';
  overlayStatus.classList.remove('active');
  overlayStatus.classList.add('inactive');
  captureStatus.textContent = 'Not Capturing';
  captureStatus.classList.remove('active');
  captureStatus.classList.add('inactive');
}

/**
 * Load settings
 */
async function loadSettings() {
  currentSettings = await window.electronAPI.getSettings();
  
  transparencySlider.value = currentSettings.transparency * 100;
  transparencyValue.textContent = `${Math.round(currentSettings.transparency * 100)}%`;
  
  fontSizeSlider.value = currentSettings.fontSize;
  fontSizeValue.textContent = `${currentSettings.fontSize}px`;
  
  stealthSelect.value = currentSettings.stealthLevel;
  layoutSelect.value = currentSettings.layout;
  
  stealthStatus.textContent = currentSettings.stealthLevel.charAt(0).toUpperCase() + currentSettings.stealthLevel.slice(1);
}

/**
 * Save settings
 */
async function saveSettingsHandler() {
  const newSettings = {
    transparency: transparencySlider.value / 100,
    fontSize: parseInt(fontSizeSlider.value),
    stealthLevel: stealthSelect.value,
    layout: layoutSelect.value,
    profile: profileSelect.value
  };

  const result = await window.electronAPI.updateSettings(newSettings);
  
  if (result.success) {
    currentSettings = result.settings;
    stealthStatus.textContent = currentSettings.stealthLevel.charAt(0).toUpperCase() + currentSettings.stealthLevel.slice(1);
    settingsPanel.classList.remove('active');
    setTimeout(() => settingsPanel.classList.add('hidden'), 300);
  }
}

// Event Listeners
startBtn.addEventListener('click', startOverlay);
stopBtn.addEventListener('click', stopOverlay);

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.remove('hidden');
  setTimeout(() => settingsPanel.classList.add('active'), 10);
  loadSettings();
});

closeSettings.addEventListener('click', () => {
  settingsPanel.classList.remove('active');
  setTimeout(() => settingsPanel.classList.add('hidden'), 300);
});

saveSettings.addEventListener('click', saveSettingsHandler);

transparencySlider.addEventListener('input', (e) => {
  transparencyValue.textContent = `${e.target.value}%`;
});

fontSizeSlider.addEventListener('input', (e) => {
  fontSizeValue.textContent = `${e.target.value}px`;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + S to open settings
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    settingsBtn.click();
  }
  
  // Escape to close settings
  if (e.key === 'Escape' && settingsPanel.classList.contains('active')) {
    closeSettings.click();
  }
});

// Initialize
loadSettings();

console.log('Renderer process initialized');