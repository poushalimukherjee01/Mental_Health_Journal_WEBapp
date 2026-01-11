// Notification handler for journaling reminders
class NotificationManager {
    constructor() {
        this.permission = Notification.permission;
        this.reminderInterval = null;
        this.mindfulnessInterval = null;
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        }

        return false;
    }

    async showNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            const granted = await this.requestPermission();
            if (!granted) {
                return;
            }
        }

        const notificationOptions = {
            body: options.body || '',
            icon: options.icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: options.tag || 'journal-reminder',
            requireInteraction: options.requireInteraction || false,
            ...options
        };

        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, notificationOptions);
            } catch (error) {
                console.error('Error showing notification:', error);
                new Notification(title, notificationOptions);
            }
        } else {
            new Notification(title, notificationOptions);
        }
    }

    scheduleReminder(time, enabled) {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
        }

        if (!enabled) {
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);

        const checkAndNotify = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            // Check if it's time for the reminder
            if (currentHour === hours && currentMinute === minutes) {
                this.showNotification('Time to Journal! 📝', {
                    body: 'Take a moment to reflect on your day and write in your journal.',
                    tag: 'journal-reminder',
                    requireInteraction: false
                });
            }
        };

        // Check immediately
        checkAndNotify();

        // Check every minute
        this.reminderInterval = setInterval(checkAndNotify, 60000);
    }

    scheduleMindfulnessReminders(enabled) {
        if (this.mindfulnessInterval) {
            clearInterval(this.mindfulnessInterval);
            this.mindfulnessInterval = null;
        }

        if (!enabled) {
            return;
        }

        const mindfulnessMessages = [
            'Take a deep breath. You\'re doing great! 🌸',
            'Remember to be kind to yourself today 💙',
            'Take a moment to appreciate something positive ✨',
            'You\'ve got this! Keep going 💪',
            'It\'s okay to take breaks. Your well-being matters 🧘'
        ];

        // Show mindfulness reminder every 4 hours
        const showMindfulnessReminder = () => {
            const message = mindfulnessMessages[Math.floor(Math.random() * mindfulnessMessages.length)];
            this.showNotification('Mindfulness Reminder 🧘', {
                body: message,
                tag: 'mindfulness-reminder',
                requireInteraction: false
            });
        };

        // Show first reminder after 2 hours
        setTimeout(showMindfulnessReminder, 2 * 60 * 60 * 1000);

        // Then every 4 hours
        this.mindfulnessInterval = setInterval(showMindfulnessReminder, 4 * 60 * 60 * 1000);
    }

    clearAllReminders() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
        }
        if (this.mindfulnessInterval) {
            clearInterval(this.mindfulnessInterval);
            this.mindfulnessInterval = null;
        }
    }
}

// Initialize notification manager
const notificationManager = new NotificationManager();


