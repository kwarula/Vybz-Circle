import { type User, type InsertUser, type Event, type InsertEvent, type Ticket, type InsertTicket } from "@shared/schema";
import { randomUUID } from "crypto";
import { users, events, tickets } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getEvents(options?: { source?: string }): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;

  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getUserTickets(userId: string): Promise<Ticket[]>;
}


import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase Client for Node.js
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Checking display_name or email
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${username},display_name.eq.${username}`)
      .single();

    if (error) return undefined;
    return data;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .insert({
        ...insertUser,
        rep_points: 0,
        rep_level: 1,
        // Ensure arrays/json are handled correctly if needed, usually auto-serialized
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data;
  }

  async getEvents(options?: { source?: string }): Promise<Event[]> {
    let query = supabase
      .from("events")
      .select("*");

    // Apply source filter if provided
    if (options?.source) {
      if (options.source === 'scraped') {
        // Only scraped events (from external platforms)
        query = query.eq('is_external', true);
      } else if (options.source === 'organizer') {
        // Only organizer-submitted events
        query = query.or('is_external.is.null,is_external.eq.false');
      }
      // 'all' or undefined = no filter
    }

    const { data, error } = await query
      .order("starts_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get events: ${error.message}`);
    return data || [];
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const { data, error } = await supabase
      .from("events")
      .insert({
        ...insertEvent,
        status: "draft",
        scout_count: 0
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create event: ${error.message}`);
    return data;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        ...insertTicket,
        status: "valid"
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create ticket: ${error.message}`);
    return data;
  }

  async getUserTickets(userId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to get user tickets: ${error.message}`);
    return data || [];
  }
}

export const storage = new SupabaseStorage();

