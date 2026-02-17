import express from 'express';
import { handleGenerateShortUrl, handleGetAnalytics } from "../controllers/url.js";

const router = express.Router();

/**
 * POST /url
 * Generate a new short URL
 * 
 * Request body:
 * {
 *   "url": "https://example.com/very/long/url"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "shortId": "abc12345",
 *     "shortUrl": "http://localhost:8001/abc12345",
 *     "originalUrl": "https://example.com/very/long/url"
 *   }
 * }
 */
router.post('/', handleGenerateShortUrl);

/**
 * GET /url/analytics/:shortId
 * Get analytics for a short URL
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "shortId": "abc12345",
 *     "originalUrl": "https://example.com/very/long/url",
 *     "totalClicks": 42,
 *     "createdAt": "2026-02-17T10:00:00.000Z",
 *     "updatedAt": "2026-02-17T11:30:00.000Z",
 *     "analytics": {
 *       "visitHistory": [
 *         { "timestamp": 1708154400000 },
 *         { "timestamp": 1708158000000 }
 *       ],
 *       "lastVisited": "2026-02-17T11:30:00.000Z"
 *     }
 *   }
 * }
 */
router.get('/analytics/:shortId', handleGetAnalytics);

export default router;

