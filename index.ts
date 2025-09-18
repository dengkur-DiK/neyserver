  import 'dotenv/config'; // Make sure dotenv is at the very top
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes"; // Assuming this registers all routes
import { setupVite, serveStatic, log } from "./vite";
import multer from 'multer'; // Import multer

const app = express();

// CRITICAL: THIS LINE MUST BE HERE, IMMEDIATELY AFTER express() INITIALIZATION
app.disable('etag'); // Disables ETag generation for all Express responses

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Stores files in memory as a buffer

// Middleware to explicitly remove caching headers from all responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.removeHeader('ETag');
  res.removeHeader('Last-Modified');
  next();
});

// Original logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });
  next();
});

(async () => {
  // Image Upload Route
  app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    console.log("DEBUG: /api/upload-image route hit.");
    try {
      if (!req.file) {
        console.error("DEBUG: No file provided in upload request.");
        return res.status(400).json({ error: 'No image file provided.' });
      }

      console.log(`DEBUG: File received - name: ${req.file.originalname}, size: ${req.file.size} bytes`);
      console.log("DEBUG: Importing cloudinaryConfig...");
      
      const cloudinary = (await import('./cloudinaryConfig')).default; // Dynamically import Cloudinary config

      console.log("DEBUG: Attempting to upload to Cloudinary...");
      // Upload the image buffer to Cloudinary using upload_stream
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'antbrostech_portfolio' }, // Optional: organize uploads in a folder
        (error, result) => {
          if (error || !result) {
            console.error('DEBUG: Cloudinary upload callback error:', error);
            // Check if it's an authentication error
            if (error && error.http_code === 401) {
              return res.status(401).json({ error: 'Cloudinary authentication failed. Check API Key/Secret.' });
            }
            return res.status(500).json({ error: 'Failed to upload image to Cloudinary. Check server logs.' });
          }
          console.log('DEBUG: Cloudinary upload successful. Result:', result);
          res.status(200).json({ imageUrl: result.secure_url });
        }
      ).end(req.file.buffer); // End the stream with the file buffer

    } catch (error) {
      console.error('DEBUG: Server error during image upload (catch block):', error);
      res.status(500).json({ error: 'Internal server error during image upload. Check server logs.' });
    }
  });


  const server = await registerRoutes(app); // Register your existing API routes

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("DEBUG: Express error handling middleware caught an error:", err); // Log full error object
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();