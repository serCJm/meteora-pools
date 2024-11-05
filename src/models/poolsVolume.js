import mongoose from "mongoose";

const volumeSchema = new mongoose.Schema({
	timestamp: { type: Date, required: true },
	volume: { type: Number, required: true }
});

const poolVolumeSchema = new mongoose.Schema({
	poolAddress: { type: String, required: true, unique: true, index: true },
	volumes: [volumeSchema]
});

const PoolVolume = mongoose.model("PoolVolume", poolVolumeSchema);

export default PoolVolume;
