# Vybz Circle - Recommendation & Personalization Algorithms

## Overview

This document describes the intelligent algorithms implemented in Vybz Circle to personalize and improve the user experience over time. The system learns from user behavior to provide better event recommendations, trending insights, and smart notifications.

## Architecture

```
User Actions → Behavior Tracking → Preference Learning → Recommendations
                      ↓                      ↓                    ↓
                  Database           User Profile         Personalized Feed
```

## Core Components

### 1. **Behavior Tracking System**

Tracks all user interactions with events to build a comprehensive understanding of preferences.

**Tracked Actions:**
- `view` - User views an event detail page (weight: 0.1)
- `click` - User clicks on an event card (weight: 0.3)
- `save` - User saves/wishlists an event (weight: 0.5)
- `purchase` - User purchases a ticket (weight: 1.0)
- `share` - User shares an event (weight: 0.4)

**Implementation:**
```typescript
BehaviorTracker.trackAction(userId, eventId, 'click', metadata)
```

**Storage:**
- Table: `user_behaviors`
- Anonymous tracking via session IDs for non-logged-in users
- Data retention: 90 days

### 2. **Preference Learning System**

Automatically learns user preferences based on behavior.

**What It Learns:**
- Favorite event categories (Music, Arts, Food, etc.)
- Price range preferences (min/max)
- Preferred days of the week
- Favorite venues
- Location preferences

**How It Works:**
1. Every significant action (click, save, purchase) updates preferences
2. Categories are scored based on weighted interactions
3. Top 10 categories are maintained
4. Scores decay over time to adapt to changing interests

**Implementation:**
```typescript
// Automatically updated on user actions
await updateUserPreferences(userId, eventId, actionType)
```

### 3. **Recommendation Engine**

Generates personalized event recommendations using multiple strategies.

#### **Strategy 1: Content-Based Filtering** (40% weight)

Recommends events similar to what the user has liked before.

**Algorithm:**
1. Get user's top 5 favorite categories
2. Find events in those categories
3. Score based on:
   - Category match strength (70%)
   - Price preference match (30%)
4. Return top scorers

**Benefits:**
- Works even with limited user data
- Explains why events are recommended
- Adapts quickly to new interests

#### **Strategy 2: Collaborative Filtering** (30% weight)

Recommends events that similar users enjoyed.

**Algorithm:**
1. Find events the user interacted with
2. Find other users who interacted with the same events
3. Recommend events those users also liked
4. Score based on frequency of recommendations

**Benefits:**
- Discovers events outside usual categories
- Social proof ("Users like you enjoyed this")
- Improves over time with more data

#### **Strategy 3: Trending Events** (20% weight)

Surfaces currently popular events.

**Algorithm:**
1. Calculate engagement score per event:
   ```
   score = views×1 + clicks×2 + saves×3 + purchases×5 + shares×4
   ```
2. Normalize scores relative to top event
3. Update hourly via `update_trending_events()` function

**Benefits:**
- Keeps content fresh
- Highlights community favorites
- Works for all users

#### **Strategy 4: New Events** (10% weight)

Ensures new events get visibility.

**Algorithm:**
1. Select events added in last 7 days
2. Give moderate score boost
3. Mix into recommendations

**Benefits:**
- Discovery of new content
- Fair chance for new organizers
- Keeps platform feeling fresh

### 4. **Smart Search Ranking**

Personalizes search results based on user preferences.

**Algorithm:**
1. Base scoring on text relevance:
   - Title match: +50 points
   - Description match: +25 points
2. Boost by category preference: +10 × preference_score
3. Boost by price preference: +20 × price_match_score
4. Sort by total score

**Benefits:**
- More relevant search results
- Faster discovery
- Learns from behavior

### 5. **Notification Optimizer**

Determines when and if to send notifications.

**Optimal Timing:**
1. Analyze user's most active hours (last 100 actions)
2. Find hour with most activity
3. Send notifications at that hour
4. Default: 6 PM if no data

**Notification Eligibility:**
- Don't notify if user already purchased ticket
- Do notify if user showed interest (view/save/click)
- Do notify if event matches top preferences (score > 0.5)

**Benefits:**
- Higher engagement rates
- Less notification fatigue
- Respects user patterns

## Database Schema

### user_behaviors
```sql
CREATE TABLE user_behaviors (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_id UUID REFERENCES events(id),
    action_type TEXT CHECK (action_type IN ('view', 'click', 'save', 'purchase', 'share')),
    timestamp TIMESTAMPTZ,
    session_id TEXT,
    metadata JSONB
);
```

