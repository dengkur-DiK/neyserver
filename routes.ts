 // file: server/src/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertBookingSchema, insertMessageSchema } from "server/schema";
import { z } from "zod";
import { registerPortfolioRoutes } from "./routes-portfolio";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register portfolio routes
  registerPortfolioRoutes(app);

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.json({ success: true, contact });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        console.error("Error creating contact:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Booking form submission
  app.post("/api/booking", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.json({ success: true, booking });
    } catch (error) {
      console.error("*** DETAILED SERVER ERROR FOR POST /api/booking ***");
      console.error(error);
      if (error instanceof Error) console.error("Error stack:", error.stack);
      console.error("****************************************************");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all contacts (for admin purposes)
  app.get("/api/contacts", async (_req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      console.error("*** DETAILED SERVER ERROR FOR GET /api/contacts ***");
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all bookings (for admin purposes)
  app.get("/api/bookings", async (_req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error("*** DETAILED SERVER ERROR FOR GET /api/bookings ***");
      console.error(error);
      if (error instanceof Error) console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- Messages routes ---
  app.get("/api/messages", async (_req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("*** DETAILED SERVER ERROR FOR GET /api/messages ***");
      console.error(error);
      if (error instanceof Error) console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const newMessage = await storage.createMessage(validatedData);
      res.status(201).json(newMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        console.error("*** DETAILED SERVER ERROR FOR POST /api/messages ***");
        console.error(error);
        if (error instanceof Error) console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Failed to create message" });
      }
    }
  });
  
  // New DELETE route for messages
  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMessage(Number(id));
      res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error(`Error deleting message with ID ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // New DELETE route for bookings
  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBooking(Number(id));
      res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error) {
      console.error(`Error deleting booking with ID ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}