import mongoose from "mongoose";

const pyqSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  academicYear: {
    type: String,
  },
  extractedText: {
    type: String,
    required: true,
  },
  preprocessedText: {
    context: { // context of the question paper for the model
      type: String,
    },
    questions: [{
      marks: {
        type: Number,
      },
      questionNumber: {
        type: String,
      },
      questionText: {
        type: String,
        required: true,
      }
    }],
  },
  solutions: [{
    questionNumber: {
      type: String,
    },
    marks: {
      type: Number,
    },
    questionText: {
      type: String,
      required: true,
    },
    solution: {
      introduction: {
        type: String,
      },
      keyConcepts: {
        type: [String],
      },
      mainContent: {
        type: String,
      },
      examples: {
        type: [String],
      },
      conclusion: {
        type: String,
      },
      tips: {
        type: [String]
      }
    },
  }],
  
}, { timestamps: true });

const Pyq = mongoose.model("Pyq", pyqSchema);

export default Pyq;
