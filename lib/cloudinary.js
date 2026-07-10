import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

function parseCloudinaryUrl(value) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'cloudinary:') return null;

    const cloudName = parsed.hostname;
    const apiKey = decodeURIComponent(parsed.username || '');
    const apiSecret = decodeURIComponent(parsed.password || '');

    if (!cloudName || !apiKey || !apiSecret) return null;

    return {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    };
  } catch {
    return null;
  }
}

function resolveCloudinaryConfig() {
  const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  if (fromUrl) return fromUrl;

  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (cloud_name && api_key && api_secret) {
    return { cloud_name, api_key, api_secret };
  }

  return null;
}

export function getCloudinary() {
  if (!isConfigured) {
    const config = resolveCloudinaryConfig();

    if (!config) {
      throw new Error(
        'Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
      );
    }

    cloudinary.config({
      ...config,
      secure: true,
    });

    isConfigured = true;
  }

  return cloudinary;
}

