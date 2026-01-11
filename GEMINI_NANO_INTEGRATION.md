# Gemini Nano API Integration Guide

This guide explains how to integrate Google's Gemini Nano API into your Mental Health Journal web application.

## Overview

Gemini Nano is Google's on-device AI model that runs directly in Chrome browsers (version 140+). It provides AI capabilities like summarization, rewriting, and custom prompts without sending data to external servers, ensuring privacy for sensitive mental health data.

## Requirements

- **Chrome Browser**: Version 140 or later
- **Operating System**: Windows, macOS, or Linux (with supported hardware)
- **Storage**: At least 22 GB free space (for model download)
- **Hardware**: Compatible device with sufficient RAM

## Available APIs

Chrome's built-in AI APIs powered by Gemini Nano include:

1. **Summarizer API** - Summarize text content
2. **Prompt API** - Custom natural language prompts
3. **Writer API** - Generate text content
4. **Rewriter API** - Rewrite text content
5. **Proofreader API** - Check and correct text

## Integration Steps

### Step 1: Check API Availability

Before using the APIs, check if they're available in the user's browser:

```javascript
// Check if AI APIs are available
if ('ai' in window && window.ai) {
    // APIs are available
    console.log('Gemini Nano APIs are available');
} else {
    // Fallback to your existing sentiment analysis
    console.log('Using fallback sentiment analysis');
}
```

### Step 2: Create a Gemini Nano Helper Class

Create a new file `gemini-nano.js`:

```javascript
class GeminiNanoHelper {
    constructor() {
        this.isAvailable = 'ai' in window && window.ai;
    }

    async analyzeSentiment(text) {
        if (!this.isAvailable) {
            return null; // Fallback to regular sentiment analysis
        }

        try {
            // Use Prompt API for sentiment analysis
            const prompt = `Analyze the sentiment of this journal entry and return a JSON object with:
            - sentiment: "positive", "negative", or "neutral"
            - score: number from -100 to 100
            - stressLevel: number from 0 to 100
            - mood: "very-happy", "happy", "neutral", "sad", or "very-sad"
            
            Text: "${text}"`;
            
            const result = await window.ai.prompt(prompt);
            return JSON.parse(result);
        } catch (error) {
            console.error('Gemini Nano error:', error);
            return null; // Fallback
        }
    }

    async summarizeEntry(text) {
        if (!this.isAvailable) {
            return null;
        }

        try {
            const summary = await window.ai.summarize(text);
            return summary;
        } catch (error) {
            console.error('Summarization error:', error);
            return null;
        }
    }

    async suggestImprovements(text) {
        if (!this.isAvailable) {
            return null;
        }

        try {
            const prompt = `As a mental health journal entry, suggest 2-3 brief, supportive improvements or reflections. Be empathetic and encouraging. Text: "${text}"`;
            const suggestions = await window.ai.prompt(prompt);
            return suggestions;
        } catch (error) {
            console.error('Suggestion error:', error);
            return null;
        }
    }
}

// Create global instance
const geminiNano = new GeminiNanoHelper();
```

### Step 3: Update Your Sentiment Analyzer

Modify `sentiment.js` to use Gemini Nano when available:

```javascript
class SentimentAnalyzer {
    constructor() {
        // ... existing code ...
        this.geminiNano = geminiNano; // Reference to Gemini Nano helper
    }

    async analyzeMood(text, userMood = null) {
        // Try Gemini Nano first if available
        if (this.geminiNano.isAvailable) {
            const aiAnalysis = await this.geminiNano.analyzeSentiment(text);
            if (aiAnalysis) {
                return {
                    ...aiAnalysis,
                    mood: userMood || aiAnalysis.mood
                };
            }
        }

        // Fallback to existing analysis
        const analysis = this.analyze(text);
        
        if (userMood) {
            return {
                ...analysis,
                mood: userMood
            };
        }
        
        // ... rest of existing code ...
    }
}
```

### Step 4: Update HTML

Add the new script to `index.html`:

```html
<script src="gemini-nano.js"></script>
<script src="db.js"></script>
<script src="sentiment.js"></script>
<!-- ... other scripts ... -->
```

### Step 5: Update app.js

Modify the `saveEntry` method in `app.js` to use async sentiment analysis:

```javascript
async saveEntry() {
    const text = document.getElementById('journalEntry').value.trim();
    if (!text) {
        alert('Please enter some text before saving.');
        return;
    }

    // Analyze sentiment (now async if using Gemini Nano)
    const analysis = await this.sentimentAnalyzer.analyzeMood(text, this.currentMood);

    const entry = {
        text,
        mood: analysis.mood,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
        stressLevel: analysis.stressLevel,
        date: new Date().toISOString()
    };

    // ... rest of existing code ...
}
```

## Example Use Cases

### 1. Enhanced Sentiment Analysis

Gemini Nano can provide more nuanced sentiment analysis compared to keyword-based approaches:

```javascript
const analysis = await geminiNano.analyzeSentiment(journalEntryText);
```

### 2. Summarize Long Entries

Generate summaries for longer journal entries:

```javascript
const summary = await geminiNano.summarizeEntry(longJournalEntry);
```

### 3. Suggest Improvements

Get supportive suggestions for journal entries:

```javascript
const suggestions = await geminiNano.suggestImprovements(journalEntryText);
```

### 4. Proofread Entries

Check entries for spelling and grammar:

```javascript
if (window.ai && window.ai.proofread) {
    const corrected = await window.ai.proofread(journalEntryText);
}
```

## Error Handling

Always implement fallback behavior since Gemini Nano may not be available:

```javascript
async analyzeWithFallback(text) {
    try {
        if (geminiNano.isAvailable) {
            const result = await geminiNano.analyzeSentiment(text);
            if (result) return result;
        }
    } catch (error) {
        console.warn('Gemini Nano failed, using fallback:', error);
    }
    
    // Fallback to existing sentiment analysis
    return sentimentAnalyzer.analyze(text);
}
```

## Privacy Considerations

- Gemini Nano runs **on-device**, so your journal entries never leave your computer
- No data is sent to Google's servers
- All processing happens locally in your browser
- This makes it ideal for sensitive mental health data

## Testing

1. **Check Availability**: Open browser console and check `'ai' in window`
2. **Test APIs**: Try calling the APIs and handle errors gracefully
3. **Fallback Testing**: Test with browsers that don't support Gemini Nano
4. **Performance**: Monitor response times (on-device processing may be slower)

## Limitations

- Only available in Chrome 140+
- Requires significant storage space (22GB+)
- May have slower response times compared to cloud APIs
- Limited to English, Spanish, and Japanese (as of Chrome 140)
- Requires compatible hardware

## Resources

- [Chrome AI APIs Documentation](https://developer.chrome.com/docs/ai/get-started)
- [Gemini Nano Overview](https://developer.chrome.com/docs/ai/)
- [API Reference](https://developer.chrome.com/docs/ai/api-reference)

## Next Steps

1. Create the `gemini-nano.js` file with the helper class
2. Update `sentiment.js` to use Gemini Nano when available
3. Add the script to `index.html`
4. Test in Chrome 140+ browser
5. Implement graceful fallbacks for unsupported browsers
