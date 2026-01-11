// Gemini Nano API Integration for Mental Health Journal
// Chrome 140+ built-in AI APIs powered by Gemini Nano

class GeminiNanoHelper {
    constructor() {
        this.isAvailable = this.checkAvailability();
    }

    checkAvailability() {
        // Check if Chrome's built-in AI APIs are available
        return 'ai' in window && window.ai !== undefined;
    }

    async analyzeSentiment(text) {
        if (!this.isAvailable) {
            return null;
        }

        try {
            // Use Prompt API for sentiment analysis
            const prompt = `Analyze this mental health journal entry and return ONLY a valid JSON object with these exact fields:
            {
                "sentiment": "positive" or "negative" or "neutral",
                "score": number between -100 and 100,
                "stressLevel": number between 0 and 100,
                "mood": "very-happy" or "happy" or "neutral" or "sad" or "very-sad"
            }
            
            Text: "${text.substring(0, 1000)}"`;
            
            if (window.ai.prompt) {
                const result = await window.ai.prompt(prompt);
                try {
                    // Try to parse JSON from the response
                    const jsonMatch = result.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                } catch (parseError) {
                    console.warn('Failed to parse Gemini Nano response:', parseError);
                }
            }
        } catch (error) {
            console.error('Gemini Nano sentiment analysis error:', error);
        }
        return null;
    }

    async summarizeEntry(text) {
        if (!this.isAvailable || !window.ai.summarize) {
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
        if (!this.isAvailable || !window.ai.prompt) {
            return null;
        }

        try {
            const prompt = `As a supportive mental health assistant, suggest 2-3 brief, empathetic improvements or reflections for this journal entry. Keep it encouraging and under 100 words. Text: "${text.substring(0, 500)}"`;
            const suggestions = await window.ai.prompt(prompt);
            return suggestions;
        } catch (error) {
            console.error('Suggestion error:', error);
            return null;
        }
    }

    async enhanceStressAnalysis(text) {
        if (!this.isAvailable || !window.ai.prompt) {
            return null;
        }

        try {
            const prompt = `Analyze the stress level in this text and return ONLY a number between 0 and 100. Text: "${text.substring(0, 500)}"`;
            const result = await window.ai.prompt(prompt);
            const stressMatch = result.match(/\d+/);
            if (stressMatch) {
                return Math.min(100, Math.max(0, parseInt(stressMatch[0])));
            }
        } catch (error) {
            console.error('Stress analysis error:', error);
        }
        return null;
    }

    async getAdvice(userQuestion, context = '') {
        if (!this.isAvailable || !window.ai.prompt) {
            return null;
        }

        try {
            const prompt = `You are a supportive mental health advisor. Provide empathetic, practical, and helpful advice for this question or concern. Be encouraging, non-judgmental, and suggest actionable steps when appropriate. Keep your response under 300 words and focus on supportive guidance.

Question/Concern: "${userQuestion}"
${context ? `Context: "${context}"` : ''}

Please provide helpful, supportive advice:`;
            
            const advice = await window.ai.prompt(prompt);
            return advice;
        } catch (error) {
            console.error('Advice generation error:', error);
            return null;
        }
    }

    detectExtremeDistress(text) {
        // Detect extremely high distress indicators
        const extremeDistressKeywords = [
            'suicide', 'kill myself', 'end my life', 'want to die', 'don\'t want to live',
            'harm myself', 'self harm', 'cutting', 'overdose', 'no way out',
            'hopeless', 'desperate', 'cannot go on', 'nothing matters', 'give up'
        ];
        
        const lowerText = text.toLowerCase();
        return extremeDistressKeywords.some(keyword => lowerText.includes(keyword));
    }
}

// Create global instance
const geminiNano = new GeminiNanoHelper();
