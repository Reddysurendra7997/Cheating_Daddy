/**
 * Google Gemini API Integration
 * 
 * This module handles communication with the Gemini 2.0 Flash Live API
 * for real-time multimodal AI assistance.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiClient {
  constructor(apiKey, profile = 'interview', customContext = '') {
    this.apiKey = apiKey;
    this.profile = profile;
    this.customContext = customContext;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = null;
    this.chat = null;
    this.conversationHistory = [];
  }

  /**
   * Initialize the Gemini model
   */
  async initialize() {
    try {
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      // Start chat with system instructions
      const systemPrompt = this.getSystemPrompt();
      this.chat = this.model.startChat({
        history: [{
          role: 'user',
          parts: [{ text: systemPrompt }]
        }, {
          role: 'model',
          parts: [{ text: 'Understood. I\'m ready to assist you in real-time based on the context you provide.' }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      });

      console.log('Gemini client initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
      return false;
    }
  }

  /**
   * Get system prompt based on selected profile
   */
  getSystemPrompt() {
    const profiles = {
      interview: `You are an expert interview assistant. Provide concise, professional answers to technical and behavioral questions. Focus on:
- Clear, structured responses
- Relevant examples from experience
- Technical accuracy
- Professional communication
${this.customContext ? '\n\nAdditional context: ' + this.customContext : ''}`,
      
      sales: `You are a sales call coach. Help craft persuasive, customer-focused responses. Focus on:
- Value proposition clarity
- Addressing objections
- Building rapport
- Closing techniques
${this.customContext ? '\n\nAdditional context: ' + this.customContext : ''}`,
      
      meeting: `You are a meeting copilot. Provide relevant insights and action items. Focus on:
- Key discussion points
- Action item suggestions
- Follow-up questions
- Meeting efficiency
${this.customContext ? '\n\nAdditional context: ' + this.customContext : ''}`,
      
      presentation: `You are a presentation assistant. Help with slide content and delivery. Focus on:
- Clear messaging
- Audience engagement
- Data visualization suggestions
- Q&A preparation
${this.customContext ? '\n\nAdditional context: ' + this.customContext : ''}`,
      
      negotiation: `You are a negotiation advisor. Provide strategic guidance. Focus on:
- Win-win outcomes
- Anchoring strategies
- Objection handling
- Value creation
${this.customContext ? '\n\nAdditional context: ' + this.customContext : ''}`,
      
      exam: `You are an exam assistant. Provide accurate, concise answers. Focus on:
- Factual accuracy
- Clear explanations
- Step-by-step solutions
- Key concepts
${this.customContext ? '\n\nAdditional context: ' + this.customContext : ''}`
    };

    return profiles[this.profile] || profiles.interview;
  }

  /**
   * Process multimodal input (text, image, audio transcript)
   */
  async processInput({ text = '', image = null, audioTranscript = '' }) {
    if (!this.chat) {
      throw new Error('Gemini client not initialized');
    }

    try {
      // Combine inputs
      const parts = [];
      
      if (text) {
        parts.push({ text: `Screen text: ${text}` });
      }
      
      if (audioTranscript) {
        parts.push({ text: `Audio: ${audioTranscript}` });
      }
      
      if (image) {
        // Convert base64 image to inline data
        const imageData = image.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg'
          }
        });
      }

      if (parts.length === 0) {
        return null;
      }

      // Send to Gemini
      const result = await this.chat.sendMessage(parts);
      const response = await result.response;
      const responseText = response.text();

      // Store in history
      this.conversationHistory.push({
        timestamp: new Date().toISOString(),
        input: { text, audioTranscript, hasImage: !!image },
        output: responseText
      });

      return {
        text: responseText,
        timestamp: new Date().toISOString(),
        profile: this.profile
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Process screen capture frame
   */
  async processScreenFrame(frameData) {
    try {
      const result = await this.processInput({
        image: frameData,
        text: 'Analyze this screen and provide relevant assistance.'
      });
      return result;
    } catch (error) {
      console.error('Frame processing error:', error);
      return null;
    }
  }

  /**
   * Process audio transcript
   */
  async processAudioTranscript(transcript) {
    try {
      const result = await this.processInput({
        audioTranscript: transcript,
        text: 'Provide a helpful response to what was just said.'
      });
      return result;
    } catch (error) {
      console.error('Audio processing error:', error);
      return null;
    }
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Update profile
   */
  async updateProfile(newProfile, newContext = '') {
    this.profile = newProfile;
    this.customContext = newContext;
    
    // Reinitialize with new profile
    await this.initialize();
  }
}

module.exports = GeminiClient;