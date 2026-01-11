// Chart management for mood and stress trends
class ChartManager {
    constructor() {
        this.moodChart = null;
        this.stressChart = null;
    }

    initMoodChart(ctx, entries) {
        if (this.moodChart) {
            this.moodChart.destroy();
        }

        const last30Days = this.getLast30DaysData(entries);

        this.moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last30Days.map(d => d.label),
                datasets: [{
                    label: 'Mood (1-5)',
                    data: last30Days.map(d => d.avgMood),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function (value) {
                                const moods = ['', '😢', '😔', '😐', '🙂', '😊'];
                                return moods[value] || value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const moods = ['', 'Struggling', 'Down', 'Okay', 'Good', 'Great'];
                                return `Mood: ${moods[context.parsed.y]} (${context.parsed.y})`;
                            }
                        }
                    }
                }
            }
        });
    }

    initStressChart(ctx, entries) {
    if (this.stressChart) {
        this.stressChart.destroy();
    }

    const last30Days = this.getLast30DaysData(entries);

    this.stressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last30Days.map(d => d.label),
            datasets: [{
                label: 'Stress Level (1-10)',
                data: last30Days.map(d => d.avgStress),
                backgroundColor: last30Days.map(d => {
                    const stress = d.avgStress;
                    if (stress <= 3) return '#10b981'; // Green
                    if (stress <= 6) return '#f59e0b'; // Yellow
                    return '#ef4444'; // Red
                }),
                borderColor: '#64748b',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
    }

    getLast30DaysData(entries) {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === date.getTime();
        });

        let avgMood = null;
        let avgStress = null;

        if (dayEntries.length > 0) {
            avgMood = dayEntries.reduce((sum, e) => sum + (e.mood || 3), 0) / dayEntries.length;
            avgStress = dayEntries.reduce((sum, e) => sum + (e.stressLevel || 5), 0) / dayEntries.length;
        }

        days.push({
            date: dateStr,
            label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            avgMood: avgMood,
            avgStress: avgStress,
            entries: dayEntries
        });
    }

    return days;
    }

    updateCharts(entries) {
    const moodCtx = document.getElementById('mood-chart');
    const stressCtx = document.getElementById('stress-chart');

    if (moodCtx) {
        this.initMoodChart(moodCtx, entries);
    }

    if (stressCtx) {
        this.initStressChart(stressCtx, entries);
    }
}

}

// Initialize chart manager
const chartManager = new ChartManager();