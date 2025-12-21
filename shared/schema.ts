import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: varchar("phone", { length: 15 }).unique(), // Verifed phone number
  email: varchar("email", { length: 255 }), // Optional email
  display_name: varchar("display_name", { length: 100 }),
  rep_points: integer("rep_points").default(0),
  rep_level: integer("rep_level").default(1),
  interests: text("interests").array(), // Array of strings for interests
  home_location: jsonb("home_location"), // Storing Point as JSON for simplicity initially
  created_at: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  category: varchar("category", { length: 50 }),
  venue_id: uuid("venue_id"), // Reference to venues table (later)
  location: jsonb("location"), // Event coordinates
  starts_at: timestamp("starts_at", { withTimezone: true }),
  ticketing_type: varchar("ticketing_type", { length: 20 }), // vybz, external, door, free
  source: varchar("source", { length: 20 }), // organizer, scraper, scout, whatsapp
  status: varchar("status", { length: 20 }).default("draft"), // draft, pending, live, sold_out, completed
  scout_count: integer("scout_count").default(0),
  description: text("description"),
  image_url: text("image_url"), // Added for storing event image
  created_at: timestamp("created_at").defaultNow(),
  // Scraped event fields
  source_platform: varchar("source_platform", { length: 50 }), // ticketsasa, mtickets, etc.
  source_url: text("source_url"), // Link to original event page
  external_id: varchar("external_id", { length: 100 }), // Platform's event ID for deduplication
  organizer_name: varchar("organizer_name", { length: 255 }), // Event organizer
  price_range: varchar("price_range", { length: 100 }), // "KES 1,500 - 5,000"
  venue_name: varchar("venue_name", { length: 255 }), // Venue name as text
  scraped_at: timestamp("scraped_at", { withTimezone: true }), // When data was last fetched
  is_external: boolean("is_external").default(false), // Flag for external ticketing
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  event_id: uuid("event_id").references(() => events.id),
  user_id: uuid("user_id").references(() => users.id),
  ticket_code: varchar("ticket_code", { length: 20 }).unique(),
  status: varchar("status", { length: 20 }).default("valid"), // valid, used, refunded, transferred
  checked_in_at: timestamp("checked_in_at", { withTimezone: true }),
  mpesa_receipt: varchar("mpesa_receipt", { length: 20 }),
  mpesa_checkout_id: varchar("mpesa_checkout_id", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
});

// Schemas for API validation
export const insertUserSchema = createInsertSchema(users);
export const insertEventSchema = createInsertSchema(events);
export const insertTicketSchema = createInsertSchema(tickets);

export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
