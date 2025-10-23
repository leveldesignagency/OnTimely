// AI Chat Service for OnTimely Help Center
// This integrates with Supabase and provides AI-powered customer support

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// AI Chat Service
export class AIChatService {
  constructor() {
    this.conversationHistory = []
    this.isTyping = false
  }

  // Send message to AI and get response
  async sendMessage(userMessage, userId = null) {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      })

      // Generate AI response
      const aiResponse = await this.generateAIResponse(userMessage)
      
      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      })

      // Save conversation to database
      if (userId) {
        await this.saveConversation(userId, userMessage, aiResponse)
      }

      return aiResponse
    } catch (error) {
      console.error('Error in AI chat:', error)
      return "I apologize, but I'm experiencing technical difficulties. Please try again or contact our support team directly."
    }
  }

  // Generate AI response based on user message
  async generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase()
    
    // Knowledge base responses
    const responses = {
      // Getting Started
      'create event': "To create your first event, go to the Events section in your dashboard and click 'Create New Event'. Fill in the basic details like event name, date, and location. You can customize the homepage and add modules later.",
      
      'invite guests': "You can invite guests by going to Guest Management and uploading a CSV file or manually adding guests. Send invitations via email with custom messages and track RSVP responses in real-time.",
      
      'team members': "To add team members, go to Team Management and invite them by email. Assign roles (Admin, Manager, Staff) with different permission levels to control access to features.",
      
      // Technical Issues
      'login problem': "If you're having trouble logging in, try resetting your password using the 'Forgot Password' link. Make sure you're using the correct email address and check your spam folder for verification emails.",
      
      'sync issue': "If data isn't syncing properly, try logging out and back in. Make sure you have a stable internet connection. If the problem persists, contact our support team.",
      
      'performance': "To improve performance, try closing other applications, clearing your browser cache, or restarting the desktop app. Make sure you're using the latest version.",
      
      // Features
      'mobile app': "The mobile app is designed for guests to access event information, chat with other attendees, and use travel tools like offline maps and translation. Download it from the App Store or Google Play.",
      
      'offline maps': "Offline maps allow guests to navigate without internet. They can download map areas, add custom pins, and get directions. This is especially useful for international events.",
      
      'translator': "Our translator supports 40+ languages with real-time translation. Guests can translate text, use quick phrases, and access translation history.",
      
      'chat system': "The chat system enables real-time communication between guests and organizers. You can send announcements, create group chats, and monitor conversations.",
      
      // Billing
      'billing': "You can manage your subscription in Account Settings. We accept credit cards, PayPal, and bank transfers. Contact support for billing questions.",
      
      'free trial': "We offer a 14-day free trial with full access to all features. No credit card required to start your trial.",
      
      // General
      'help': "I'm here to help! You can ask me about creating events, managing guests, using features, troubleshooting issues, or anything else about OnTimely.",
      
      'contact support': "For direct support, click the 'Speak to Agent' button to chat with our human support team, or email us at support@ontimely.co.uk"
    }

    // Find best matching response
    for (const [keyword, response] of Object.entries(responses)) {
      if (message.includes(keyword)) {
        return response
      }
    }

    // Default responses based on context
    if (message.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?"
    }
    
    if (message.includes('bye') || message.includes('goodbye')) {
      return "Goodbye! Feel free to come back anytime if you need help with OnTimely."
    }

    // Fallback response
    return "I understand you're looking for help. Could you be more specific about what you need assistance with? I can help with event creation, guest management, technical issues, or any other OnTimely features."
  }

  // Save conversation to database
  async saveConversation(userId, userMessage, aiResponse) {
    try {
      const { error } = await supabase
        .from('help_chat_conversations')
        .insert({
          user_id: userId,
          user_message: userMessage,
          ai_response: aiResponse,
          created_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving conversation:', error)
    }
  }

  // Get conversation history
  async getConversationHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('help_chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching conversation history:', error)
      return []
    }
  }
}

// Live Agent Service
export class LiveAgentService {
  constructor() {
    this.activeAgents = new Set()
    this.waitingQueue = []
  }

  // Request live agent support
  async requestLiveAgent(userId, userMessage, priority = 'medium') {
    try {
      // Create support ticket
      const ticket = await this.createSupportTicket({
        user_id: userId,
        title: 'Live Chat Request',
        description: userMessage,
        category: 'live_chat',
        priority: priority,
        status: 'open'
      })

      // Add to waiting queue
      this.waitingQueue.push({
        ticketId: ticket.id,
        userId: userId,
        message: userMessage,
        timestamp: new Date().toISOString()
      })

      return {
        ticketId: ticket.id,
        estimatedWaitTime: this.calculateWaitTime(),
        positionInQueue: this.waitingQueue.length
      }
    } catch (error) {
      console.error('Error requesting live agent:', error)
      throw error
    }
  }

  // Create support ticket
  async createSupportTicket(ticketData) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticketData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating support ticket:', error)
      throw error
    }
  }

  // Calculate estimated wait time
  calculateWaitTime() {
    const averageResponseTime = 5 // minutes
    const queueLength = this.waitingQueue.length
    const activeAgents = this.activeAgents.size
    
    if (activeAgents === 0) return 15 // Default wait time
    
    return Math.ceil((queueLength / activeAgents) * averageResponseTime)
  }

  // Screen sharing session management
  async createScreenShareSession(userId, confirmationCode) {
    try {
      const { data, error } = await supabase
        .from('screen_share_sessions')
        .insert({
          user_id: userId,
          confirmation_code: confirmationCode,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating screen share session:', error)
      throw error
    }
  }

  // Validate screen share confirmation code
  async validateScreenShareCode(confirmationCode) {
    try {
      const { data, error } = await supabase
        .from('screen_share_sessions')
        .select('*')
        .eq('confirmation_code', confirmationCode)
        .eq('status', 'active')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error validating screen share code:', error)
      return null
    }
  }
}

// Database schema for help center
export const helpCenterSchema = `
-- Help Center Database Schema
-- Run this in your Supabase SQL Editor

-- Help chat conversations table
CREATE TABLE IF NOT EXISTS help_chat_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screen sharing sessions table
CREATE TABLE IF NOT EXISTS screen_share_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    confirmation_code VARCHAR(10) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    agent_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Live chat sessions table
CREATE TABLE IF NOT EXISTS live_chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id),
    ticket_id UUID REFERENCES support_tickets(id),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_help_chat_user_id ON help_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_help_chat_created_at ON help_chat_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_screen_share_code ON screen_share_sessions(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_screen_share_status ON screen_share_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_chat_user_id ON live_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_status ON live_chat_sessions(status);

-- Enable RLS
ALTER TABLE help_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_share_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chat conversations" ON help_chat_conversations 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat conversations" ON help_chat_conversations 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own screen share sessions" ON screen_share_sessions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create screen share sessions" ON screen_share_sessions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own live chat sessions" ON live_chat_sessions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create live chat sessions" ON live_chat_sessions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff can view all sessions
CREATE POLICY "Staff can view all help conversations" ON help_chat_conversations 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Staff can view all screen share sessions" ON screen_share_sessions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Staff can view all live chat sessions" ON live_chat_sessions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'staff')
        )
    );
`;

// Export services
export const aiChatService = new AIChatService()
export const liveAgentService = new LiveAgentService()








