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
const testQuestion = document.getElementById('testQuestion');
const sendTestBtn = document.getElementById('sendTestBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

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
 * FIXED: Only process when there's actual content to analyze
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
  
  // FIXED: Changed to manual trigger only - no automatic polling
  // Remove the automatic interval that was causing spam
  console.log('Media stream ready. Use manual test questions to trigger AI.');
  
  // Store stream for potential future use
  window.activeMediaStream = { video, audioContext, source };
}

/**
 * Send data to AI and get response
 * FIXED: Now requires explicit question/context
 */
async function sendToAI(question, frameData = null) {
  if (!aiClient) {
    console.error('AI client not initialized');
    return;
  }

  if (!question || question.trim() === '') {
    console.error('No question provided to AI');
    return;
  }

  try {
    // Simulate AI response (actual implementation would call Gemini API)
    const mockResponse = generateMockResponse(question);
    
    // Send response to overlay window
    window.electronAPI.sendAIResponse({
      text: mockResponse,
      timestamp: new Date().toISOString(),
      profile: aiClient.profile,
      question: question
    });

    // Add to history
    addToHistory(question, mockResponse);
  } catch (error) {
    console.error('AI request error:', error);
  }
}

/**
 * Generate mock AI response for testing
 * FIXED: Now actually responds to the question content intelligently
 */
