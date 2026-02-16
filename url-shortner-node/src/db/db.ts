import mongoose from "mongoose";

async function connectToMongoDB(url: string) {
    try {
        await mongoose.connect(url)
    } catch (error) {
        console.log('error connecting mongo: ', error)
        throw error
    }
}

export {
    connectToMongoDB
}
