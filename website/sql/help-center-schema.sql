-- Help Center Database Schema for OnTimely
-- Run this in your Supabase SQL Editor to set up the help center functionality

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

-- Help center analytics table
CREATE TABLE IF NOT EXISTS help_center_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_visited VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- FAQ interactions tracking
CREATE TABLE IF NOT EXISTS faq_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    faq_section VARCHAR(100) NOT NULL,
    question_clicked TEXT,
    helpful BOOLEAN,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_help_chat_user_id ON help_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_help_chat_created_at ON help_chat_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_screen_share_code ON screen_share_sessions(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_screen_share_status ON screen_share_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_chat_user_id ON live_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_status ON live_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_help_analytics_page ON help_center_analytics(page_visited);
CREATE INDEX IF NOT EXISTS idx_help_analytics_timestamp ON help_center_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_faq_interactions_section ON faq_interactions(faq_section);

-- Enable RLS
ALTER TABLE help_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_share_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_center_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for help chat conversations
CREATE POLICY "Users can view their own chat conversations" ON help_chat_conversations 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat conversations" ON help_chat_conversations 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all help conversations" ON help_chat_conversations 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'staff')
        )
    );

-- Create policies for screen share sessions
CREATE POLICY "Users can view their own screen share sessions" ON screen_share_sessions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create screen share sessions" ON screen_share_sessions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all screen share sessions" ON screen_share_sessions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'staff')
        )
    );

-- Create policies for live chat sessions
CREATE POLICY "Users can view their own live chat sessions" ON live_chat_sessions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create live chat sessions" ON live_chat_sessions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all live chat sessions" ON live_chat_sessions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'staff')
        )
    );

-- Create policies for help center analytics
CREATE POLICY "Anyone can insert analytics data" ON help_center_analytics 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view analytics data" ON help_center_analytics 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'staff')
        )
    );

-- Create policies for FAQ interactions
CREATE POLICY "Users can insert FAQ interactions" ON faq_interactions 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view FAQ interactions" ON faq_interactions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'staff')
        )
    );

-- Create function to clean up expired screen share sessions
CREATE OR REPLACE FUNCTION cleanup_expired_screen_sessions()
RETURNS void AS $$
BEGIN
    UPDATE screen_share_sessions 
    SET status = 'expired' 
    WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create function to get help center statistics
CREATE OR REPLACE FUNCTION get_help_center_stats()
RETURNS TABLE (
    total_chat_sessions BIGINT,
    total_screen_shares BIGINT,
    total_live_chats BIGINT,
    avg_response_time INTERVAL,
    most_visited_page TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM help_chat_conversations) as total_chat_sessions,
        (SELECT COUNT(*) FROM screen_share_sessions) as total_screen_shares,
        (SELECT COUNT(*) FROM live_chat_sessions) as total_live_chats,
        (SELECT AVG(ended_at - started_at) FROM live_chat_sessions WHERE ended_at IS NOT NULL) as avg_response_time,
        (SELECT page_visited FROM help_center_analytics GROUP BY page_visited ORDER BY COUNT(*) DESC LIMIT 1) as most_visited_page;
END;
$$ LANGUAGE plpgsql;

-- Create function to track page visits
CREATE OR REPLACE FUNCTION track_page_visit(page_name TEXT, session_id TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    INSERT INTO help_center_analytics (page_visited, session_id, user_agent, ip_address)
    VALUES (page_name, session_id, current_setting('request.headers')::json->>'user-agent', inet_client_addr());
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO help_chat_conversations (user_message, ai_response) VALUES
('How do I create an event?', 'To create your first event, go to the Events section in your dashboard and click "Create New Event".'),
('I cant login', 'If you''re having trouble logging in, try resetting your password using the "Forgot Password" link.'),
('What is the mobile app for?', 'The mobile app is designed for guests to access event information, chat with other attendees, and use travel tools.');

-- Create a view for staff dashboard
CREATE OR REPLACE VIEW help_center_dashboard AS
SELECT 
    'Chat Sessions' as metric_type,
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM help_chat_conversations
GROUP BY DATE_TRUNC('day', created_at)

UNION ALL

SELECT 
    'Screen Shares' as metric_type,
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM screen_share_sessions
GROUP BY DATE_TRUNC('day', created_at)

UNION ALL

SELECT 
    'Live Chats' as metric_type,
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM live_chat_sessions
GROUP BY DATE_TRUNC('day', created_at);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;








