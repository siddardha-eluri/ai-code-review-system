const mongoose = require('mongoose');

const codeReviewSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String
  },
  suggestions: [{
    type: String
  }],
  errors: [{
    type: String
  }],
  optimizedCode: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CodeReview', codeReviewSchema);