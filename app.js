// Main application logic
class MentalHealthJournal {
    constructor() {
        this.db = new JournalDB();
        this.sentimentAnalyzer = sentimentAnalyzer;
        this.recognition = null;
        this.synthesis = null;
        this.isRecording = false;
        this.currentMood = null;
        this.stressGaugeChart = null;
        this.moodChart = null;
        this.reminderInterval = null;
        
        this.init();
    }

    async init() {
        // Initialize database
        await this.db.init();

        // Initialize Web Speech API
        this.initSpeechAPI();

        // Load settings
        await this.loadSettings();

        // Load recent entries
        await this.loadRecentEntries();

        // Load today's timeline
        await this.loadTodayTimeline();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize charts
        this.initStressGauge();
        this.initMoodChart();

        // Setup notifications
        await this.setupNotifications();
    }

    initSpeechAPI() {
        // Speech Recognition (STT)
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('journalEntry').value += ' ' + transcript;
                this.isRecording = false;
                this.updateVoiceButton();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isRecording = false;
                this.updateVoiceButton();
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                this.updateVoiceButton();
            };
        }

        // Speech Synthesis (TTS)
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }

    setupEventListeners() {
        // Voice recording button
        const voiceRecordBtn = document.getElementById('voiceRecordBtn');
        if (voiceRecordBtn) {
            voiceRecordBtn.addEventListener('click', () => this.toggleVoiceRecording());
        }

        // Voice playback button
        const voicePlayBtn = document.getElementById('voicePlayBtn');
        if (voicePlayBtn) {
            voicePlayBtn.addEventListener('click', () => this.readAloud());
        }

        // Save entry button
        const saveEntryBtn = document.getElementById('saveEntryBtn');
        if (saveEntryBtn) {
            saveEntryBtn.addEventListener('click', () => this.saveEntry());
        }

        // Quick mood selector
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMood = e.target.dataset.mood;
                this.updateMoodDisplay(this.currentMood);
            });
        });

        // History modal
        const historyBtn = document.getElementById('historyBtn');
        const historyModal = document.getElementById('historyModal');
        const closeHistoryModal = document.getElementById('closeHistoryModal');
        
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                historyModal.classList.add('active');
                this.updateMoodChart();
            });
        }
        
        if (closeHistoryModal) {
            closeHistoryModal.addEventListener('click', () => {
                historyModal.classList.remove('active');
            });
        }

        // Settings modal
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsModal = document.getElementById('closeSettingsModal');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.classList.add('active');
            });
        }
        
        if (closeSettingsModal) {
            closeSettingsModal.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });
        }

        // Panic button
        const panicBtn = document.getElementById('panicBtn');
        const panicModal = document.getElementById('panicModal');
        const closePanicModal = document.getElementById('closePanicModal');
        const closeEmergencyBtn = document.getElementById('closeEmergencyBtn');
        
        if (panicBtn) {
            panicBtn.addEventListener('click', () => {
                panicModal.classList.add('active');
            });
        }
        
        if (closePanicModal) {
            closePanicModal.addEventListener('click', () => {
                panicModal.classList.remove('active');
            });
        }
        
        if (closeEmergencyBtn) {
            closeEmergencyBtn.addEventListener('click', () => {
                panicModal.classList.remove('active');
            });
        }

        // Get advice button
        const getAdviceBtn = document.getElementById('getAdviceBtn');
        if (getAdviceBtn) {
            getAdviceBtn.addEventListener('click', () => this.getAdvice());
        }

        // Close modals on outside click
        [historyModal, settingsModal, panicModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Chart period buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const period = e.target.dataset.period;
                this.updateMoodChart(period);
            });
        });

        // Export data button
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }

        // Clear data button
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }

        // Notification settings
        const enableNotifications = document.getElementById('enableNotifications');
        if (enableNotifications) {
            enableNotifications.addEventListener('change', async (e) => {
                await this.db.setSetting('notificationsEnabled', e.target.checked);
                if (e.target.checked) {
                    await this.requestNotificationPermission();
                }
            });
        }

        const reminderTime = document.getElementById('reminderTime');
        if (reminderTime) {
            reminderTime.addEventListener('change', async (e) => {
                await this.db.setSetting('reminderTime', e.target.value);
                this.scheduleReminder(e.target.value);
            });
        }

        // Quick check-in mood selector
        document.querySelectorAll('.mood-btn-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mood-btn-small').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.quickCheckinMood = e.target.dataset.mood;
            });
        });

        // Stress slider
        const stressSlider = document.getElementById('stressSlider');
        if (stressSlider) {
            stressSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('stressSliderValue').textContent = `${value}%`;
                this.quickCheckinStress = parseInt(value);
            });
        }

        // Quick check-in button
        const quickCheckinBtn = document.getElementById('quickCheckinBtn');
        if (quickCheckinBtn) {
            quickCheckinBtn.addEventListener('click', () => this.saveQuickCheckin());
        }

        // Initialize quick check-in values
        this.quickCheckinMood = null;
        this.quickCheckinStress = 0;
    }

    toggleVoiceRecording() {
        if (!this.recognition) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
        } else {
            this.recognition.start();
            this.isRecording = true;
        }
        this.updateVoiceButton();
    }

    updateVoiceButton() {
        const voiceRecordBtn = document.getElementById('voiceRecordBtn');
        const voiceStatus = document.getElementById('voiceStatus');
        
        if (this.isRecording) {
            voiceRecordBtn.classList.add('recording');
            voiceStatus.textContent = 'Recording...';
        } else {
            voiceRecordBtn.classList.remove('recording');
            voiceStatus.textContent = '';
        }
    }

    readAloud() {
        const text = document.getElementById('journalEntry').value;
        if (!text || !this.synthesis) {
            alert('Text-to-speech is not supported in your browser.');
            return;
        }

        this.synthesis.cancel(); // Stop any ongoing speech
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        this.synthesis.speak(utterance);
    }

    async saveEntry() {
        const text = document.getElementById('journalEntry').value.trim();
        if (!text) {
            alert('Please enter some text before saving.');
            return;
        }

        // Check for extreme distress before saving
        this.checkForDistress(text);

        // Analyze sentiment and stress (now async to support Gemini Nano)
        const analysis = await this.sentimentAnalyzer.analyzeMood(text, this.currentMood);

        const entry = {
            text,
            mood: analysis.mood,
            sentiment: analysis.sentiment,
            sentimentScore: analysis.score,
            stressLevel: analysis.stressLevel,
            date: new Date().toISOString()
        };

        try {
            await this.db.addEntry(entry);
            document.getElementById('journalEntry').value = '';
            this.currentMood = null;
            document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
            
            // Update UI
            await this.loadRecentEntries();
            await this.loadTodayTimeline();
            this.updateMoodDisplay(entry.mood);
            this.updateStressGauge(entry.stressLevel);
            this.updateMoodChart();
            
            // Show success feedback
            this.showNotification('Entry saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving entry:', error);
            alert('Error saving entry. Please try again.');
        }
    }

    async loadRecentEntries() {
        const entries = await this.db.getEntries(5);
        const entriesList = document.getElementById('entriesList');
        
        if (!entriesList) return;

        if (entries.length === 0) {
            entriesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No entries yet. Start journaling to see your entries here!</p>';
            return;
        }

        entriesList.innerHTML = entries.map(entry => {
            const date = new Date(entry.date);
            const moodEmojis = {
                'very-happy': '😄',
                'happy': '😊',
                'neutral': '😐',
                'sad': '😔',
                'very-sad': '😢'
            };
            
            return `
                <div class="entry-item">
                    <div class="entry-header">
                        <span class="entry-date">${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span class="entry-mood">${moodEmojis[entry.mood] || '😐'}</span>
                    </div>
                    <div class="entry-text">${this.truncateText(entry.text, 150)}</div>
                    <div class="entry-stress">Stress Level: ${entry.stressLevel}%</div>
                </div>
            `;
        }).join('');
    }

    async saveQuickCheckin() {
        if (!this.quickCheckinMood) {
            alert('Please select a mood for your check-in.');
            return;
        }

        const checkin = {
            text: `Quick check-in: ${this.quickCheckinMood}`,
            mood: this.quickCheckinMood,
            sentiment: 'neutral',
            sentimentScore: 0,
            stressLevel: this.quickCheckinStress || 0,
            date: new Date().toISOString(),
            isQuickCheckin: true
        };

        try {
            await this.db.addEntry(checkin);
            
            // Reset UI
            document.querySelectorAll('.mood-btn-small').forEach(btn => btn.classList.remove('active'));
            document.getElementById('stressSlider').value = 0;
            document.getElementById('stressSliderValue').textContent = '0%';
            this.quickCheckinMood = null;
            this.quickCheckinStress = 0;
            
            // Update displays
            await this.loadTodayTimeline();
            this.updateMoodDisplay(checkin.mood);
            this.updateStressGauge(checkin.stressLevel);
            
            this.showNotification('Check-in saved!', 'success');
        } catch (error) {
            console.error('Error saving check-in:', error);
            alert('Error saving check-in. Please try again.');
        }
    }

    async loadTodayTimeline() {
        const timelineContainer = document.getElementById('timelineContainer');
        if (!timelineContainer) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayEntries = await this.db.getEntriesByDateRange(today.toISOString(), tomorrow.toISOString());
        const sortedEntries = todayEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (sortedEntries.length === 0) {
            timelineContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No entries today. Start tracking your mood!</p>';
            return;
        }

        const moodEmojis = {
            'very-happy': '😄',
            'happy': '😊',
            'neutral': '😐',
            'sad': '😔',
            'very-sad': '😢'
        };

        timelineContainer.innerHTML = sortedEntries.map(entry => {
            const date = new Date(entry.date);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isQuickCheckin = entry.isQuickCheckin || false;
            
            return `
                <div class="timeline-item ${isQuickCheckin ? 'quick-checkin' : ''}">
                    <div class="timeline-time">${timeStr}</div>
                    <div class="timeline-content">
                        <div class="timeline-mood">${moodEmojis[entry.mood] || '😐'} ${entry.mood.replace('-', ' ')}</div>
                        ${entry.text && !isQuickCheckin ? `<div class="timeline-text">${this.truncateText(entry.text, 100)}</div>` : ''}
                        <div class="timeline-stress">Stress: ${entry.stressLevel}%</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    updateMoodDisplay(mood) {
        const moodEmojis = {
            'very-happy': { emoji: '😄', label: 'Very Happy' },
            'happy': { emoji: '😊', label: 'Happy' },
            'neutral': { emoji: '😐', label: 'Neutral' },
            'sad': { emoji: '😔', label: 'Sad' },
            'very-sad': { emoji: '😢', label: 'Very Sad' }
        };

        const moodData = moodEmojis[mood] || moodEmojis.neutral;
        document.getElementById('moodEmoji').textContent = moodData.emoji;
        document.getElementById('moodLabel').textContent = moodData.label;

        // Update body class for mood-based styling
        document.body.className = `mood-${mood}`;
    }

    initStressGauge() {
        const canvas = document.getElementById('stressGauge');
        if (!canvas) return;

        canvas.width = 200;
        canvas.height = 100;

        this.updateStressGauge(0);
    }

    updateStressGauge(stressLevel) {
        const canvas = document.getElementById('stressGauge');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height;
        const radius = 90;
        const startAngle = Math.PI;
        const endAngle = 0;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.lineWidth = 20;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // Draw stress level arc
        const stressAngle = startAngle + (endAngle - startAngle) * (stressLevel / 100);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, stressAngle, false);
        ctx.lineWidth = 20;
        
        // Color based on stress level
        let color = '#10b981'; // green
        if (stressLevel > 70) color = '#ef4444'; // red
        else if (stressLevel > 40) color = '#f59e0b'; // orange
        else if (stressLevel > 20) color = '#fbbf24'; // yellow
        
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Update stress value text
        document.getElementById('stressValue').textContent = `${stressLevel}%`;
    }

    initMoodChart() {
        const canvas = document.getElementById('moodChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Set canvas height for better visibility
        canvas.style.height = '400px';
        
        this.moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Mood Score',
                    data: [],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                const moods = ['Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
                                return moods[Math.floor(value / 25)];
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    async updateMoodChart(period = 'week') {
        if (!this.moodChart) return;

        const now = new Date();
        let startDate;
        
        if (period === 'week') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const entries = await this.db.getAllEntries();
        const filteredEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        const moodScores = {
            'very-sad': 0,
            'sad': 25,
            'neutral': 50,
            'happy': 75,
            'very-happy': 100
        };

        const labels = filteredEntries.map(entry => {
            const date = new Date(entry.date);
            return date.toLocaleDateString();
        });

        const data = filteredEntries.map(entry => moodScores[entry.mood] || 50);

        this.moodChart.data.labels = labels;
        this.moodChart.data.datasets[0].data = data;
        this.moodChart.update();
    }

    async loadSettings() {
        const notificationsEnabled = await this.db.getSetting('notificationsEnabled');
        const reminderTime = await this.db.getSetting('reminderTime');

        const enableNotifications = document.getElementById('enableNotifications');
        const reminderTimeInput = document.getElementById('reminderTime');

        if (enableNotifications && notificationsEnabled !== null) {
            enableNotifications.checked = notificationsEnabled;
        }

        if (reminderTimeInput && reminderTime) {
            reminderTimeInput.value = reminderTime;
        }
    }

    async setupNotifications() {
        if ('Notification' in window) {
            // Check if already granted
            if (Notification.permission === 'granted') {
                const reminderTime = await this.db.getSetting('reminderTime');
                if (reminderTime) {
                    this.scheduleReminder(reminderTime);
                }
            }
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.showNotification('Notifications enabled!', 'success');
            }
        }
    }

    scheduleReminder(time) {
        if (!time || Notification.permission !== 'granted') return;

        // Clear existing reminders
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
        }

        // Parse time and schedule reminder
        const [hours, minutes] = time.split(':').map(Number);
        
        const checkReminder = () => {
            const now = new Date();
            if (now.getHours() === hours && now.getMinutes() === minutes) {
                this.showBrowserNotification('Time to journal! 📝', 'Take a moment to reflect on your day.');
            }
        };

        // Check every minute
        this.reminderInterval = setInterval(checkReminder, 60000);
        checkReminder(); // Initial check
    }

    showBrowserNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '📝',
                tag: 'journal-reminder'
            });
        }
    }

    showNotification(message, type = 'info') {
        // Simple in-app notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#6366f1'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async exportData() {
        try {
            const data = await this.db.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mental-health-journal-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data. Please try again.');
        }
    }

    async clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            return;
        }

        try {
            await this.db.clearAllEntries();
            await this.loadRecentEntries();
            this.updateMoodDisplay('neutral');
            this.updateStressGauge(0);
            this.updateMoodChart();
            this.showNotification('All data cleared.', 'success');
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Error clearing data. Please try again.');
        }
    }

    async getAdvice() {
        const questionInput = document.getElementById('adviceQuestion');
        const adviceResult = document.getElementById('adviceResult');
        const getAdviceBtn = document.getElementById('getAdviceBtn');
        
        if (!questionInput || !adviceResult) return;

        const question = questionInput.value.trim();
        if (!question) {
            alert('Please enter a question or concern.');
            return;
        }

        // Check for extreme distress
        if (typeof geminiNano !== 'undefined' && geminiNano.detectExtremeDistress(question)) {
            // Show panic modal if extreme distress detected
            const panicModal = document.getElementById('panicModal');
            if (panicModal) {
                panicModal.classList.add('active');
            }
            return;
        }

        // Show loading state
        getAdviceBtn.disabled = true;
        getAdviceBtn.textContent = 'Getting Advice...';
        adviceResult.innerHTML = '<div class="advice-loading">Thinking...</div>';

        try {
            // Get recent entries for context
            const recentEntries = await this.db.getEntries(3);
            const context = recentEntries.length > 0 
                ? `Recent mood: ${recentEntries[0].mood}, Stress level: ${recentEntries[0].stressLevel}%`
                : '';

            // Get advice from Gemini Nano if available
            let advice = null;
            if (typeof geminiNano !== 'undefined' && geminiNano.isAvailable) {
                advice = await geminiNano.getAdvice(question, context);
            }

            if (advice) {
                adviceResult.innerHTML = `<div class="advice-content">${advice.replace(/\n/g, '<br>')}</div>`;
            } else {
                // Fallback advice
                adviceResult.innerHTML = `<div class="advice-content">
                    <p><strong>Thank you for sharing.</strong></p>
                    <p>While AI advice isn't available right now, here are some general supportive suggestions:</p>
                    <ul>
                        <li>Consider speaking with a mental health professional</li>
                        <li>Reach out to trusted friends or family members</li>
                        <li>Practice self-care activities that you enjoy</li>
                        <li>Consider journaling your thoughts and feelings</li>
                        <li>Remember that seeking help is a sign of strength</li>
                    </ul>
                    <p><em>Note: For immediate support, use the 🚨 Emergency button in the header.</em></p>
                </div>`;
            }
        } catch (error) {
            console.error('Error getting advice:', error);
            adviceResult.innerHTML = '<div class="advice-error">Sorry, there was an error. Please try again or use the emergency resources.</div>';
        } finally {
            getAdviceBtn.disabled = false;
            getAdviceBtn.textContent = 'Get Advice';
        }
    }

    checkForDistress(entryText) {
        // Check for extreme distress when saving entries
        if (typeof geminiNano !== 'undefined' && geminiNano.detectExtremeDistress(entryText)) {
            const panicModal = document.getElementById('panicModal');
            if (panicModal) {
                setTimeout(() => {
                    panicModal.classList.add('active');
                }, 500);
            }
            return true;
        }
        return false;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MentalHealthJournal();
    });
} else {
    new MentalHealthJournal();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`
document.head.appendChild(style);