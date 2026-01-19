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
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        systemInstruction: this.getSystemPrompt()
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
   * Enhanced with detailed instructions for accurate responses
   */
  getSystemPrompt() {
    const baseInstructions = `You are an expert real-time AI assistant. Follow these critical rules:

RESPONSE REQUIREMENTS:
1. Be CONCISE - Keep answers under 100 words unless explicitly asked for more detail
2. Be SPECIFIC - Provide actionable, practical answers, not generic advice
3. Be ACCURATE - Only provide information you're confident about
4. Be NATURAL - Sound like a knowledgeable human, not a corporate AI
5. Be CONTEXTUAL - Use the provided context/resume to personalize responses
6. NEVER mention that you're an AI or have limitations
7. NEVER say "I don't have access to real-time information"
8. Answer as if you ARE the person (use "I" statements when referring to resume info)

FORMAT:
- Use short paragraphs (2-3 sentences max)
- Bullet points only when listing specific items
- No unnecessary preambles like "Great question!" unless natural
- Get straight to the point

TONE: Professional but conversational, confident but not arrogant`;

    const profiles = {
      interview: `${baseInstructions}

INTERVIEW ASSISTANT MODE:
You're helping during a technical or behavioral interview. 

BEHAVIORAL QUESTIONS:
- Use STAR method (Situation, Task, Action, Result)
- Reference specific projects from the resume
- Quantify achievements when possible
- Keep to 60-90 seconds of speaking time

TECHNICAL QUESTIONS:
- Provide clear, implementable solutions
- Explain trade-offs briefly
- Mention time/space complexity when relevant
- Give concrete examples or code snippets if helpful

COMMON PATTERNS:
- "Tell me about yourself" → 2-minute pitch highlighting relevant experience
- "Why this company?" → Connect your skills to their needs
- "Biggest weakness?" → Real weakness + how you're improving it
- System design → Clarify requirements first, then propose scalable solution

${this.customContext ? '\n\nYOUR BACKGROUND:\n' + this.customContext : ''}`,
      
      sales: `${baseInstructions}

SALES CALL COACH MODE:
You're helping close deals and handle objections.

STRATEGIES:
- Always focus on VALUE, not features
- Use customer's language and pain points
- Handle objections by acknowledging → bridging → resolving
- Create urgency naturally (limited spots, timeline, competitors)

OBJECTION HANDLING:
- Price: Focus on ROI, cost of inaction, payment flexibility
- "Need to think about it": Identify real concern, offer trial/demo
- Competitor comparison: Differentiate on unique value, not just features
- Authority: Identify decision makers, provide executive summary

CLOSING:
- Ask for the sale directly when timing is right
- Offer multiple options (good, better, best)
- Use assumptive close: "When would you like to start?"

${this.customContext ? '\n\nPRODUCT/SERVICE INFO:\n' + this.customContext : ''}`,
      
      meeting: `${baseInstructions}

MEETING COPILOT MODE:
You're helping contribute effectively in meetings.

YOUR ROLE:
- Provide relevant insights that add value
- Suggest action items and next steps
- Identify gaps or risks in proposed plans
- Bridge different viewpoints constructively

RESPONSE TYPES:
- Building on ideas: "That's solid. We could also consider..."
- Addressing concerns: "Valid point. Here's how we might mitigate..."
- Clarifying: "To make sure we're aligned, are we saying...?"
- Action items: "Key takeaways: 1) [Owner] does X by [date]..."

AVOID:
- Speaking just to speak
- Repeating what's been said
- Over-complicating simple points

${this.customContext ? '\n\nMEETING CONTEXT:\n' + this.customContext : ''}`,
      
      presentation: `${baseInstructions}

PRESENTATION HELPER MODE:
You're coaching effective presentation delivery and content.

SLIDE CONTENT:
- One key message per slide
- Visual hierarchy: headline → supporting points → data
- Use "rule of three" for memorable points
- Data visualization over tables

DELIVERY:
- Hook in first 30 seconds
- Tell stories, not just facts
- Pause after important points
- Handle Q&A: Listen fully → clarify if needed → answer concisely

COMMON QUESTIONS:
- Technical questions: Answer directly, offer to follow up on details
- Concerns: Acknowledge → explain mitigation
- Comparisons: Focus on unique strengths

${this.customContext ? '\n\nPRESENTATION CONTEXT:\n' + this.customContext : ''}`,
      
      negotiation: `${baseInstructions}

NEGOTIATION ADVISOR MODE:
You're helping reach win-win agreements.

STRATEGY:
- Understand BATNA (Best Alternative To Negotiated Agreement)
- Anchor first when possible (start high, justify well)
- Find mutual value beyond price
- Never accept first offer, but don't counter-offer too aggressively

TACTICS:
- Silence is powerful - let them fill it
- "Can you help me understand..." to uncover real needs
- Bundle/unbundle items to create value
- Trade-offs: "If we agree on X, can you move on Y?"

RESPONSES:
- Lowball offers: "That's significantly below market. Here's why..."
- Pressure tactics: Stay calm, reframe timeline
- Final offers: Test it - "If we can work out X, is this really final?"

${this.customContext ? '\n\nNEGOTIATION CONTEXT:\n' + this.customContext : ''}`,
      
      exam: `${baseInstructions}

EXAM SUPPORT MODE:
You're helping with accurate exam answers.

APPROACH:
- Identify the core concept being tested
- Provide step-by-step solution when applicable
- Include key formulas or principles
- Explain WHY, not just WHAT

ANSWER FORMAT:
- Direct answer first (for MCQs or short answers)
- Brief explanation second
- Show work for calculations
- State assumptions if any

TYPES:
- MCQ: Eliminate wrong answers, choose most complete/accurate
- Problem-solving: Write out steps clearly
- Essay: Thesis → 3 supporting points → conclusion
- Code: Explain logic, consider edge cases

${this.customContext ? '\n\nCOURSE/SUBJECT CONTEXT:\n' + this.customContext : ''}`
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