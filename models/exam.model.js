import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    keyPoints: {
        type: [String],
        required: true,
    },
    tips: {
        type: [String],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Exam = mongoose.model("Exam", examSchema);

export default Exam;

