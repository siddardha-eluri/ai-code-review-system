import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCode, FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaRocket, FaHistory, FaChartLine } from 'react-icons/fa';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('review'); // review, history, stats

  // Fetch history and stats on mount
  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews`);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      alert('Please enter some code to analyze');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await axios.post(`${API_URL}/analyze`, {
        code,
        language
      });

      if (response.data.success) {
        setResults(response.data.data);
        fetchHistory();
        fetchStats();
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setResults(null);
  };

  const loadHistoryItem = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/reviews/${id}`);
      if (response.data.success) {
        const review = response.data.data;
        setCode(review.code);
        setLanguage(review.language);
        setResults({
          score: review.score,
          feedback: review.feedback,
          suggestions: review.suggestions,
          errors: review.errors,
          optimizedCode: review.optimizedCode
        });
        setActiveTab('review');
      }
    } catch (error) {
      console.error('Failed to load review:', error);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="App">
      <header className="header animated-bg">
        <h1><FaCode /> AI Code Review System</h1>
        <p>Get instant AI-powered feedback on your code</p>
      </header>

      {/* Tab Navigation */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          className={`btn ${activeTab === 'review' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('review')}
          style={{ margin: '0 10px' }}
        >
          <FaCode /> Code Review
        </button>
        <button 
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('history')}
          style={{ margin: '0 10px' }}
        >
          <FaHistory /> History
        </button>
        <button 
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('stats')}
          style={{ margin: '0 10px' }}
        >
          <FaChartLine /> Statistics
        </button>
      </div>

      {/* Review Tab */}
      {activeTab === 'review' && (
        <div className="container">
          {/* Left Panel - Input */}
          <div className="card">
            <h2><FaCode /> Enter Your Code</h2>
            
            <div className="form-group">
              <label>Programming Language</label>
              <select 
                className="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="typescript">TypeScript</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
              </select>
            </div>

            <div className="form-group">
              <label>Code</label>
              <textarea
                className="code-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-primary"
                onClick={handleAnalyze}
                disabled={loading}
              >
                <FaRocket /> {loading ? 'Analyzing...' : 'Analyze Code'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="card">
            <h2><FaCheckCircle /> Analysis Results</h2>
            
            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Analyzing your code with AI...</p>
              </div>
            )}

            {!loading && !results && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                <FaCode size={80} style={{ marginBottom: '20px', opacity: 0.3 }} />
                <p>Enter your code and click "Analyze Code" to get started!</p>
              </div>
            )}

            {!loading && results && (
              <div className="results">
                {/* Score */}
                <div style={{ textAlign: 'center' }}>
                  <div className={`score-badge ${getScoreClass(results.score)}`}>
                    {results.score}/100
                  </div>
                  <h3 style={{ color: '#667eea' }}>{getScoreLabel(results.score)}</h3>
                </div>

                {/* Feedback */}
                <div className="feedback-section">
                  <h3 style={{ color: '#667eea', marginBottom: '10px' }}>
                    <FaLightbulb /> Feedback
                  </h3>
                  <p>{results.feedback}</p>
                </div>

                {/* Errors */}
                <div className="list-section">
                  <h3><FaExclamationTriangle /> Errors & Issues</h3>
                  {results.errors && results.errors.length > 0 ? (
                    results.errors.map((error, index) => (
                      <div key={index} className="error-item">
                        <FaExclamationTriangle style={{ color: '#ee0979', flexShrink: 0, marginTop: '3px' }} />
                        <span>{error}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-issues-message">
                      <p style={{ color: '#11998e', padding: '15px', textAlign: 'center', background: '#11998e15', borderRadius: '10px' }}>
                        ✅ No critical errors detected! Your code looks good.
                      </p>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                <div className="list-section">
                  <h3><FaLightbulb /> Suggestions for Improvement</h3>
                  {results.suggestions && results.suggestions.length > 0 ? (
                    results.suggestions.map((suggestion, index) => (
                      <div key={index} className="suggestion-item">
                        <FaLightbulb style={{ color: '#4facfe', flexShrink: 0, marginTop: '3px' }} />
                        <span>{suggestion}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-suggestions-message">
                      <p style={{ color: '#667eea', padding: '15px', textAlign: 'center', background: '#667eea15', borderRadius: '10px' }}>
                        💡 Your code follows best practices well!
                      </p>
                    </div>
                  )}
                </div>

                {/* Optimized Code */}
                <div className="list-section">
                  <h3><FaRocket /> Optimized Code</h3>
                  {results.optimizedCode && results.optimizedCode.trim() && results.optimizedCode !== code ? (
                    <div className="code-block">
                      <pre>{results.optimizedCode}</pre>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => {
                          navigator.clipboard.writeText(results.optimizedCode);
                          alert('Optimized code copied to clipboard!');
                        }}
                        style={{ marginTop: '10px', width: '100%' }}
                      >
                        📋 Copy Optimized Code
                      </button>
                    </div>
                  ) : (
                    <div className="no-optimization-message">
                      <p style={{ color: '#667eea', padding: '15px', textAlign: 'center', background: '#667eea15', borderRadius: '10px' }}>
                        🎯 Your code is already well-optimized!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="container">
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2><FaHistory /> Review History</h2>
            
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                <FaHistory size={80} style={{ marginBottom: '20px', opacity: 0.3 }} />
                <p>No reviews yet. Start analyzing code to build your history!</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div 
                    key={item._id} 
                    className="history-item"
                    onClick={() => loadHistoryItem(item._id)}
                  >
                    <div className="history-item-header">
                      <span className="history-language">{item.language}</span>
                      <span className={`history-score ${getScoreClass(item.score)}`}>
                        {item.score}/100
                      </span>
                    </div>
                    <p>{item.feedback.substring(0, 100)}...</p>
                    <div className="history-date">{formatDate(item.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="container">
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2><FaChartLine /> Statistics Dashboard</h2>
            
            {stats && (
              <>
                <div className="stats-grid">
                  <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3>{stats.totalReviews}</h3>
                    <p>Total Reviews</p>
                  </div>
                  <div className="stat-card" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                    <h3>{Math.round(stats.averageScore)}</h3>
                    <p>Average Score</p>
                  </div>
                  <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <h3>{stats.languageStats.length}</h3>
                    <p>Languages Used</p>
                  </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                  <h3 style={{ color: '#667eea', marginBottom: '15px' }}>Languages Breakdown</h3>
                  {stats.languageStats.map((lang, index) => (
                    <div key={index} style={{ 
                      padding: '15px', 
                      margin: '10px 0', 
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{lang._id}</span>
                      <span style={{ 
                        background: '#667eea', 
                        color: 'white', 
                        padding: '5px 15px', 
                        borderRadius: '20px',
                        fontWeight: 'bold'
                      }}>
                        {lang.count} reviews
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;