# 🎯 Cheating Daddy - Enhanced Version

A completely rebuilt and improved real-time AI assistant using Google Gemini 2.0 Flash Live API for interviews, meetings, presentations, and more.

## 🌟 Features

### Core Functionality
- ✅ **Real-time AI Assistance** - Powered by Google Gemini 2.0 Flash Live
- ✅ **Screen & Audio Capture** - Multi-platform support (Windows, macOS, Linux)
- ✅ **Stealth Mode** - Invisible overlay with click-through capability
- ✅ **Multiple AI Profiles** - Interview, Sales, Meeting, Presentation, Negotiation, Exam
- ✅ **Custom Context** - Add resume, job description, or any relevant information
- ✅ **Conversation History** - Persistent storage of all interactions
- ✅ **Keyboard Shortcuts** - Quick window controls and navigation

### Enhanced Features (New in v1.0)
- ✨ Improved error handling and stability
- ✨ Better UI/UX with modern design
- ✨ Optimized performance and reduced API calls
- ✨ Enhanced security with context isolation
- ✨ Modular architecture for easy maintenance
- ✨ Comprehensive documentation

## 📋 Prerequisites

- Node.js 18+ and npm
- Electron-compatible OS (Windows 10+, macOS 10.13+, or Linux)
- Google Gemini API key ([Get one free here](https://makersuite.google.com/app/apikey))
- Screen recording and microphone permissions

## 🚀 Installation

### 1. Clone or Download the Repository

```bash
git clone https://github.com/yourusername/cheating-daddy-enhanced.git
cd cheating-daddy-enhanced
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and add your Gemini API key:

```bash
cp .env.example .env
```

Edit `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Grant Permissions

**macOS:**
- System Settings → Privacy & Security → Screen Recording → Enable
- System Settings → Privacy & Security → Microphone → Enable

**Windows:**
- Settings → Privacy → Microphone → Allow
- Settings → Privacy → Screen Recording → Allow (Windows 11)

**Linux:**
- Grant screen and audio capture permissions via your DE's settings

## 🎮 Usage

### Development Mode

```bash
npm start
```

### Build for Production

```bash
# Build for current platform
npm run make

# Outputs will be in the `out` directory
```

### Using the Application

1. **Launch the app** and enter your Gemini API key
2. **Select an AI profile** (Interview, Sales, Meeting, etc.)
3. **Add custom context** (optional) - your resume, job description, etc.
4. **Click "Start Overlay"** to begin
5. **The overlay appears** with real-time AI suggestions
6. **Customize settings** via the settings panel (⚙️ button)

## ⚙️ Configuration

### AI Profiles

- **Interview**: Technical and behavioral interview assistance
- **Sales**: Sales call coaching and objection handling
- **Meeting**: Meeting insights and action items
- **Presentation**: Slide content and delivery suggestions
- **Negotiation**: Strategic negotiation guidance
- **Exam**: Accurate answers and step-by-step solutions

### Stealth Levels

- **Visible**: Normal window (visible and clickable)
- **Balanced**: Transparent overlay (semi-transparent, clickable)
- **Ultra**: Invisible mode (completely transparent, click-through)

### Keyboard Shortcuts

- `Ctrl/Cmd + S`: Open settings
- `Escape`: Close settings panel
- `Ctrl/Cmd + Arrow Keys`: Move overlay window
- `Ctrl/Cmd + Shift + Arrow Keys`: Resize overlay window

## 🔧 Troubleshooting

### Common Issues

**1. "Screen capture failed"**
- Ensure you've granted screen recording permissions
- Restart the app after granting permissions
- On macOS, you may need to restart your computer

**2. "API key invalid"**
- Verify your Gemini API key is correct
- Check that you're using the correct API endpoint
- Ensure you have an active Google Cloud account

**3. "Overlay not appearing"**
- Check if overlay is hidden behind other windows
- Try changing the stealth level in settings
- Restart the overlay from the main window

**4. "Audio not capturing"**
- Grant microphone permissions
- On macOS, try using the SystemAudioDump binary
- Check your audio input device settings

### Platform-Specific Issues

**macOS:**
- If you see "App is damaged", run: `xattr -cr /path/to/app`
- Code signing: The app is unsigned by default (see Build Configuration)

**Windows:**
- Windows Defender may flag the app - add an exception
- Run as administrator if permission issues occur

**Linux:**
- Install required libraries: `sudo apt-get install libgtk-3-0 libnotify4 libgconf-2-4 libnss3 libxss1 libasound2`

## 🏗️ Project Structure

```
cheating-daddy-enhanced/
├── src/
│   ├── main.js              # Main Electron process
│   ├── preload.js           # Security preload script
│   ├── renderer.js          # Renderer process logic
│   ├── index.html           # Main window UI
│   ├── overlay.html         # Overlay window UI
│   ├── styles.css           # Application styles
│   └── utils/
│       └── gemini.js        # Gemini API integration
├── package.json
├── forge.config.js
├── .env.example
├── entitlements.plist       # macOS permissions
└── README.md
```

## 🔒 Privacy & Security

- **No Data Collection**: All data stays on your device
- **API Key Security**: Your Gemini API key is stored locally
- **Open Source**: Full code transparency
- **Context Isolation**: Electron security best practices

## 📝 Development

### Adding New Features

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Update documentation
4. Submit pull request

### Code Style

- Use ESLint configuration
- Follow existing code patterns
- Add JSDoc comments for functions
- Write meaningful commit messages

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This tool is for educational purposes. Using AI assistance during interviews or exams may violate academic integrity policies or terms of service. Use responsibly and ethically.

## 🙏 Acknowledgments

- Original project by [@sohzm](https://github.com/sohzm/cheating-daddy)
- Google Gemini API
- Electron framework
- Open source community

## 📞 Support

- Open an issue on GitHub
- Check existing issues for solutions
- Join our community discussions

---

**Made with ❤️ for the community**

*This is an educational project. Always use responsibly.*