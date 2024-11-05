import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
	userId: { type: Number, required: true },
	chatId: { type: Number, required: true },
	newPools: { type: Boolean, required: true },
	increasedVolume: { type: Boolean, required: true }
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
