// OneSignal Push Notification Integration
// Replace 'YOUR_ONESIGNAL_APP_ID' with your actual OneSignal App ID

class OneSignalHelper {
    constructor() {
        this.isInitialized = false;
        this.appId = 'YOUR_ONESIGNAL_APP_ID'; // Replace with your OneSignal App ID
    }

    async init() {
        if (typeof OneSignal === 'undefined') {
            console.warn('OneSignal SDK not loaded');
            return false;
        }

        try {
            await OneSignal.init({
                appId: this.appId,
                notifyButton: {
                    enable: false, // We'll use custom notification button
                },
                allowLocalhostAsSecureOrigin: true
            });

            // Request notification permission
            const permission = await OneSignal.Notifications.requestPermission();
            this.isInitialized = permission === 'granted';
            
            if (this.isInitialized) {
                console.log('OneSignal initialized successfully');
            }
            
            return this.isInitialized;
        } catch (error) {
            console.error('OneSignal initialization error:', error);
            return false;
        }
    }

    async sendNotification(title, message, url = '/') {
        if (!this.isInitialized) {
            console.warn('OneSignal not initialized');
            return false;
        }

        try {
            // For self notifications, you'll need to use OneSignal's REST API
            // This is a placeholder - actual implementation requires server-side code
            console.log('Notification:', title, message);
            return true;
        } catch (error) {
            console.error('Send notification error:', error);
            return false;
        }
    }

    async setUserId(userId) {
        if (!this.isInitialized) return;
        
        try {
            await OneSignal.User.setExternalUserId(userId);
        } catch (error) {
            console.error('Set user ID error:', error);
        }
    }

    async getUserId() {
        if (!this.isInitialized) return null;
        
        try {
            const userId = await OneSignal.User.getOnesignalId();
            return userId;
        } catch (error) {
            console.error('Get user ID error:', error);
            return null;
        }
    }
}

// Create global instance
const oneSignalHelper = new OneSignalHelper();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        oneSignalHelper.init();
    });
} else {
    oneSignalHelper.init();
}
