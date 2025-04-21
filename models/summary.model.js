import mongoose from "mongoose";

const summarySchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    title: {
        type: String,
    },
    overview: {
        type: String,
    },
    mainPoints: {
        type: [String]
    },
    importantTerms: {
        type: [String]
    },
    benefits: {
        type: String,
    },
    riskOrLimitations: {
        type: String,
    },
    recommendations: {
        type: String,
    },
    conclusion: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Summary = mongoose.model("Summary", summarySchema);

export default Summary;

