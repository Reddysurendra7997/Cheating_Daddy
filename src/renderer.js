/**
 * Renderer Process - Main Window Logic
 * Fixed: Proper event listener attachment and error handling
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');
  
  // State
  let isOverlayActive = false;
  let mediaStream = null;
  let aiClient = null;
  let currentSettings = {};
  let geminiSDKLoaded = false;

  // Get DOM elements
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
  const testQuestion = document.getElementById('testQuestion');
  const sendTestBtn = document.getElementById('sendTestBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const resumeUpload = document.getElementById('resumeUpload');
  const resumeFileName = document.getElementById('resumeFileName');
  const testConnectionBtn = document.getElementById('testConnectionBtn');
  const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');
  const connectionStatus = document.getElementById('connectionStatus');

  console.log('All elements loaded');

  // Load saved data
  const savedApiKey = localStorage.getItem('geminiApiKey');
  if (savedApiKey && apiKeyInput) {
    apiKeyInput.value = savedApiKey;
  }

  const savedContext = localStorage.getItem('customContext');
  if (savedContext && contextInput) {
    contextInput.value = savedContext;
  }

  const savedProfile = localStorage.getItem('aiProfile');
  if (savedProfile && profileSelect) {
    profileSelect.value = savedProfile;
  }

  // Functions
  async function loadGeminiSDK() {
    if (geminiSDKLoaded) return true;
    
    try {
      const module = await import('https://esm.run/@google/generative-ai');
      window.GoogleGenerativeAI = module.GoogleGenerativeAI;
      geminiSDKLoaded = true;
      console.log('Gemini SDK loaded');
      return true;
    } catch (error) {
      console.error('Failed to load Gemini SDK:', error);
      alert('Failed to load Gemini SDK. Check your internet connection.');
      return false;
    }
  }

  function showConnectionStatus(type, message) {
    if (!connectionStatus) return;
    
    connectionStatus.style.display = 'block';
    connectionStatus.style.padding = '10px';
    connectionStatus.style.borderRadius = '6px';
    connectionStatus.style.fontSize = '14px';
    connectionStatus.style.fontWeight = '600';
    
    if (type === 'success') {
      connectionStatus.style.background = '#d1fae5';
      connectionStatus.style.color = '#065f46';
      connectionStatus.style.border = '1px solid #10b981';
    } else if (type === 'error') {
      connectionStatus.style.background = '#fee2e2';
      connectionStatus.style.color = '#991b1b';
      connectionStatus.style.border = '1px solid #ef4444';
    } else if (type === 'loading') {
      connectionStatus.style.background = '#e0e7ff';
      connectionStatus.style.color = '#3730a3';
      connectionStatus.style.border = '1px solid #6366f1';
    }
    
    connectionStatus.textContent = message;
  }

  async function testConnection() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showConnectionStatus('error', 'Please enter an API key first');
      return false;
    }
    
    testConnectionBtn.disabled = true;
    testConnectionBtn.textContent = 'Testing...';
    showConnectionStatus('loading', 'Connecting to Gemini API...');
    
    try {
      const sdkLoaded = await loadGeminiSDK();
      if (!sdkLoaded) throw new Error('Failed to load SDK');
      
      const genAI = new window.GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const result = await model.generateContent('Say Hello in one word');
      const response = await result.response;
      const text = response.text();
      
      localStorage.setItem('geminiApiKey', apiKey);
      showConnectionStatus('success', 'Connected! API Key Valid. Response: ' + text);
      testConnectionBtn.textContent = 'Connected';
      
      setTimeout(() => {
        testConnectionBtn.textContent = 'Test Connection';
        testConnectionBtn.disabled = false;
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      
      let errorMsg = 'Connection failed: ';
      if (error.message.includes('API_KEY') || error.message.includes('API key')) {
        errorMsg += 'Invalid API key';
      } else if (error.message.includes('quota')) {
        errorMsg += 'API quota exceeded';
      } else {
        errorMsg += error.message || 'Unknown error';
      }
      
      showConnectionStatus('error', errorMsg);
      testConnectionBtn.textContent = 'Test Connection';
      testConnectionBtn.disabled = false;
      return false;
    }
  }

  function toggleApiKeyVisibility() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.textContent = '🙈';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '👁️';
    }
  }

  async function initializeAI() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      alert('Please enter your Gemini API key and test connection first');
      return false;
    }

    try {
      const sdkLoaded = await loadGeminiSDK();
      if (!sdkLoaded) return false;
      
      const genAI = new window.GoogleGenerativeAI(apiKey);
      
      aiClient = {
        genAI,
        model: genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }),
        apiKey,
        profile: profileSelect.value,
        context: contextInput.value
      };
      
      console.log('Gemini API initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
      alert('Failed to initialize Gemini API. Please test your connection first.');
      return false;
    }
  }

  async function sendToAI(question) {
    if (!aiClient) {
      console.error('AI client not initialized');
      return;
    }

    if (!question || question.trim() === '') {
      console.error('No question provided');
      return;
    }

    showLoadingIndicator(true);

    try {
      const result = await aiClient.model.generateContent(question);
      const response = await result.response;
      const text = response.text();
      
      window.electronAPI.sendAIResponse({
        text: text,
        timestamp: new Date().toISOString(),
        profile: aiClient.profile,
        question: question
      });

      addToHistory(question, text);
      showLoadingIndicator(false);
    } catch (error) {
      console.error('AI request error:', error);
      alert('Failed to get AI response. Check your internet connection.');
      showLoadingIndicator(false);
    }
  }

  function showLoadingIndicator(show) {
    let indicator = document.getElementById('aiLoadingIndicator');
    
    if (show) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'aiLoadingIndicator';
        indicator.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:white;padding:12px 20px;border-radius:8px;font-weight:600;box-shadow:0 4px 12px rgba(99,102,241,0.4);z-index:9999;';
        indicator.textContent = 'AI is thinking...';
        document.body.appendChild(indicator);
      }
      indicator.style.display = 'block';
    } else {
      if (indicator) {
        indicator.style.display = 'none';
      }
    }
  }

  function addToHistory(question, answer) {
    const historyList = document.getElementById('historyList');
    const emptyState = historyList.querySelector('.empty-state');
    
    if (emptyState) {
      emptyState.remove();
    }

    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.textContent = question;
    const escapedQ = div.innerHTML;
    div.textContent = answer;
    const escapedA = div.innerHTML;
    
    historyItem.innerHTML = '<div class="history-time">' + time + '</div><div class="history-text"><strong>Q:</strong> ' + escapedQ + '</div><div class="history-text" style="margin-top:8px;color:#94a3b8;"><strong>A:</strong> ' + escapedA + '</div>';

    historyList.insertBefore(historyItem, historyList.firstChild);

    while (historyList.children.length > 10) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  async function startOverlay() {
    console.log('Starting overlay...');
    const aiReady = await initializeAI();
    if (!aiReady) return;

    const result = await window.electronAPI.startOverlay();
    
    if (result.success) {
      isOverlayActive = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      overlayStatus.textContent = 'Active';
      overlayStatus.classList.remove('inactive');
      overlayStatus.classList.add('active');
      
      localStorage.setItem('customContext', contextInput.value);
      localStorage.setItem('aiProfile', profileSelect.value);
    }
  }

  async function stopOverlay() {
    console.log('Stopping overlay...');
    await window.electronAPI.stopOverlay();
    
    isOverlayActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    overlayStatus.textContent = 'Inactive';
    overlayStatus.classList.remove('active');
    overlayStatus.classList.add('inactive');
  }

  async function loadSettings() {
    currentSettings = await window.electronAPI.getSettings();
    
    transparencySlider.value = currentSettings.transparency * 100;
    transparencyValue.textContent = Math.round(currentSettings.transparency * 100) + '%';
    
    fontSizeSlider.value = currentSettings.fontSize;
    fontSizeValue.textContent = currentSettings.fontSize + 'px';
    
    stealthSelect.value = currentSettings.stealthLevel;
    layoutSelect.value = currentSettings.layout;
    
    stealthStatus.textContent = currentSettings.stealthLevel.charAt(0).toUpperCase() + currentSettings.stealthLevel.slice(1);
  }

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
      setTimeout(function() {
        settingsPanel.classList.add('hidden');
      }, 300);
    }
  }

  // Event Listeners
  console.log('Attaching event listeners...');

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      console.log('Start button clicked');
      startOverlay();
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', function() {
      console.log('Stop button clicked');
      stopOverlay();
    });
  }

  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', function() {
      console.log('Test connection clicked');
      testConnection();
    });
  }

  if (toggleApiKeyBtn) {
    toggleApiKeyBtn.addEventListener('click', function() {
      console.log('Toggle API key clicked');
      toggleApiKeyVisibility();
    });
  }

  if (sendTestBtn) {
    sendTestBtn.addEventListener('click', async function() {
      console.log('Send test clicked');
      const question = testQuestion.value.trim();
      
      if (!question) {
        alert('Please enter a test question');
        return;
      }
      
      if (!aiClient) {
        const initialized = await initializeAI();
        if (!initialized) return;
      }
      
      await sendToAI(question);
      testQuestion.value = '';
      
      sendTestBtn.textContent = 'Sent!';
      sendTestBtn.disabled = true;
      setTimeout(function() {
        sendTestBtn.textContent = 'Send Test Question';
        sendTestBtn.disabled = false;
      }, 2000);
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', function() {
      console.log('Clear history clicked');
      const historyList = document.getElementById('historyList');
      historyList.innerHTML = '<p class="empty-state">No conversations yet. Start the overlay to begin!</p>';
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      console.log('Settings clicked');
      settingsPanel.classList.remove('hidden');
      setTimeout(function() {
        settingsPanel.classList.add('active');
      }, 10);
      loadSettings();
    });
  }

  if (closeSettings) {
    closeSettings.addEventListener('click', function() {
      console.log('Close settings clicked');
      settingsPanel.classList.remove('active');
      setTimeout(function() {
        settingsPanel.classList.add('hidden');
      }, 300);
    });
  }

  if (saveSettings) {
    saveSettings.addEventListener('click', function() {
      console.log('Save settings clicked');
      saveSettingsHandler();
    });
  }

  if (transparencySlider) {
    transparencySlider.addEventListener('input', function(e) {
      transparencyValue.textContent = e.target.value + '%';
    });
  }

  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', function(e) {
      fontSizeValue.textContent = e.target.value + 'px';
    });
  }

  if (resumeUpload) {
    resumeUpload.addEventListener('change', async function(e) {
      console.log('Resume upload changed');
      const file = e.target.files[0];
      if (!file) return;

      resumeFileName.textContent = file.name;
      
      try {
        const reader = new FileReader();
        reader.onload = function(event) {
          const text = event.target.result;
          const currentContext = contextInput.value;
          const separator = currentContext ? '\n\n---RESUME---\n\n' : '';
          contextInput.value = currentContext + separator + text;
          localStorage.setItem('customContext', contextInput.value);
          resumeFileName.textContent = 'Uploaded: ' + file.name;
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Failed to read file. Please try a TXT file.');
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (settingsBtn) settingsBtn.click();
    }
    
    if (e.key === 'Escape' && settingsPanel && settingsPanel.classList.contains('active')) {
      if (closeSettings) closeSettings.click();
    }
  });

  loadSettings();

  console.log('Application initialized successfully');
  console.log('All event listeners attached');
});