function generateMockResponse(question) {
  const q = question.toLowerCase();
  const profile = profileSelect.value;
  
  // Python related
  if (q.includes('python')) {
    return "Python is a high-level, interpreted programming language known for its simplicity and readability. It's widely used in web development (Django, Flask), data science (pandas, NumPy), machine learning (TensorFlow, PyTorch), automation, and scripting. Key features include dynamic typing, automatic memory management, extensive standard library, and a vast ecosystem of third-party packages available via pip.";
  }
  
  // JavaScript/React
  if (q.includes('react') || q.includes('hooks')) {
    return "React hooks are functions that let you use state and lifecycle features in functional components. The most common are useState (for state management), useEffect (for side effects), useContext (for context API), useMemo (for memoization), and useCallback (for callback optimization). They replaced class components and provide a cleaner, more composable approach to building UIs.";
  }
  
  if (q.includes('javascript') || q.includes('js')) {
    return "JavaScript is a versatile programming language primarily used for web development. It runs in browsers and on servers (Node.js). Key concepts include closures, prototypes, async/await, promises, event loop, and ES6+ features like arrow functions, destructuring, and modules. It's essential for creating interactive web applications.";
  }
  
  // Database related
  if (q.includes('database') || q.includes('sql')) {
    return "Databases store and manage data efficiently. SQL databases (PostgreSQL, MySQL) are relational with structured schemas, ACID compliance, and use SQL queries. NoSQL databases (MongoDB, Redis) offer flexible schemas, horizontal scaling, and are great for unstructured data. Choose based on data structure, consistency needs, and scale requirements.";
  }
  
  // Performance/Optimization
  if (q.includes('performance') || q.includes('optimize') || q.includes('faster')) {
    return "Performance optimization strategies include: 1) Code splitting and lazy loading to reduce initial bundle size, 2) Caching (browser, CDN, server), 3) Database indexing and query optimization, 4) Image optimization and lazy loading, 5) Minification and compression, 6) Using CDNs, 7) Implementing pagination, 8) Avoiding unnecessary re-renders, 9) Using web workers for heavy computations.";
  }
  
  // Machine Learning/AI
  if (q.includes('machine learning') || q.includes('ml') || q.includes('ai') || q.includes('neural')) {
    return "Machine Learning enables systems to learn from data without explicit programming. Key approaches include supervised learning (classification, regression), unsupervised learning (clustering, dimensionality reduction), and reinforcement learning. Popular frameworks are TensorFlow, PyTorch, and scikit-learn. Important concepts: training/test split, overfitting, feature engineering, and model evaluation metrics.";
  }
  
  // Data Structures
  if (q.includes('data structure') || q.includes('array') || q.includes('linked list') || q.includes('tree')) {
    return "Data structures organize data efficiently for specific operations. Arrays offer O(1) access but costly insertion. Linked Lists enable O(1) insertion but O(n) access. Trees (BST, AVL) provide O(log n) operations. Hash tables offer O(1) average-case lookup. Graphs represent networks. Choose based on access patterns and operation frequency.";
  }
  
  // Algorithms
  if (q.includes('algorithm') || q.includes('sorting') || q.includes('searching')) {
    return "Common algorithms include: Sorting (QuickSort O(n log n) average, MergeSort O(n log n) guaranteed), Searching (Binary Search O(log n) on sorted data), Graph traversal (BFS, DFS), Dynamic Programming for optimization problems, and Greedy algorithms for locally optimal choices. Time and space complexity analysis is crucial for choosing the right approach.";
  }
  
  // Web Development
  if (q.includes('web') || q.includes('http') || q.includes('rest') || q.includes('api')) {
    return "Web development involves frontend (HTML, CSS, JavaScript/frameworks), backend (servers, databases, APIs), and DevOps (deployment, CI/CD). RESTful APIs use HTTP methods (GET, POST, PUT, DELETE) for CRUD operations. Modern practices include responsive design, progressive web apps, microservices architecture, and serverless computing.";
  }
  
  // Security
  if (q.includes('security') || q.includes('authentication') || q.includes('encryption')) {
    return "Security best practices include: 1) Input validation and sanitization, 2) Authentication (JWT, OAuth), 3) Authorization and role-based access control, 4) HTTPS encryption, 5) SQL injection prevention (parameterized queries), 6) XSS protection, 7) CSRF tokens, 8) Regular security audits, 9) Secure password hashing (bcrypt, Argon2), 10) Rate limiting.";
  }
  
  // Cloud/DevOps
  if (q.includes('cloud') || q.includes('aws') || q.includes('docker') || q.includes('kubernetes')) {
    return "Cloud platforms (AWS, Azure, GCP) provide scalable infrastructure. Docker containerizes applications for consistent deployment. Kubernetes orchestrates containers at scale. Key concepts: IaaS vs PaaS vs SaaS, microservices, auto-scaling, load balancing, CI/CD pipelines, infrastructure as code (Terraform), and monitoring/logging.";
  }
  
  // Testing
  if (q.includes('test') || q.includes('qa')) {
    return "Software testing ensures quality and reliability. Types include: Unit tests (individual functions), Integration tests (component interactions), E2E tests (full user flows), and Performance tests. Practices: TDD (Test-Driven Development), test coverage metrics, mocking/stubbing, continuous testing in CI/CD. Popular tools: Jest, Mocha, Pytest, Selenium, Cypress.";
  }
  
  // Generic programming questions
  if (q.includes('what is') || q.includes('explain') || q.includes('define')) {
    return `Great question! ${question.split(' ').slice(-3).join(' ')} is an important concept in ${profile === 'interview' ? 'software development' : 'the field'}. To provide a comprehensive answer, I'd need to understand the specific context you're asking about. Could you clarify which aspect you're most interested in?`;
  }
  
  // Profile-based fallback for interview-type questions
  if (profile === 'interview') {
    return `Excellent question about "${question}". I'd approach this systematically: First, I'd clarify the requirements and constraints. Then, I'd consider the trade-offs between different solutions - thinking about time complexity, space complexity, maintainability, and scalability. Based on the context, I would recommend [specific approach] because it offers the best balance of performance and code clarity. Would you like me to elaborate on any particular aspect?`;
  }
  
  // Generic fallback
  return `Thank you for asking about "${question}". This is a ${profile === 'exam' ? 'fundamental' : 'interesting'} topic. To give you the most helpful answer, I'd need a bit more context about what specific aspect you'd like to explore - whether it's the theoretical foundation, practical implementation, or real-world applications. Could you provide more details?`;
}

/**
 * Add response to history
 * FIXED: Now shows both question and answer
 */
function addToHistory(question, answer) {
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
    <div class="history-text"><strong>Q:</strong> ${question}</div>
    <div class="history-text" style="margin-top: 8px; color: #94a3b8;"><strong>A:</strong> ${answer}</div>
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

// FIXED: Manual test button
sendTestBtn.addEventListener('click', async () => {
  const question = testQuestion.value.trim();
  
  if (!question) {
    alert('Please enter a test question');
    return;
  }
  
  if (!aiClient) {
    const initialized = await initializeAI();
    if (!initialized) return;
  }
  
  // Send question to AI
  await sendToAI(question);
  
  // Clear input
  testQuestion.value = '';
  
  // Show success feedback
  sendTestBtn.textContent = '✓ Sent!';
  setTimeout(() => {
    sendTestBtn.textContent = 'Send Test Question';
  }, 2000);
});

// Clear history button
clearHistoryBtn.addEventListener('click', () => {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '<p class="empty-state">No conversations yet. Start the overlay to begin!</p>';
});

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