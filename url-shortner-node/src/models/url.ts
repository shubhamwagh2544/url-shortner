import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
    {
        shortId: {
            type: String,
            required: [true, 'Short ID is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            maxlength: [20, 'Short ID cannot exceed 20 characters'],
            match: [/^[a-zA-Z0-9_-]+$/, 'Short ID can only contain alphanumeric characters, hyphens, and underscores']
        },
        redirectUrl: {
            type: String,
            required: [true, 'Redirect URL is required'],
            trim: true,
            maxlength: [2048, 'URL cannot exceed 2048 characters'],
            validate: {
                validator: function (url: string) {
                    try {
                        new URL(url);
                        return true;
                    } catch (error) {
                        return false;
                    }
                },
                message: 'Invalid URL format'
            }
        },
        visitHistory: [
            {
                timestamp: {
                    type: Number,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true,
        collection: 'urls'
    }
);

urlSchema.index({ createdAt: -1 });
urlSchema.index({ shortId: 1 }, { unique: true });

const Url = mongoose.model('url', urlSchema);

export default Url;