### user_preferences
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    favorite_categories JSONB DEFAULT '[]',
    price_range_min INTEGER,
    price_range_max INTEGER,
    preferred_days JSONB,
    preferred_venues JSONB,
    location_preferences JSONB,
    updated_at TIMESTAMPTZ
);
```

### event_recommendations
```sql
CREATE TABLE event_recommendations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_id UUID REFERENCES events(id),
    score DECIMAL(10, 2),
    reasons JSONB,
    computed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,  -- Cache for 1 hour
    UNIQUE(user_id, event_id)
);
```

### trending_events
```sql
CREATE TABLE trending_events (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) UNIQUE,
    engagement_score DECIMAL(10, 2),
    view_count INTEGER,
    click_count INTEGER,
    save_count INTEGER,
    purchase_count INTEGER,
    share_count INTEGER,
    computed_at TIMESTAMPTZ,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
);
```

## API Endpoints

### POST `/api/recommendations/track`
Track user behavior

**Request:**
```json
{
  "userId": "uuid",
  "eventId": "uuid",
  "actionType": "click",
  "metadata": {}
}
```

### GET `/api/recommendations/for-you`
Get personalized recommendations

**Query:**
- `userId` - User ID
- `limit` - Number of recommendations (default: 10)

**Response:**
```json
{
  "events": [...],
  "cached": true
}
```

### GET `/api/recommendations/trending`
Get trending events

**Query:**
- `limit` - Number of events (default: 10)

### GET `/api/recommendations/similar/:eventId`
Get events similar to a specific event

**Query:**
- `limit` - Number of similar events (default: 6)

### POST `/api/recommendations/search`
Get personalized search results

**Request:**
```json
{
  "query": "jazz",
  "userId": "uuid",
  "results": [...]
}
```

## Frontend Integration

### React Hooks

#### `usePersonalizedRecommendations(limit)`
```typescript
const { data: events, isLoading } = usePersonalizedRecommendations(10)
```

#### `useTrendingEvents(limit)`
```typescript
const { data: trending } = useTrendingEvents(8)
```

#### `useSimilarEvents(eventId, limit)`
```typescript
const { data: similar } = useSimilarEvents(eventId, 6)
```

#### `useTrackEventClick()`
```typescript
const trackClick = useTrackEventClick()
trackClick(eventId, { from: 'home_feed' })
```

#### `useTrackEventSave()`
```typescript
const trackSave = useTrackEventSave()
trackSave(eventId, true) // true = saved, false = unsaved
```

### Automatic Tracking

Tracking is automatic in:
- **EventCard**: Tracks clicks and saves
- **EventDetail**: Tracks views on mount
- **Search**: Tracks search queries

## Performance Optimizations

### 1. **Caching**
- Recommendations cached for 1 hour per user
- Trending events cached and updated hourly
- Client-side React Query caching (5-30 min)

### 2. **Database Indexes**
All high-frequency queries have indexes:
```sql
CREATE INDEX idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX idx_user_behaviors_event_id ON user_behaviors(event_id);
CREATE INDEX idx_user_behaviors_timestamp ON user_behaviors(timestamp DESC);
```

### 3. **Batch Processing**
- Trending events calculated in batch via SQL function
- Old data cleaned up periodically (90+ days)

### 4. **Async Updates**
- Preference updates happen asynchronously
- Don't block user interactions

## Privacy & Security

### Row Level Security (RLS)

All tables have RLS policies:

```sql
-- Users can only view their own data
CREATE POLICY "Users can view own data"
  ON user_behaviors FOR SELECT
  USING (auth.uid() = user_id);

-- Public can insert (for tracking)
CREATE POLICY "Anyone can track"
  ON user_behaviors FOR INSERT
  WITH CHECK (true);
```

### Anonymous Tracking

- Non-logged-in users tracked via session ID
- Session ID stored in localStorage
- No personally identifiable information
- Can delete anytime

### Data Retention

- Behavior data: 90 days
- Preference data: Until account deletion
- Recommendation cache: 1 hour
- Compliant with privacy regulations

## Future Improvements

### Planned Enhancements

1. **Time-Decay Scoring**
   - Recent actions weighted higher
   - Preferences evolve naturally

2. **Location-Based Recommendations**
   - Proximity to user's location
   - Venue clustering

3. **Social Graph Integration**
   - Friends' activity
   - Group recommendations

4. **A/B Testing Framework**
   - Test different algorithms
   - Measure engagement

5. **Real-Time Recommendations**
   - WebSocket updates
   - Live trending

6. **Advanced ML Models**
   - Neural collaborative filtering
   - Deep learning for embeddings
   - Contextual bandits for optimization

## Monitoring & Analytics

### Key Metrics

Track these to measure algorithm performance:

1. **Engagement Rate**
   - CTR on personalized recommendations
   - Comparison with non-personalized

2. **Conversion Rate**
   - Purchase rate from recommendations
   - Time to purchase

3. **Diversity**
   - Category distribution in recommendations
   - Avoid filter bubbles

4. **Coverage**
   - % of events that get recommended
   - Long-tail distribution

5. **Satisfaction**
   - User feedback
   - Session duration

### Dashboard Queries

```sql
-- Click-through rate
SELECT
  COUNT(CASE WHEN action_type = 'click' THEN 1 END)::float /
  COUNT(CASE WHEN action_type = 'view' THEN 1 END) as ctr
FROM user_behaviors
WHERE timestamp >= NOW() - INTERVAL '7 days';

-- Top recommended categories
SELECT
  category,
  COUNT(*) as recommendation_count
FROM events e
JOIN event_recommendations r ON e.id = r.event_id
GROUP BY category
ORDER BY COUNT(*) DESC;
```

## Testing

### Unit Tests

Test core algorithms independently:

```typescript
describe('RecommendationEngine', () => {
  it('should weight strategies correctly', () => {
    // Test strategy weights sum to 1.0
  })

  it('should handle empty user history', () => {
    // Test cold start scenario
  })

  it('should deduplicate events', () => {
    // Test multiple strategies don't duplicate
  })
})
```

### Integration Tests

Test end-to-end flows:

```typescript
describe('Personalization Flow', () => {
  it('should track action and update preferences', async () => {
    await trackAction(userId, eventId, 'save')
    const prefs = await getPreferences(userId)
    expect(prefs.favorite_categories).toContain(eventCategory)
  })
})
```

## Conclusion

The Vybz Circle recommendation system provides:

✅ **Personalized Experience** - Learns user preferences over time
✅ **Better Discovery** - Surfaces relevant events
✅ **Trending Insights** - Highlights popular events
✅ **Smart Timing** - Notifies at optimal times
✅ **Privacy-First** - RLS and data retention policies
✅ **Scalable** - Cached and optimized for growth

The algorithms continuously improve as more users engage with the platform, creating a better experience for everyone.

---

**Last Updated:** January 2026
**Version:** 1.0.0
**Maintainer:** Vybz Circle Engineering Team
