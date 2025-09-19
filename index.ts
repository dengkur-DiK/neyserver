 import 'dotenv/config'; // Make sure dotenv is at the very top
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// This is the new, simplified logger
const log = (message: string, source = "express") => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};

const app = express();

app.disable('etag');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to explicitly remove caching headers from all responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.removeHeader('ETag');
  res.removeHeader('Last-Modified');
  next();
});

// Original logging middleware - simplified for clarity
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

(async () => {
  // Image Upload Route
  app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
      }

      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'antbrostech_portfolio' },
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            if (error && (error.http_code === 401 || error.http_code === 403)) {
              return res.status(401).json({ error: 'Cloudinary authentication failed. Check API Key/Secret.' });
            }
            return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
          }
          res.status(200).json({ imageUrl: result.secure_url });
        }
      ).end(req.file.buffer);

    } catch (error) {
      console.error('Server error during image upload:', error);
      res.status(500).json({ error: 'Internal server error during image upload.' });
    }
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();