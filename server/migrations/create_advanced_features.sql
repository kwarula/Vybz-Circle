-- Advanced Features Database Schema
-- Includes: Social Graph, A/B Testing, Location Data

-- ==================== SOCIAL GRAPH ====================

-- Friendships Table
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Indexes for fast friend lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Friend Requests Notifications
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- User Activity Feed (for friends)
CREATE TABLE IF NOT EXISTS user_activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('ticket_purchase', 'event_save', 'event_checkin', 'review_post')),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    content TEXT,
    visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'private')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON user_activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON user_activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_visibility ON user_activity_feed(visibility);

-- ==================== A/B TESTING ====================

-- Experiment Exposures
CREATE TABLE IF NOT EXISTS ab_test_exposures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    experiment_name TEXT NOT NULL,
    variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, experiment_name)
);

CREATE INDEX IF NOT EXISTS idx_ab_exposures_experiment ON ab_test_exposures(experiment_name);
CREATE INDEX IF NOT EXISTS idx_ab_exposures_variant ON ab_test_exposures(variant);

-- Experiment Conversions
CREATE TABLE IF NOT EXISTS ab_test_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    experiment_name TEXT NOT NULL,
    variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
    conversion_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_conversions_experiment ON ab_test_conversions(experiment_name);
CREATE INDEX IF NOT EXISTS idx_ab_conversions_variant ON ab_test_conversions(variant);
CREATE INDEX IF NOT EXISTS idx_ab_conversions_type ON ab_test_conversions(conversion_type);

-- ==================== LOCATION DATA ====================

-- Add location columns to events table (if not exists)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Kenya';

-- Geospatial index for proximity queries
CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- User Location Preferences
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city TEXT,
    country TEXT DEFAULT 'Kenya',
    max_distance_km INTEGER DEFAULT 25,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);

-- Saved Locations (home, work, etc.)
CREATE TABLE IF NOT EXISTS user_saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON user_saved_locations(user_id);

-- ==================== NOTIFICATION QUEUE ====================

-- Smart Notifications Queue
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);

-- ==================== FUNCTIONS ====================

