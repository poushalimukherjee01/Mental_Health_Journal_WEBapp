// IndexedDB wrapper for offline-first data storage
class JournalDB {
    constructor() {
        this.dbName = 'MentalHealthJournal';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Entries store
                if (!db.objectStoreNames.contains('entries')) {
                    const entriesStore = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
                    entriesStore.createIndex('date', 'date', { unique: false });
                    entriesStore.createIndex('mood', 'mood', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async addEntry(entry) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['entries'], 'readwrite');
        const store = transaction.objectStore('entries');
        
        const entryData = {
            ...entry,
            date: entry.date || new Date().toISOString(),
            id: entry.id || Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(entryData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getEntries(limit = 10) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['entries'], 'readonly');
        const store = transaction.objectStore('entries');
        const index = store.index('date');

        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const entries = [];
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    entries.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(entries);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getAllEntries() {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['entries'], 'readonly');
        const store = transaction.objectStore('entries');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getEntriesByDateRange(startDate, endDate) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['entries'], 'readonly');
        const store = transaction.objectStore('entries');
        const index = store.index('date');

        return new Promise((resolve, reject) => {
            const range = IDBKeyRange.bound(startDate, endDate);
            const request = index.getAll(range);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteEntry(id) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['entries'], 'readwrite');
        const store = transaction.objectStore('entries');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllEntries() {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['entries'], 'readwrite');
        const store = transaction.objectStore('entries');

        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSetting(key) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => reject(request.error);
        });
    }

    async setSetting(key, value) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async exportData() {
        const entries = await this.getAllEntries();
        const settings = {};
        
        // Export settings
        const settingsKeys = ['notificationsEnabled', 'reminderTime'];
        for (const key of settingsKeys) {
            settings[key] = await this.getSetting(key);
        }

        return {
            entries,
            settings,
            exportDate: new Date().toISOString()
        };
    }
}