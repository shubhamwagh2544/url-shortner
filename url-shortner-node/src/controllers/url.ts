import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import Url from "../models/url.js";
import { validateAndSanitizeUrl, validateShortId } from "../utils/validators.js";
import { ApiError, createSuccessResponse } from "../utils/errors.js";

interface UrlRequest {
    url: string;
}
export type ShortIdType = string | string[] | undefined;

/**
 * Generates a short URL
 * @route POST /url
 * @param req - Express request with URL in body
 * @param res - Express response
 */
async function handleGenerateShortUrl(req: Request, res: Response) {
    try {
        const body: UrlRequest = req.body;
        const url = body.url;

        const validation = validateAndSanitizeUrl(url);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'URL validation failed',
                errors: validation.errors,
                statusCode: 400
            });
        }

        const sanitizedUrl = validation.sanitizedUrl!;

        // Check if URL already exists (prevent duplicates)
        const existingUrl = await Url.findOne({ redirectUrl: sanitizedUrl });

        if (existingUrl) {
            return res.status(200).json(
                createSuccessResponse({
                    shortId: existingUrl.shortId,
                    message: 'URL already shortened',
                    existing: true
                })
            );
        }

        // Generate unique short ID
        let shortId: string = '';
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!isUnique && attempts < maxAttempts) {
            shortId = nanoid(8);
            const existing = await Url.findOne({ shortId });
            isUnique = !existing;
            attempts++;
        }

        if (!isUnique) {
            throw new ApiError(500, 'Failed to generate unique short ID after multiple attempts');
        }

        const newUrl = await Url.create({
            shortId: shortId,
            redirectUrl: sanitizedUrl,
            visitHistory: []
        });

        return res.status(201).json(
            createSuccessResponse({
                shortId: newUrl.shortId,
                shortUrl: `${process.env.BASE_URL || 'http://localhost:8001'}/${newUrl.shortId}`,
                originalUrl: newUrl.redirectUrl
            })
        );
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                errors: error.errors,
                statusCode: error.statusCode
            });
        }

        if (error instanceof Error && error.message.includes('duplicate key')) {
            return res.status(409).json({
                success: false,
                message: 'Short ID already exists. Please try again.',
                statusCode: 409
            });
        }

        console.error('Error generating short URL:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while generating short URL',
            statusCode: 500
        });
    }
}

/**
 * Retrieves analytics for a short URL
 * @route GET /url/analytics/:shortId
 * @param req - Express request with shortId param
 * @param res - Express response
 */
async function handleGetAnalytics(req: Request, res: Response) {
    try {
        let shortId: ShortIdType = req.params.shortId;

        if (!shortId) {
            return res.status(400).json({
                success: false,
                message: 'Short ID is required',
                statusCode: 400
            });
        }

        if (Array.isArray(shortId)) {
            shortId = shortId[0];
            if (!shortId) {
                return res.status(400).json({
                    success: false,
                    message: 'Short ID is required',
                    statusCode: 400
                });
            }
        }

        // Validate short ID
        const validation = validateShortId(shortId);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Short ID validation failed',
                errors: validation.errors,
                statusCode: 400
            });
        }

        const entry = await Url.findOne({ shortId } as any);

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'URL record not found',
                statusCode: 404
            });
        }

        const lastVisit = entry.visitHistory && entry.visitHistory.length > 0
            ? new Date(entry.visitHistory[entry.visitHistory.length - 1]?.timestamp || 0)
            : null;

        return res.status(200).json(
            createSuccessResponse({
                shortId: entry.shortId,
                originalUrl: entry.redirectUrl,
                totalClicks: entry.visitHistory?.length || 0,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
                analytics: {
                    visitHistory: entry.visitHistory || [],
                    lastVisited: lastVisit
                }
            })
        );
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching analytics',
            statusCode: 500
        });
    }
}

export {
    handleGenerateShortUrl,
    handleGetAnalytics
}
