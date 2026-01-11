// Sentiment analysis - using a simple local sentiment analysis approach
// This can be enhanced with Gemini Nano API or more sophisticated ML models

class SentimentAnalyzer {
    constructor() {
        // Reference to Gemini Nano if available
        this.geminiNano = typeof geminiNano !== 'undefined' ? geminiNano : null;
        
        // Simple word lists for sentiment analysis
        // In a production app, you might use a more sophisticated model or Gemini Nano
        this.positiveWords = new Set([
            'happy', 'joy', 'great', 'wonderful', 'excited', 'good', 'amazing', 
            'fantastic', 'love', 'loved', 'peaceful', 'calm', 'grateful', 'thankful',
            'blessed', 'hopeful', 'optimistic', 'content', 'satisfied', 'proud',
            'confident', 'energetic', 'motivated', 'inspired', 'relieved', 'relaxed'
        ]);

        this.negativeWords = new Set([
            'sad', 'depressed', 'angry', 'anxious', 'worried', 'stressed', 'tired',
            'exhausted', 'frustrated', 'upset', 'disappointed', 'lonely', 'scared',
            'afraid', 'hurt', 'pain', 'suffering', 'hopeless', 'helpless', 'overwhelmed',
            'nervous', 'panic', 'fear', 'dread', 'terrible', 'awful', 'horrible',
            'miserable', 'unhappy', 'down', 'low', 'empty', 'numb'
        ]);

        this.stressIndicators = new Set([
            'stress', 'stressed', 'pressure', 'overwhelmed', 'burden', 'pressure',
            'deadline', 'rush', 'urgent', 'worry', 'worried', 'anxious', 'anxiety',
            'tense', 'tension', 'pressure', 'strain', 'exhausted', 'drained'
        ]);
    }

    analyze(text) {
        if (!text || text.trim().length === 0) {
            return {
                sentiment: 'neutral',
                score: 0,
                stressLevel: 0
            };
        }

        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);

        let positiveCount = 0;
        let negativeCount = 0;
        let stressCount = 0;

        words.forEach(word => {
            if (this.positiveWords.has(word)) positiveCount++;
            if (this.negativeWords.has(word)) negativeCount++;
            if (this.stressIndicators.has(word)) stressCount++;
        });

        const totalWords = words.length;
        const sentimentScore = (positiveCount - negativeCount) / Math.max(totalWords, 1);
        const stressScore = Math.min((stressCount / Math.max(totalWords, 1)) * 100, 100);

        let sentiment = 'neutral';
        if (sentimentScore > 0.05) sentiment = 'positive';
        else if (sentimentScore < -0.05) sentiment = 'negative';

        return {
            sentiment,
            score: Math.round(sentimentScore * 100),
            stressLevel: Math.round(stressScore)
        };
    }

    // Enhanced analysis with mood mapping (now async to support Gemini Nano)
    async analyzeMood(text, userMood = null) {
        // Try Gemini Nano first if available
        if (this.geminiNano && this.geminiNano.isAvailable && text && text.trim().length > 0) {
            try {
                const aiAnalysis = await this.geminiNano.analyzeSentiment(text);
                if (aiAnalysis && aiAnalysis.mood) {
                    return {
                        sentiment: aiAnalysis.sentiment || 'neutral',
                        score: aiAnalysis.score || 0,
                        stressLevel: aiAnalysis.stressLevel || 0,
                        mood: userMood || aiAnalysis.mood
                    };
                }
            } catch (error) {
                console.warn('Gemini Nano analysis failed, using fallback:', error);
            }
        }

        // Fallback to local analysis
        const analysis = this.analyze(text);
        
        // Use user-selected mood if available, otherwise infer from sentiment
        if (userMood) {
            return {
                ...analysis,
                mood: userMood
            };
        }
        
        // Map sentiment to mood
        let mood = 'neutral';
        if (analysis.sentiment === 'positive') {
            mood = analysis.score > 50 ? 'very-happy' : 'happy';
        } else if (analysis.sentiment === 'negative') {
            mood = analysis.score < -50 ? 'very-sad' : 'sad';
        }
        
        return {
            ...analysis,
            mood: mood
        };
    }
}

// Create global instance
const sentimentAnalyzer = new SentimentAnalyzer();
