import type { Request, Response } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import urlRouter from './routes/url.js'
import { connectToMongoDB } from "./db/db.js";
import Url from "./models/url.js";
import { validateShortId } from './utils/validators.js';
import { createSuccessResponse } from './utils/errors.js';
import type {ShortIdType} from "./controllers/url.js";

const app = express();
dotenv.config();
const PORT = process.env.PORT || 8001;

connectToMongoDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortner-node')
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((error) => {
        console.log('MongoDB connection failed: ', error);
        process.exit(1);
    })

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy'
    });
});

app.use('/url', urlRouter);

app.get('/:shortId', async (req: Request, res: Response) => {
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

        const validation = validateShortId(shortId);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid short ID format',
                errors: validation.errors,
                statusCode: 400
            });
        }

        const entry = await Url.findOneAndUpdate(
            { shortId } as any,
            {
                $push: {
                    visitHistory: {
                        timestamp: Date.now()
                    }
                }
            },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'URL record not found',
                statusCode: 404
            });
        }

        let redirectUrl = entry.redirectUrl as string;

        // Ensure URL has protocol
        if (!/^https?:\/\//i.test(redirectUrl)) {
            redirectUrl = `https://${redirectUrl}`;
        }

        return res.redirect(301, redirectUrl);
    } catch (error) {
        console.error('Error processing redirect:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while processing redirect',
            statusCode: 500
        });
    }
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found',
        statusCode: 404
    });
});

// Error handler middleware
app.use((err: any, req: Request, res: Response) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        statusCode: err.status || 500
    });
});

app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
})
