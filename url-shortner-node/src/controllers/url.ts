import type {Request, Response} from "express";
import {nanoid} from "nanoid";
import Url from "../models/url.js";

interface UrlRequest {
    url: string,
}

async function handleGenerateShortUrl(req: Request, res: Response) {
    const body: UrlRequest = req.body;
    const url = body.url;
    if (!url) {
        return res.status(400).json({
            msg: 'url field is mandatory'
        })
    }

    const shortId = nanoid(8);

    await Url.create({
        shortId: shortId,
        redirectUrl: url,
        visitHistory: []
    });

    return res.status(201).json({
        id: shortId
    });
}

async function handleGetAnalytics(req: Request, res: Response) {
    const shortId = req.params.shortID;
    if (!shortId) {
        return res.status(400).json({
            msg: 'shortId field is mandatory'
        })
    }

    const entry = await Url.findOne({shortId});
    if (!entry) {
        return res.status(400).json({
            msg: 'url record not found'
        })
    }

    return res.status(200).json({
        totalClicks: entry.visitHistory.length,
        analytics: entry.visitHistory
    })
}

export {
    handleGenerateShortUrl,
    handleGetAnalytics
}
