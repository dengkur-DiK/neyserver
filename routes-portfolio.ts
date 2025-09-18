import type { Express } from "express";
import { storage } from "./storage";
import { insertPortfolioItemSchema } from "@shared/schema";

export function registerPortfolioRoutes(app: Express) {
  // Get all portfolio items
  app.get("/api/portfolio", async (req, res) => {
    try {
      const items = await storage.getPortfolioItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching portfolio items:", error);
      res.status(500).json({ error: "Failed to fetch portfolio items" });
    }
  });

  // Add new portfolio item
  app.post("/api/portfolio", async (req, res) => {
    try {
      const validatedData = insertPortfolioItemSchema.parse(req.body);
      const newItem = await storage.createPortfolioItem(validatedData);
      res.json({ success: true, item: newItem });
    } catch (error) {
      console.error("Error creating portfolio item:", error);
      res.status(500).json({ error: "Failed to create portfolio item" });
    }
  });

  // Update portfolio item
  app.put("/api/portfolio/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedItem = await storage.updatePortfolioItem(id, updateData);
      res.json({ success: true, item: updatedItem });
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      res.status(404).json({ error: "Portfolio item not found" });
    }
  });

  // Delete portfolio item
  app.delete("/api/portfolio/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePortfolioItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      res.status(404).json({ error: "Portfolio item not found" });
    }
  });
}