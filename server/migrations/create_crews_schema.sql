-- Circles/Crews Database Schema and Functions
-- Creates tables and functions for crew/circle management

-- ==================== CREWS TABLE ====================

CREATE TABLE IF NOT EXISTS crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    emoji TEXT,
    color TEXT DEFAULT '#8B5CF6',
    is_public BOOLEAN DEFAULT true,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crews_creator_id ON crews(creator_id);
CREATE INDEX IF NOT EXISTS idx_crews_is_public ON crews(is_public);
CREATE INDEX IF NOT EXISTS idx_crews_created_at ON crews(created_at DESC);

-- ==================== CREW MEMBERS TABLE ====================

CREATE TABLE IF NOT EXISTS crew_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID REFERENCES crews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'getting_ready', 'running_late', 'offline')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(crew_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crew_members_crew_id ON crew_members(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_user_id ON crew_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_role ON crew_members(role);

-- ==================== CREW INVITES TABLE ====================

CREATE TABLE IF NOT EXISTS crew_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID REFERENCES crews(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(crew_id, invitee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crew_invites_crew_id ON crew_invites(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_invites_invitee_id ON crew_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_crew_invites_status ON crew_invites(status);

-- ==================== CREW MESSAGES TABLE ====================

CREATE TABLE IF NOT EXISTS crew_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID REFERENCES crews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crew_messages_crew_id ON crew_messages(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_messages_created_at ON crew_messages(created_at DESC);

-- ==================== FUNCTIONS ====================

-- Function to create a crew
CREATE OR REPLACE FUNCTION create_crew(
    name_input TEXT,
    description_input TEXT,
    image_url_input TEXT,
    emoji_input TEXT,
    color_input TEXT,
    is_public_input BOOLEAN
)
RETURNS UUID AS $$
DECLARE
    v_crew_id UUID;
    v_user_id UUID;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Create the crew
    INSERT INTO crews (
        name,
        description,
        image_url,
        emoji,
        color,
        is_public,
        creator_id
    ) VALUES (
        name_input,
        description_input,
        image_url_input,
        emoji_input,
        COALESCE(color_input, '#8B5CF6'),
        COALESCE(is_public_input, true),
        v_user_id
    )
    RETURNING id INTO v_crew_id;

    -- Add creator as owner
    INSERT INTO crew_members (
        crew_id,
        user_id,
        role,
        status
    ) VALUES (
        v_crew_id,
        v_user_id,
        'owner',
        'ready'
    );

    RETURN v_crew_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get crew members with user details
CREATE OR REPLACE FUNCTION get_crew_members(p_crew_id UUID)
RETURNS TABLE (
    member_id UUID,
    user_id UUID,
    user_name TEXT,
    user_avatar TEXT,
    role TEXT,
    status TEXT,
    joined_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.id as member_id,
        cm.user_id,
        COALESCE(u.display_name, u.email) as user_name,
        u.avatar_url as user_avatar,
        cm.role,
        cm.status,
        cm.joined_at
    FROM crew_members cm
    JOIN auth.users u ON u.id = cm.user_id
    WHERE cm.crew_id = p_crew_id
    ORDER BY
        CASE cm.role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'member' THEN 3
        END,
        cm.joined_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to join a public crew
CREATE OR REPLACE FUNCTION join_crew(p_crew_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_is_public BOOLEAN;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if crew is public
    SELECT is_public INTO v_is_public
    FROM crews
    WHERE id = p_crew_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Crew not found';
    END IF;

    IF NOT v_is_public THEN
        RAISE EXCEPTION 'Cannot join private crew without invite';
    END IF;

    -- Add member
    INSERT INTO crew_members (crew_id, user_id, role, status)
    VALUES (p_crew_id, v_user_id, 'member', 'ready')
    ON CONFLICT (crew_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to leave a crew
CREATE OR REPLACE FUNCTION leave_crew(p_crew_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_member_count INTEGER;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get user's role
    SELECT role INTO v_role
    FROM crew_members
    WHERE crew_id = p_crew_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Not a member of this crew';
    END IF;

    -- Count total members
    SELECT COUNT(*) INTO v_member_count
    FROM crew_members
    WHERE crew_id = p_crew_id;

    -- If owner is leaving and there are other members, prevent
    IF v_role = 'owner' AND v_member_count > 1 THEN
        RAISE EXCEPTION 'Owner must transfer ownership before leaving';
    END IF;

    -- If owner is the only member, delete the crew
    IF v_role = 'owner' AND v_member_count = 1 THEN
        DELETE FROM crews WHERE id = p_crew_id;
    ELSE
        -- Remove member
        DELETE FROM crew_members
        WHERE crew_id = p_crew_id AND user_id = v_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update member status
CREATE OR REPLACE FUNCTION update_member_status(
    p_crew_id UUID,
    p_status TEXT
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE crew_members
    SET status = p_status
    WHERE crew_id = p_crew_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Not a member of this crew';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send crew message
CREATE OR REPLACE FUNCTION send_crew_message(
    p_crew_id UUID,
    p_message TEXT
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_message_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if user is a member
    IF NOT EXISTS (
        SELECT 1 FROM crew_members
        WHERE crew_id = p_crew_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Not a member of this crew';
    END IF;

    -- Insert message
    INSERT INTO crew_messages (crew_id, user_id, message)
    VALUES (p_crew_id, v_user_id, p_message)
    RETURNING id INTO v_message_id;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_messages ENABLE ROW LEVEL SECURITY;

-- Crews policies
CREATE POLICY "Public crews are viewable by everyone"
    ON crews FOR SELECT
    USING (is_public = true);

CREATE POLICY "Private crews viewable by members"
    ON crews FOR SELECT
    USING (
        NOT is_public AND EXISTS (
            SELECT 1 FROM crew_members
            WHERE crew_members.crew_id = crews.id
            AND crew_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create crews"
    ON crews FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Owners can update their crews"
    ON crews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM crew_members
            WHERE crew_members.crew_id = crews.id
            AND crew_members.user_id = auth.uid()
            AND crew_members.role = 'owner'
        )
    );

CREATE POLICY "Owners can delete their crews"
    ON crews FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM crew_members
            WHERE crew_members.crew_id = crews.id
            AND crew_members.user_id = auth.uid()
            AND crew_members.role = 'owner'
        )
    );

-- Crew members policies
CREATE POLICY "Crew members visible to other members"
    ON crew_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM crew_members cm
            WHERE cm.crew_id = crew_members.crew_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join crews"
    ON crew_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own member record"
    ON crew_members FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can leave crews"
    ON crew_members FOR DELETE
    USING (auth.uid() = user_id);

-- Crew invites policies
CREATE POLICY "Users can view their invites"
    ON crew_invites FOR SELECT
    USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Members can invite others"
    ON crew_invites FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM crew_members
            WHERE crew_members.crew_id = crew_invites.crew_id
            AND crew_members.user_id = auth.uid()
        )
    );

-- Crew messages policies
CREATE POLICY "Members can view crew messages"
    ON crew_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM crew_members
            WHERE crew_members.crew_id = crew_messages.crew_id
            AND crew_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can send messages"
    ON crew_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM crew_members
            WHERE crew_members.crew_id = crew_messages.crew_id
            AND crew_members.user_id = auth.uid()
        )
    );

-- ==================== COMMENTS ====================

COMMENT ON TABLE crews IS 'User-created crews/circles for group coordination';
COMMENT ON TABLE crew_members IS 'Members of each crew with roles and status';
COMMENT ON TABLE crew_invites IS 'Pending crew invitations';
COMMENT ON TABLE crew_messages IS 'Crew group chat messages';

COMMENT ON FUNCTION create_crew IS 'Creates a new crew and adds creator as owner';
COMMENT ON FUNCTION get_crew_members IS 'Get all members of a crew with user details';
COMMENT ON FUNCTION join_crew IS 'Join a public crew';
COMMENT ON FUNCTION leave_crew IS 'Leave a crew (deletes crew if owner is last member)';
COMMENT ON FUNCTION update_member_status IS 'Update member status (ready, getting_ready, running_late, offline)';
COMMENT ON FUNCTION send_crew_message IS 'Send a message to crew chat';
