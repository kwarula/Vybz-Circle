-- Create tables to support recommendation algorithms

-- User Behaviors Table
-- Tracks all user interactions with events
CREATE TABLE IF NOT EXISTS user_behaviors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('view', 'click', 'save', 'purchase', 'share')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_event_id ON user_behaviors(event_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_timestamp ON user_behaviors(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_action_type ON user_behaviors(action_type);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_session_id ON user_behaviors(session_id);

-- User Preferences Table
-- Stores learned preferences for each user
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    favorite_categories JSONB DEFAULT '[]'::jsonb,
    price_range_min INTEGER DEFAULT 0,
    price_range_max INTEGER DEFAULT 10000,
    preferred_days JSONB DEFAULT '[]'::jsonb,
    preferred_venues JSONB DEFAULT '[]'::jsonb,
    location_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Event Recommendations Cache Table
-- Caches pre-computed recommendations for performance
CREATE TABLE IF NOT EXISTS event_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    score DECIMAL(10, 2) NOT NULL,
    reasons JSONB DEFAULT '[]'::jsonb,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
    UNIQUE(user_id, event_id)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_event_recommendations_user_id ON event_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_recommendations_score ON event_recommendations(score DESC);
CREATE INDEX IF NOT EXISTS idx_event_recommendations_expires_at ON event_recommendations(expires_at);

-- Trending Events Cache Table
-- Caches trending events calculation
CREATE TABLE IF NOT EXISTS trending_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE,
    engagement_score DECIMAL(10, 2) NOT NULL,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_trending_events_score ON trending_events(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_events_computed_at ON trending_events(computed_at DESC);

-- Event Search Analytics Table
-- Tracks search queries for improving search ranking
CREATE TABLE IF NOT EXISTS event_search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    clicked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    clicked_position INTEGER,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id TEXT
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON event_search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON event_search_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON event_search_analytics(user_id);

-- Function to automatically update trending events
CREATE OR REPLACE FUNCTION update_trending_events()
RETURNS void AS $$
BEGIN
    -- Delete old trending data
    DELETE FROM trending_events WHERE computed_at < NOW() - INTERVAL '1 day';

    -- Calculate new trending events from last 7 days
    INSERT INTO trending_events (
        event_id,
        engagement_score,
        view_count,
        click_count,
        save_count,
        purchase_count,
        share_count,
        period_start,
        period_end
    )
    SELECT
        event_id,
        -- Weighted engagement score
        (COALESCE(SUM(CASE WHEN action_type = 'view' THEN 1 ELSE 0 END), 0) * 1 +
         COALESCE(SUM(CASE WHEN action_type = 'click' THEN 1 ELSE 0 END), 0) * 2 +
         COALESCE(SUM(CASE WHEN action_type = 'save' THEN 1 ELSE 0 END), 0) * 3 +
         COALESCE(SUM(CASE WHEN action_type = 'purchase' THEN 1 ELSE 0 END), 0) * 5 +
         COALESCE(SUM(CASE WHEN action_type = 'share' THEN 1 ELSE 0 END), 0) * 4) as engagement_score,
        COALESCE(SUM(CASE WHEN action_type = 'view' THEN 1 ELSE 0 END), 0) as view_count,
        COALESCE(SUM(CASE WHEN action_type = 'click' THEN 1 ELSE 0 END), 0) as click_count,
        COALESCE(SUM(CASE WHEN action_type = 'save' THEN 1 ELSE 0 END), 0) as save_count,
        COALESCE(SUM(CASE WHEN action_type = 'purchase' THEN 1 ELSE 0 END), 0) as purchase_count,
        COALESCE(SUM(CASE WHEN action_type = 'share' THEN 1 ELSE 0 END), 0) as share_count,
        NOW() - INTERVAL '7 days' as period_start,
        NOW() as period_end
    FROM user_behaviors
    WHERE timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY event_id
    ON CONFLICT (event_id) DO UPDATE SET
        engagement_score = EXCLUDED.engagement_score,
        view_count = EXCLUDED.view_count,
        click_count = EXCLUDED.click_count,
        save_count = EXCLUDED.save_count,
        purchase_count = EXCLUDED.purchase_count,
        share_count = EXCLUDED.share_count,
        computed_at = NOW(),
        period_start = EXCLUDED.period_start,
        period_end = EXCLUDED.period_end;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old behavior data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_behaviors()
RETURNS void AS $$
BEGIN
    DELETE FROM user_behaviors
    WHERE timestamp < NOW() - INTERVAL '90 days';

    DELETE FROM event_recommendations
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_behaviors
CREATE POLICY "Users can view their own behaviors"
    ON user_behaviors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert behaviors"
    ON user_behaviors FOR INSERT
    WITH CHECK (true);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recommendations (read-only for users)
CREATE POLICY "Users can view their own recommendations"
    ON event_recommendations FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policies for trending events (public read)
CREATE POLICY "Anyone can view trending events"
    ON trending_events FOR SELECT
    USING (true);

-- RLS Policies for search analytics
CREATE POLICY "Users can view their own search analytics"
    ON event_search_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert search analytics"
    ON event_search_analytics FOR INSERT
    WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE user_behaviors IS 'Tracks all user interactions with events for recommendation algorithms';
COMMENT ON TABLE user_preferences IS 'Stores learned user preferences based on behavior';
COMMENT ON TABLE event_recommendations IS 'Caches pre-computed personalized recommendations';
COMMENT ON TABLE trending_events IS 'Caches trending events calculations for performance';
COMMENT ON TABLE event_search_analytics IS 'Tracks search behavior for improving search ranking';
