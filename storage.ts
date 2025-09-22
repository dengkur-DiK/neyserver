 // file: server/src/storage.ts

import {
  users,
  contacts,
  bookings,
  portfolioItems,
  messages,
  type User,
  type InsertUser,
  type Contact,
  type InsertContact,
  type Booking,
  type InsertBooking,
  type PortfolioItem,
  type InsertPortfolioItem,
  type UpdatePortfolioItem,
  type Message,
  type InsertMessage,
} from "./schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookings(): Promise<Booking[]>;
  getPortfolioItems(): Promise<PortfolioItem[]>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  updatePortfolioItem(id: number, item: UpdatePortfolioItem): Promise<PortfolioItem | undefined>;
  deletePortfolioItem(id: number): Promise<void>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(): Promise<Message[]>;
  deleteMessage(id: number): Promise<void>; // Added to interface
  deleteBooking(id: number): Promise<void>; // Added to interface
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(insertContact).returning();
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getPortfolioItems(): Promise<PortfolioItem[]> {
    try {
      const items = await db.select().from(portfolioItems);
      return items;
    } catch (error) {
      console.error("DEBUG: Error fetching portfolio items from DB:", error);
      throw error;
    }
  }

  async createPortfolioItem(insertItem: InsertPortfolioItem): Promise<PortfolioItem> {
    try {
      const [item] = await db.insert(portfolioItems).values(insertItem).returning();
      return item;
    } catch (error) {
      console.error("DEBUG: Error inserting portfolio item:", error);
      throw error;
    }
  }

  async updatePortfolioItem(id: number, updateData: UpdatePortfolioItem): Promise<PortfolioItem | undefined> {
    try {
      const [item] = await db.update(portfolioItems).set(updateData).where(eq(portfolioItems.id, id)).returning();
      return item || undefined;
    } catch (error) {
      console.error("DEBUG: Error updating portfolio item:", error);
      throw error;
    }
  }

  async deletePortfolioItem(id: number): Promise<void> {
    try {
      await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    } catch (error) {
      console.error(`DEBUG: Error deleting portfolio item ID ${id}:`, error);
      throw error;
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async deleteMessage(id: number): Promise<void> {
    try {
      await db.delete(messages).where(eq(messages.id, id));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  async deleteBooking(id: number): Promise<void> {
    try {
      await db.delete(bookings).where(eq(bookings.id, id));
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw new Error('Failed to delete booking');
    }
  }
}

export const storage = new DatabaseStorage();