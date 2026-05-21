require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const CodeReview = require('./models/CodeReview');
const { analyzeCode } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Analyze code
app.post('/api/analyze', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    console.log(`🔍 Analyzing ${language} code...`);
    
    // Perform AI analysis
    const analysis = await analyzeCode(code, language);

    // Save to database
    const codeReview = new CodeReview({
      code,
      language,
      score: analysis.score,
      feedback: analysis.feedback,
      suggestions: analysis.suggestions,
      errors: analysis.errors,
      optimizedCode: analysis.optimizedCode
    });

    await codeReview.save();
    console.log('✅ Analysis completed and saved');

    res.json({
      success: true,
      data: {
        id: codeReview._id,
        score: analysis.score,
        feedback: analysis.feedback,
        suggestions: analysis.suggestions,
        errors: analysis.errors,
        optimizedCode: analysis.optimizedCode
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze code',
      message: error.message 
    });
  }
});

// Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await CodeReview.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-code -optimizedCode'); // Exclude large fields

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get single review by ID
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Fetch review error:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Delete review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const review = await CodeReview.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalReviews = await CodeReview.countDocuments();
    const avgScore = await CodeReview.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    
    const languageStats = await CodeReview.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalReviews,
        averageScore: avgScore[0]?.avgScore || 0,
        languageStats
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;