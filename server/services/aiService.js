// AI Service for Code Review using Claude API
const analyzeCode = async (code, language) => {
  try {
    // Construct the prompt for Claude
    const prompt = `You are an expert code reviewer. Analyze the following ${language} code and provide a comprehensive review.

Code to review:
\`\`\`${language}
${code}
\`\`\`

IMPORTANT INSTRUCTIONS:
1. Give a quality score from 0-100 based on:
   - Code structure and organization
   - Best practices adherence
   - Readability and maintainability
   - Performance considerations
   - Error handling

2. Provide detailed feedback on the overall code quality

3. List specific suggestions for improvement (at least 2-3, even for good code)

4. List errors or potential bugs. If no critical errors, mention potential improvements as warnings

5. Provide an optimized version of the code with improvements applied. ALWAYS provide this even if the original code is good - show what "perfect" would look like

Respond ONLY in JSON format with this EXACT structure (no markdown, no extra text):
{
  "score": <number between 0-100>,
  "feedback": "<detailed paragraph about code quality>",
  "suggestions": ["<specific suggestion 1>", "<specific suggestion 2>", "<suggestion 3>"],
  "errors": ["<error or warning 1>", "<error or warning 2>"],
  "optimizedCode": "<complete optimized code here>"
}

CRITICAL: 
- The "suggestions" array must have at least 2 items
- The "errors" array should list issues or potential improvements (can be warnings if no errors)
- The "optimizedCode" MUST be different from the input and show improvements
- Return ONLY valid JSON, no markdown formatting`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content.trim();
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the actual JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const result = JSON.parse(jsonStr);
    
    // Ensure all required fields exist with defaults
    return {
      score: result.score || 50,
      feedback: result.feedback || 'Analysis completed',
      suggestions: Array.isArray(result.suggestions) && result.suggestions.length > 0 
        ? result.suggestions 
        : ['Consider adding comments for complex logic', 'Review for potential edge cases'],
      errors: Array.isArray(result.errors) && result.errors.length > 0 
        ? result.errors 
        : ['No critical errors found'],
      optimizedCode: result.optimizedCode || code
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    // Fallback to basic analysis if API fails
    return getFallbackAnalysis(code, language);
  }
};

// Fallback analysis when API is unavailable
const getFallbackAnalysis = (code, language) => {
  const lines = code.split('\n').length;
  const hasComments = code.includes('//') || code.includes('/*') || code.includes('#');
  const codeLength = code.length;
  
  let score = 50;
  const suggestions = [];
  const errors = [];
  let optimizedCode = code;
  
  // Basic heuristics
  if (hasComments) score += 10;
  if (lines < 100) score += 10;
  if (codeLength < 1000) score += 5;
  
  // Always provide suggestions
  if (!hasComments) {
    suggestions.push('Add comments to explain complex logic and improve code maintainability');
  } else {
    suggestions.push('Good use of comments. Consider adding more detailed documentation');
  }
  
  if (lines > 200) {
    suggestions.push('Consider breaking down into smaller functions/modules for better maintainability');
  } else {
    suggestions.push('Consider extracting reusable logic into separate functions');
  }
  
  suggestions.push('Add error handling with try-catch blocks where appropriate');
  suggestions.push('Consider adding unit tests to verify functionality');
  
  // Check for common issues based on language
  if (language === 'javascript' || language === 'typescript') {
    if (code.includes('var ')) {
      errors.push('Use "let" or "const" instead of "var" for better scoping');
      score -= 5;
      optimizedCode = code.replace(/var /g, 'const ');
    } else {
      errors.push('Consider using more const declarations for immutability');
    }
    
    if (!code.includes('===') && code.includes('==')) {
      errors.push('Use strict equality (===) instead of loose equality (==)');
      score -= 5;
      optimizedCode = optimizedCode.replace(/==/g, '===').replace(/!=/g, '!==');
    }
    
    if (!code.includes('async') && !code.includes('Promise')) {
      errors.push('Consider using async/await for better asynchronous code handling');
    }
  } else if (language === 'python') {
    if (!code.includes('def ') && !code.includes('class ')) {
      errors.push('Consider organizing code into functions or classes');
    }
    if (!code.includes('"""') && !code.includes("'''")) {
      errors.push('Add docstrings to document functions and classes');
    }
  }
  
  // Always have at least one error/warning
  if (errors.length === 0) {
    errors.push('No critical errors found. Consider reviewing for edge cases and error handling');
  }
  
  if (!code.trim()) {
    errors.push('Code is empty');
    score = 0;
    suggestions.splice(0, suggestions.length);
    suggestions.push('Please provide code to analyze');
  }
  
  // Create optimized version if we haven't already
  if (optimizedCode === code && code.trim()) {
    optimizedCode = `// Optimized version with best practices\n${code}\n\n// TODO: Add error handling\n// TODO: Add input validation\n// TODO: Add unit tests`;
  }
  
  return {
    score: Math.min(100, Math.max(0, score)),
    feedback: `Fallback analysis: Your code has ${lines} lines and ${codeLength} characters. ${hasComments ? 'Good use of comments.' : 'Consider adding more comments.'} Score: ${score}/100. Note: This is a basic analysis. Connect to the Claude API for detailed AI-powered review.`,
    suggestions: suggestions,
    errors: errors,
    optimizedCode: optimizedCode
  };
};

module.exports = { analyzeCode };