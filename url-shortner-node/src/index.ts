import type { Request, Response } from 'express';
import express from 'express';
import urlRouter from './routes/url.js'
import { connectToMongoDB } from "./db/db.js";
import Url from "./models/url.js";

const app = express();
const PORT = 8001;

connectToMongoDB('mongodb://localhost:27017/short-url')
    .then(() => {
        console.log('mongodb connected successfully');
    })
    .catch((error) => {
        console.log('mongo connection failed: ', error)
    })

app.use(express.json())
app.use('/url', urlRouter)
app.get('/:shortId', async (req: Request, res: Response) => {
    const shortId = req.params.shortId;
    if (!shortId) {
        return res.status(400).json({
            msg: 'shortId field is mandatory'
        })
    }

    const entry = await Url.findOneAndUpdate(
        { shortId },
        {
            $push: {
                visitHistory: {
                    timestamp: Date.now()
                }
            }
        }
    );

    if (!entry) {
        return res.status(400).json({
            msg: 'url record do not exists'
        });
    }

    let redirectUrl = entry.redirectUrl;
    if (!/^https?:\/\//i.test(redirectUrl)) {
        redirectUrl = `https://${redirectUrl}`;
    }

    return res.redirect(redirectUrl);
})

app.listen(PORT, () => {
    console.log('server started on port: ', PORT)
})