-- Function to get friends' activity feed
CREATE OR REPLACE FUNCTION get_friends_activity_feed(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    activity_id UUID,
    user_id UUID,
    user_name TEXT,
    user_avatar TEXT,
    activity_type TEXT,
    event_id UUID,
    event_title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        uaf.id as activity_id,
        uaf.user_id,
        COALESCE(u.display_name, u.email) as user_name,
        u.avatar_url as user_avatar,
        uaf.activity_type,
        uaf.event_id,
        e.title as event_title,
        uaf.content,
        uaf.created_at
    FROM user_activity_feed uaf
    JOIN auth.users u ON u.id = uaf.user_id
    LEFT JOIN events e ON e.id = uaf.event_id
    WHERE uaf.user_id IN (
        SELECT friend_id
        FROM friendships
        WHERE user_id = p_user_id
        AND status = 'accepted'
    )
    AND (uaf.visibility = 'public' OR uaf.visibility = 'friends')
    ORDER BY uaf.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get nearby events using PostGIS-style calculation
CREATE OR REPLACE FUNCTION get_nearby_events(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_radius_km INTEGER DEFAULT 25,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    event_id UUID,
    title TEXT,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as event_id,
        e.title,
        CAST(
            6371 * acos(
                cos(radians(p_latitude)) *
                cos(radians(e.latitude)) *
                cos(radians(e.longitude) - radians(p_longitude)) +
                sin(radians(p_latitude)) *
                sin(radians(e.latitude))
            ) AS DECIMAL(10, 2)
        ) as distance_km
    FROM events e
    WHERE e.latitude IS NOT NULL
    AND e.longitude IS NOT NULL
    AND e.starts_at >= NOW()
    AND (
        6371 * acos(
            cos(radians(p_latitude)) *
            cos(radians(e.latitude)) *
            cos(radians(e.longitude) - radians(p_longitude)) +
            sin(radians(p_latitude)) *
            sin(radians(e.latitude))
        )
    ) <= p_radius_km
    ORDER BY distance_km ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule smart notification
CREATE OR REPLACE FUNCTION schedule_smart_notification(
    p_user_id UUID,
    p_event_id UUID,
    p_notification_type TEXT,
    p_title TEXT,
    p_body TEXT
)
RETURNS UUID AS $$
DECLARE
    v_optimal_time TIMESTAMPTZ;
    v_notification_id UUID;
BEGIN
    -- Calculate optimal notification time based on user activity
    SELECT
        CAST(
            date_trunc('day', NOW()) +
            (EXTRACT(HOUR FROM timestamp AT TIME ZONE 'UTC')::INTEGER || ' hours')::INTERVAL
        AS TIMESTAMPTZ)
    INTO v_optimal_time
    FROM (
        SELECT
            timestamp,
            COUNT(*) as action_count
        FROM user_behaviors
        WHERE user_id = p_user_id
        GROUP BY EXTRACT(HOUR FROM timestamp AT TIME ZONE 'UTC'), timestamp
        ORDER BY action_count DESC
        LIMIT 1
    ) most_active_hour;

    -- Default to 6 PM if no data
    IF v_optimal_time IS NULL THEN
        v_optimal_time := date_trunc('day', NOW()) + INTERVAL '18 hours';
    END IF;

    -- Insert notification
    INSERT INTO notification_queue (
        user_id,
        event_id,
        notification_type,
        title,
        body,
        scheduled_for
    ) VALUES (
        p_user_id,
        p_event_id,
        p_notification_type,
        p_title,
        p_body,
        v_optimal_time
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_exposures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships"
    ON friendships FOR UPDATE
    USING (auth.uid() = user_id);

-- Friend requests policies
CREATE POLICY "Users can view friend requests"
    ON friend_requests FOR SELECT
    USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create friend requests"
    ON friend_requests FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

-- Activity feed policies
CREATE POLICY "Users can view public and friends' activity"
    ON user_activity_feed FOR SELECT
    USING (
        visibility = 'public'
        OR (visibility = 'friends' AND user_id IN (
            SELECT friend_id FROM friendships
            WHERE user_id = auth.uid() AND status = 'accepted'
        ))
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can create their own activity"
    ON user_activity_feed FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- A/B testing policies (public read for analytics)
CREATE POLICY "Anyone can track experiments"
    ON ab_test_exposures FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can track conversions"
    ON ab_test_conversions FOR INSERT
    WITH CHECK (true);

-- Location policies
CREATE POLICY "Users can view and update their location"
    ON user_locations FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage saved locations"
    ON user_saved_locations FOR ALL
    USING (auth.uid() = user_id);

-- Notification policies
CREATE POLICY "Users can view their notifications"
    ON notification_queue FOR SELECT
    USING (auth.uid() = user_id);

-- ==================== COMMENTS ====================

COMMENT ON TABLE friendships IS 'User friendship connections';
COMMENT ON TABLE friend_requests IS 'Pending friend requests';
COMMENT ON TABLE user_activity_feed IS 'Social activity feed for friends';
COMMENT ON TABLE ab_test_exposures IS 'A/B test experiment exposures';
COMMENT ON TABLE ab_test_conversions IS 'A/B test conversions and goals';
COMMENT ON TABLE user_locations IS 'User location preferences';
COMMENT ON TABLE user_saved_locations IS 'User saved locations (home, work, etc.)';
COMMENT ON TABLE notification_queue IS 'Smart notification scheduling queue';

COMMENT ON FUNCTION get_friends_activity_feed IS 'Get activity feed from user friends';
COMMENT ON FUNCTION get_nearby_events IS 'Find events within radius using Haversine formula';
COMMENT ON FUNCTION schedule_smart_notification IS 'Schedule notification at optimal time for user';
