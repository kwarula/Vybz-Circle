export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            ab_test_conversions: {
                Row: {
                    conversion_type: string
                    experiment_name: string
                    id: string
                    metadata: Json | null
                    timestamp: string
                    user_id: string | null
                    variant: string
                }
                Insert: {
                    conversion_type: string
                    experiment_name: string
                    id?: string
                    metadata?: Json | null
                    timestamp?: string
                    user_id?: string | null
                    variant: string
                }
                Update: {
                    conversion_type?: string
                    experiment_name?: string
                    id?: string
                    metadata?: Json | null
                    timestamp?: string
                    user_id?: string | null
                    variant?: string
                }
                Relationships: []
            }
            ab_test_exposures: {
                Row: {
                    experiment_name: string
                    id: string
                    timestamp: string
                    user_id: string | null
                    variant: string
                }
                Insert: {
                    experiment_name: string
                    id?: string
                    timestamp?: string
                    user_id?: string | null
                    variant: string
                }
                Update: {
                    experiment_name?: string
                    id?: string
                    timestamp?: string
                    user_id?: string | null
                    variant?: string
                }
                Relationships: []
            }
            event_recommendations: {
                Row: {
                    computed_at: string
                    event_id: string | null
                    expires_at: string
                    id: string
                    reasons: Json | null
                    score: number
                    user_id: string | null
                }
                Insert: {
                    computed_at?: string
                    event_id?: string | null
                    expires_at?: string
                    id?: string
                    reasons?: Json | null
                    score: number
                    user_id?: string | null
                }
                Update: {
                    computed_at?: string
                    event_id?: string | null
                    expires_at?: string
                    id?: string
                    reasons?: Json | null
                    score?: number
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "event_recommendations_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    }
                ]
            }
            event_search_analytics: {
                Row: {
                    clicked_event_id: string | null
                    clicked_position: number | null
                    id: string
                    query: string
                    results_count: number | null
                    session_id: string | null
                    timestamp: string
                    user_id: string | null
                }
                Insert: {
                    clicked_event_id?: string | null
                    clicked_position?: number | null
                    id?: string
                    query: string
                    results_count?: number | null
                    session_id?: string | null
                    timestamp?: string
                    user_id?: string | null
                }
                Update: {
                    clicked_event_id?: string | null
                    clicked_position?: number | null
                    id?: string
                    query?: string
                    results_count?: number | null
                    session_id?: string | null
                    timestamp?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "event_search_analytics_clicked_event_id_fkey"
                        columns: ["clicked_event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    }
                ]
            }
            friend_requests: {
                Row: {
                    created_at: string
                    from_user_id: string | null
                    id: string
                    message: string | null
                    status: string
                    to_user_id: string | null
                }
                Insert: {
                    created_at?: string
                    from_user_id?: string | null
                    id?: string
                    message?: string | null
                    status: string
                    to_user_id?: string | null
                }
                Update: {
                    created_at?: string
                    from_user_id?: string | null
                    id?: string
                    message?: string | null
                    status?: string
                    to_user_id?: string | null
                }
                Relationships: []
            }
            friendships: {
                Row: {
                    created_at: string
                    friend_id: string | null
                    id: string
                    status: string
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string
                    friend_id?: string | null
                    id?: string
                    status: string
                    updated_at?: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string
                    friend_id?: string | null
                    id?: string
                    status?: string
                    updated_at?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            notification_queue: {
                Row: {
                    body: string
                    created_at: string
                    data: Json | null
                    event_id: string | null
                    id: string
                    notification_type: string
                    scheduled_for: string
                    sent_at: string | null
                    status: string
                    title: string
                    user_id: string | null
                }
                Insert: {
                    body: string
                    created_at?: string
                    data?: Json | null
                    event_id?: string | null
                    id?: string
                    notification_type: string
                    scheduled_for: string
                    sent_at?: string | null
                    status?: string
                    title: string
                    user_id?: string | null
                }
                Update: {
                    body?: string
                    created_at?: string
                    data?: Json | null
                    event_id?: string | null
                    id?: string
                    notification_type?: string
                    scheduled_for?: string
                    sent_at?: string | null
                    status?: string
                    title?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notification_queue_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    }
                ]
            }
            trending_events: {
                Row: {
                    click_count: number | null
                    computed_at: string
                    engagement_score: number
                    event_id: string
                    id: string
                    period_end: string
                    period_start: string
                    purchase_count: number | null
                    save_count: number | null
                    share_count: number | null
                    view_count: number | null
                }
                Insert: {
                    click_count?: number | null
                    computed_at?: string
                    engagement_score: number
                    event_id: string
                    id?: string
                    period_end: string
                    period_start: string
                    purchase_count?: number | null
                    save_count?: number | null
                    share_count?: number | null
                    view_count?: number | null
                }
                Update: {
                    click_count?: number | null
                    computed_at?: string
                    engagement_score?: number
                    event_id?: string
                    id?: string
                    period_end?: string
                    period_start?: string
                    purchase_count?: number | null
                    save_count?: number | null
                    share_count?: number | null
                    view_count?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "trending_events_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: true
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_activity_feed: {
                Row: {
                    activity_type: string
                    content: string | null
                    created_at: string
                    event_id: string | null
                    id: string
                    user_id: string | null
                    visibility: string
                }
                Insert: {
                    activity_type: string
                    content?: string | null
                    created_at?: string
                    event_id?: string | null
                    id?: string
                    user_id?: string | null
                    visibility?: string
                }
                Update: {
                    activity_type?: string
                    content?: string | null
                    created_at?: string
                    event_id?: string | null
                    id?: string
                    user_id?: string | null
                    visibility?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_activity_feed_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_behaviors: {
                Row: {
                    action_type: string
                    created_at: string
                    event_id: string | null
                    id: string
                    metadata: Json | null
                    session_id: string | null
                    timestamp: string
                    user_id: string | null
                }
                Insert: {
                    action_type: string
                    created_at?: string
                    event_id?: string | null
                    id?: string
                    metadata?: Json | null
                    session_id?: string | null
                    timestamp?: string
                    user_id?: string | null
                }
                Update: {
                    action_type?: string
                    created_at?: string
                    event_id?: string | null
                    id?: string
                    metadata?: Json | null
                    session_id?: string | null
                    timestamp?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_behaviors_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_locations: {
                Row: {
                    city: string | null
                    country: string | null
                    id: string
                    latitude: number | null
                    longitude: number | null
                    max_distance_km: number | null
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    city?: string | null
                    country?: string | null
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    max_distance_km?: number | null
                    updated_at?: string
                    user_id?: string | null
                }
                Update: {
                    city?: string | null
                    country?: string | null
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    max_distance_km?: number | null
                    updated_at?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            user_preferences: {
                Row: {
                    created_at: string
                    favorite_categories: Json | null
                    id: string
                    location_preferences: Json | null
                    preferred_days: Json | null
                    preferred_venues: Json | null
                    price_range_max: number | null
                    price_range_min: number | null
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string
                    favorite_categories?: Json | null
                    id?: string
                    location_preferences?: Json | null
                    preferred_days?: Json | null
                    preferred_venues?: Json | null
                    price_range_max?: number | null
                    price_range_min?: number | null
                    updated_at?: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string
                    favorite_categories?: Json | null
                    id?: string
                    location_preferences?: Json | null
                    preferred_days?: Json | null
                    preferred_venues?: Json | null
                    price_range_max?: number | null
                    price_range_min?: number | null
                    updated_at?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            user_saved_locations: {
                Row: {
                    address: string | null
                    created_at: string
                    id: string
                    label: string
                    latitude: number
                    longitude: number
                    user_id: string | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string
                    id?: string
                    label: string
                    latitude: number
                    longitude: number
                    user_id?: string | null
                }
                Update: {
                    address?: string | null
                    created_at?: string
                    id?: string
                    label?: string
                    latitude?: number
                    longitude?: number
                    user_id?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_friends_activity_feed: {
                Args: {
                    p_user_id: string
                    p_limit?: number
                }
                Returns: {
                    activity_id: string
                    user_id: string
                    user_name: string
                    user_avatar: string
                    activity_type: string
                    event_id: string
                    event_title: string
                    content: string
                    created_at: string
                }[]
            }
            get_nearby_events: {
                Args: {
                    p_latitude: number
                    p_longitude: number
                    p_radius_km?: number
                    p_limit?: number
                }
                Returns: {
                    event_id: string
                    title: string
                    distance_km: number
                }[]
            }
            schedule_smart_notification: {
                Args: {
                    p_user_id: string
                    p_event_id: string
                    p_notification_type: string
                    p_title: string
                    p_body: string
                }
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
