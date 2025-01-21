import mongoose from "mongoose";
import cron from "node-cron";
import { startBot } from "./src/bot/bot.js";
import { fetchVolumeDataAndUpdate } from "./src/volumeTracker.js";

const MONGODB_URI = process.env.MONGODB_URI;

process.on("unhandledRejection", (reason, p) => {
	console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
});

if (!MONGODB_URI) {
	console.error("Error:  MONGODB_URI environment variable not set.");
	process.exit(1);
}

/**
 * Starts the Telegram bot.
 */
async function start() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log("Connected to MongoDB");

		startBot();

		await fetchVolumeDataAndUpdate();
		cron.schedule("0 * * * *", fetchVolumeDataAndUpdate);
	} catch (error) {
		console.error(error);
	}
}

start();
