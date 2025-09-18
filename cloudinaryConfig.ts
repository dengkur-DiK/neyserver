 import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config'; // Ensure dotenv is loaded here to read .env variables

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Use HTTPS for secure connections
});

export default cloudinary;
