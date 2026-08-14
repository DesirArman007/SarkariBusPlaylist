import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'desirarman',
  api_key: process.env.CLOUDINARY_API_KEY || '519887776143113',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'R6u37CXBF5_7HJjsSWzgKXpdo78',
  secure: true
});

export { cloudinary };
