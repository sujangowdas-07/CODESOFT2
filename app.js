// Enhanced Vibrant Alarm App with improved functionality
class AlarmApp {
    constructor() {
        this.alarms = [];
        this.currentEditingId = null;
        this.alarmCheckInterval = null;
        this.clockInterval = null;
        this.audioContext = null;
        this.currentAlarmAudio = null;
        this.snoozedAlarms = new Map();
        this.currentTriggeredAlarm = null;
        this.alarmSoundInterval = null;
        this.volumeLevel = 0.7;
        this.isMuted = false;
        this.snoozeCountdownInterval = null;
        this.audioVisualizer = null;
        this.visualizerInterval = null;
        
        // Enhanced app data
        this.ringtones = [
            { name: "Energetic Beep", frequency: 800, type: "beep", pattern: [0.2, 0.1, 0.2, 0.1, 0.5] },
            { name: "Gentle Chime", frequency: 440, type: "chime", pattern: [0.3, 0.2, 0.3, 0.2, 0.4] },
            { name: "Digital Alert", frequency: 1000, type: "digital", pattern: [0.1, 0.05, 0.1, 0.05, 0.1, 0.05, 0.3] },
            { name: "Nature Sounds", frequency: 300, type: "nature", pattern: [0.5, 0.3, 0.5, 0.3, 0.6] },
            { name: "Classic Bell", frequency: 600, type: "bell", pattern: [0.4, 0.2, 0.4, 0.2, 0.5] }
        ];
        
        this.weekDays = [
            { id: 0, short: "S", full: "Sunday", color: "#FF6B6B" },
            { id: 1, short: "M", full: "Monday", color: "#4ECDC4" }, 
            { id: 2, short: "T", full: "Tuesday", color: "#45B7D1" },
            { id: 3, short: "W", full: "Wednesday", color: "#96CEB4" },
            { id: 4, short: "T", full: "Thursday", color: "#FECA57" },
            { id: 5, short: "F", full: "Friday", color: "#FF9FF3" },
            { id: 6, short: "S", full: "Saturday", color: "#54A0FF" }
        ];
        
        this.init();
    }
    
    init() {
        this.loadAlarms();
        this.setupEventListeners();
        this.populateForm();
        this.startClock();
        this.startAlarmChecker();
        this.renderAlarms();
        this.setupAudioContext();
        this.setupAudioVisualizer();
    }
    
    setupEventListeners() {
        // Navigation
        document.getElementById('addAlarmBtn').addEventListener('click', () => {
            this.showSetAlarmScreen();
            this.showToast('Creating new alarm');
        });
        
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showHomeScreen();
            this.showToast('Returning to home');
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Alarm form
        document.getElementById('alarmForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAlarm();
        });
        
        // Modal actions with improved functionality
        document.getElementById('dismissBtn').addEventListener('click', () => {
            this.dismissAlarm();
        });
        
        document.getElementById('snoozeBtn').addEventListener('click', () => {
            this.snoozeAlarm();
        });
        
        // Audio controls
        document.getElementById('volumeControl').addEventListener('input', (e) => {
            this.volumeLevel = parseFloat(e.target.value);
            this.updateVolume();
        });
        
        document.getElementById('muteBtn').addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Close modal when clicking outside
        document.getElementById('alarmModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('alarmModal')) {
                this.dismissAlarm();
            }
        });
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }
    
    setupAudioVisualizer() {
        const canvas = document.getElementById('audioVisualizer');
        this.audioVisualizer = canvas.getContext('2d');
    }
    
    populateForm() {
        // Populate ringtone select with enhanced options
        const ringtoneSelect = document.getElementById('ringtoneSelect');
        ringtoneSelect.innerHTML = '';
        this.ringtones.forEach(ringtone => {
            const option = document.createElement('option');
            option.value = ringtone.name;
            option.textContent = ringtone.name;
            ringtoneSelect.appendChild(option);
        });
        
        // Populate day selector with colors
        const daySelector = document.getElementById('daySelector');
        daySelector.innerHTML = '';
        this.weekDays.forEach(day => {
            const chip = document.createElement('div');
            chip.className = 'day-chip';
            chip.textContent = day.short;
            chip.dataset.dayId = day.id;
            chip.style.borderColor = day.color;
            chip.addEventListener('click', () => this.toggleDay(chip));
            daySelector.appendChild(chip);
        });
    }
    
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const dateString = now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            });
            
            document.getElementById('currentTime').textContent = timeString;
            document.getElementById('currentDate').textContent = dateString;
            
            // Update background based on time of day
            this.updateTimeBasedBackground(now);
        };
        
        updateClock();
        this.clockInterval = setInterval(updateClock, 1000);
    }
    
    updateTimeBasedBackground(now) {
        const hour = now.getHours();
        const body = document.body;
        
        if (hour >= 5 && hour < 12) {
            // Morning
            body.style.background = 'linear-gradient(135deg, #FFD93D 0%, #6BCF7F 50%, #667eea 100%)';
        } else if (hour >= 12 && hour < 17) {
            // Afternoon  
            body.style.background = 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #f093fb 100%)';
        } else if (hour >= 17 && hour < 21) {
            // Evening
            body.style.background = 'linear-gradient(135deg, #4834d4 0%, #686de0 50%, #764ba2 100%)';
        } else {
            // Night
            body.style.background = 'linear-gradient(135deg, #2c2c54 0%, #40407a 50%, #34495e 100%)';
        }
        body.style.backgroundSize = '400% 400%';
    }
    
    startAlarmChecker() {
        const checkAlarms = () => {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                              now.getMinutes().toString().padStart(2, '0');
            const currentDay = now.getDay();
            const currentSeconds = now.getSeconds();
            
            // Only check at the start of each minute to avoid multiple triggers
            if (currentSeconds !== 0) return;
            
            this.alarms.forEach(alarm => {
                if (!alarm.enabled) return;
                
                // Check if it's time for this alarm
                if (alarm.time === currentTime) {
                    // Check if it should repeat on this day or if it's a one-time alarm
                    if (alarm.repeat.length === 0 || alarm.repeat.includes(currentDay)) {
                        // Prevent multiple triggers of the same alarm
                        if (!this.currentTriggeredAlarm || this.currentTriggeredAlarm.id !== alarm.id) {
                            this.triggerAlarm(alarm);
                        }
                    }
                }
            });
            
            // Check snoozed alarms
            this.snoozedAlarms.forEach((snoozeTime, alarmId) => {
                if (now >= snoozeTime) {
                    const alarm = this.alarms.find(a => a.id === alarmId);
                    if (alarm) {
                        this.triggerAlarm(alarm);
                        this.snoozedAlarms.delete(alarmId);
                    }
                }
            });
        };
        
        this.alarmCheckInterval = setInterval(checkAlarms, 1000);
    }
    
    toggleDay(chip) {
        chip.classList.toggle('selected');
        const dayId = parseInt(chip.dataset.dayId);
        const dayColor = this.weekDays[dayId].color;
        
        if (chip.classList.contains('selected')) {
            chip.style.background = `linear-gradient(135deg, ${dayColor}, ${dayColor}90)`;
            chip.style.transform = 'scale(1.1)';
            chip.style.boxShadow = `0 0 20px ${dayColor}50`;
        } else {
            chip.style.background = '';
            chip.style.transform = '';
            chip.style.boxShadow = '';
        }
    }
    
    showSetAlarmScreen(alarmId = null) {
        this.currentEditingId = alarmId;
        
        // Clear form first
        this.resetForm();
        
        if (alarmId) {
            const alarm = this.alarms.find(a => a.id === alarmId);
            if (alarm) {
                document.getElementById('alarmTime').value = alarm.time;
                document.getElementById('alarmLabel').value = alarm.label;
                document.getElementById('ringtoneSelect').value = alarm.ringtone;
                document.getElementById('vibrateToggle').checked = alarm.vibrate;
                
                // Set selected days
                document.querySelectorAll('.day-chip').forEach(chip => {
                    chip.classList.remove('selected');
                    if (alarm.repeat.includes(parseInt(chip.dataset.dayId))) {
                        chip.classList.add('selected');
                        this.toggleDay(chip);
                    }
                });
            }
        }
        
        document.getElementById('homeScreen').classList.remove('active');
        document.getElementById('setAlarmScreen').classList.add('active');
    }
    
    resetForm() {
        const form = document.getElementById('alarmForm');
        form.reset();
        
        // Clear day selections
        document.querySelectorAll('.day-chip').forEach(chip => {
            chip.classList.remove('selected');
            chip.style.background = '';
            chip.style.transform = '';
            chip.style.boxShadow = '';
        });
        
        // Set default time if creating new alarm
        if (!this.currentEditingId) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1);
            const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                             now.getMinutes().toString().padStart(2, '0');
            document.getElementById('alarmTime').value = timeString;
        }
        
        // Set default ringtone
        document.getElementById('ringtoneSelect').value = this.ringtones[0].name;
    }
    
    showHomeScreen() {
        document.getElementById('setAlarmScreen').classList.remove('active');
        document.getElementById('homeScreen').classList.add('active');
        this.currentEditingId = null;
    }
    
    saveAlarm() {
        const timeInput = document.getElementById('alarmTime');
        const time = timeInput.value;
        const label = document.getElementById('alarmLabel').value || 'Alarm';
        const ringtone = document.getElementById('ringtoneSelect').value;
        const vibrate = document.getElementById('vibrateToggle').checked;
        
        // Get selected days
        const selectedDays = [];
        document.querySelectorAll('.day-chip.selected').forEach(chip => {
            selectedDays.push(parseInt(chip.dataset.dayId));
        });
        
        if (!time) {
            alert('Please select a time for the alarm');
            timeInput.focus();
            return;
        }
        
        const alarm = {
            id: this.currentEditingId || Date.now(),
            time,
            label,
            enabled: true,
            repeat: selectedDays,
            ringtone,
            vibrate,
            color: this.getRandomAlarmColor()
        };
        
        if (this.currentEditingId) {
            // Update existing alarm
            const index = this.alarms.findIndex(a => a.id === this.currentEditingId);
            if (index !== -1) {
                this.alarms[index] = alarm;
                this.showToast('Alarm updated successfully!');
            }
        } else {
            // Add new alarm
            this.alarms.push(alarm);
            this.showToast('Alarm created successfully!');
        }
        
        this.saveAlarms();
        this.renderAlarms();
        this.showHomeScreen();
    }
    
    getRandomAlarmColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    deleteAlarm(id) {
        if (confirm('Delete this alarm?')) {
            this.alarms = this.alarms.filter(alarm => alarm.id !== id);
            this.saveAlarms();
            this.renderAlarms();
            this.showToast('Alarm deleted');
        }
    }
    
    toggleAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.enabled = !alarm.enabled;
            this.saveAlarms();
            this.renderAlarms();
            this.showToast(alarm.enabled ? 'Alarm enabled' : 'Alarm disabled');
        }
    }
    
    triggerAlarm(alarm) {
        // Prevent multiple triggers of the same alarm
        if (this.currentTriggeredAlarm && this.currentTriggeredAlarm.id === alarm.id) {
            return;
        }
        
        // Store current alarm for dismiss/snooze actions
        this.currentTriggeredAlarm = alarm;
        
        // Show enhanced modal with alarm details
        document.getElementById('triggerTime').textContent = alarm.time;
        document.getElementById('triggerLabel').textContent = alarm.label;
        document.getElementById('triggerRingtone').textContent = `Ringtone: ${alarm.ringtone}`;
        document.getElementById('triggerVibrate').textContent = alarm.vibrate ? 'Vibration: On' : 'Vibration: Off';
        
        const repeatText = alarm.repeat.length === 0 ? 'Once' : 
            alarm.repeat.length === 7 ? 'Every day' :
            alarm.repeat.map(dayId => this.weekDays[dayId].short).join(', ');
        document.getElementById('triggerRepeat').textContent = `Repeat: ${repeatText}`;
        
        // Set volume control to current level
        document.getElementById('volumeControl').value = this.volumeLevel;
        
        // Show modal
        document.getElementById('alarmModal').classList.remove('hidden');
        
        // Play alarm sound with looping
        this.playAlarmSound(alarm.ringtone);
        
        // Start audio visualizer
        this.startAudioVisualizer();
        
        // Vibrate if supported and enabled
        if (alarm.vibrate && 'vibrate' in navigator) {
            this.startVibrationPattern();
        }
    }
    
    playAlarmSound(ringtoneName) {
        if (!this.audioContext) return;
        
        const ringtone = this.ringtones.find(r => r.name === ringtoneName) || this.ringtones[0];
        
        // Clear any existing sound
        this.stopAlarmSound();
        
        const playSound = () => {
            if (!this.currentTriggeredAlarm) return;
            
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const filterNode = this.audioContext.createBiquadFilter();
                
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = ringtone.frequency;
                oscillator.type = ringtone.type === 'digital' ? 'square' : 'sine';
                
                filterNode.type = 'lowpass';
                filterNode.frequency.value = ringtone.frequency * 2;
                
                // Apply volume
                const volume = this.isMuted ? 0 : this.volumeLevel;
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume * 0.5, this.audioContext.currentTime + 0.1);
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.8);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.8);
                
                this.currentAlarmAudio = oscillator;
                
            } catch (error) {
                console.log('Error playing alarm sound:', error);
            }
        };
        
        // Play initial sound
        playSound();
        
        // Loop the sound
        this.alarmSoundInterval = setInterval(() => {
            if (this.currentTriggeredAlarm && !document.getElementById('alarmModal').classList.contains('hidden')) {
                playSound();
            }
        }, 1000);
    }
    
    startVibrationPattern() {
        const vibrate = () => {
            if (this.currentTriggeredAlarm && 'vibrate' in navigator) {
                navigator.vibrate([1000, 500, 1000, 500, 1000]);
                setTimeout(vibrate, 3000);
            }
        };
        vibrate();
    }
    
    startAudioVisualizer() {
        const canvas = document.getElementById('audioVisualizer');
        const ctx = this.audioVisualizer;
        const width = canvas.width;
        const height = canvas.height;
        
        let animationId;
        
        const draw = () => {
            if (!this.currentTriggeredAlarm) {
                cancelAnimationFrame(animationId);
                return;
            }
            
            ctx.clearRect(0, 0, width, height);
            
            // Create animated bars
            const barCount = 20;
            const barWidth = width / barCount;
            
            for (let i = 0; i < barCount; i++) {
                const barHeight = Math.random() * height * 0.8;
                const hue = (i * 18 + Date.now() * 0.1) % 360;
                
                ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
                ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
            }
            
            animationId = requestAnimationFrame(draw);
        };
        
        draw();
    }
    
    dismissAlarm() {
        if (!this.currentTriggeredAlarm) return;
        
        // Hide modal
        document.getElementById('alarmModal').classList.add('hidden');
        
        // Stop all alarm sounds and effects
        this.stopAlarmSound();
        
        // If it's a one-time alarm, disable it
        if (this.currentTriggeredAlarm.repeat.length === 0) {
            this.currentTriggeredAlarm.enabled = false;
            this.saveAlarms();
            this.renderAlarms();
        }
        
        this.currentTriggeredAlarm = null;
        this.showToast('Alarm dismissed');
    }
    
    snoozeAlarm() {
        if (!this.currentTriggeredAlarm) return;
        
        // Hide modal
        document.getElementById('alarmModal').classList.add('hidden');
        
        // Stop all alarm sounds and effects
        this.stopAlarmSound();
        
        // Schedule snooze for 5 minutes later
        const snoozeTime = new Date();
        snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
        this.snoozedAlarms.set(this.currentTriggeredAlarm.id, snoozeTime);
        
        // Show snooze countdown
        this.showSnoozeCountdown(snoozeTime);
        
        this.currentTriggeredAlarm = null;
        this.showToast('Alarm snoozed for 5 minutes');
    }
    
    showSnoozeCountdown(snoozeTime) {
        const countdownElement = document.getElementById('snoozeCountdown');
        countdownElement.classList.remove('hidden');
        
        const updateCountdown = () => {
            const now = new Date();
            const timeDiff = snoozeTime - now;
            
            if (timeDiff <= 0) {
                countdownElement.classList.add('hidden');
                clearInterval(this.snoozeCountdownInterval);
                return;
            }
            
            const minutes = Math.floor(timeDiff / 60000);
            const seconds = Math.floor((timeDiff % 60000) / 1000);
            
            countdownElement.textContent = `Snooze: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        updateCountdown();
        this.snoozeCountdownInterval = setInterval(updateCountdown, 1000);
    }
    
    stopAlarmSound() {
        if (this.alarmSoundInterval) {
            clearInterval(this.alarmSoundInterval);
            this.alarmSoundInterval = null;
        }
        
        if (this.currentAlarmAudio) {
            this.currentAlarmAudio = null;
        }
    }
    
    updateVolume() {
        // Volume is applied in playAlarmSound method
        document.getElementById('muteBtn').textContent = this.volumeLevel === 0 ? '🔇' : '🔈';
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        document.getElementById('muteBtn').textContent = this.isMuted ? '🔇' : '🔈';
        
        if (this.isMuted) {
            this.showToast('Sound muted');
        } else {
            this.showToast('Sound unmuted');
        }
    }
    
    showToast(message) {
        const toast = document.getElementById('confirmToast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    renderAlarms() {
        const alarmsList = document.getElementById('alarmsList');
        
        if (this.alarms.length === 0) {
            alarmsList.innerHTML = `
                <div class="no-alarms">
                    <h3>No alarms set</h3>
                    <p>Tap the + button to add your first alarm</p>
                </div>
            `;
            return;
        }
        
        alarmsList.innerHTML = this.alarms.map(alarm => {
            const repeatText = alarm.repeat.length === 0 ? 'Once' : 
                alarm.repeat.length === 7 ? 'Every day' :
                alarm.repeat.map(dayId => this.weekDays[dayId].short).join(', ');
                
            return `
                <div class="alarm-item ${alarm.enabled ? 'enabled' : 'disabled'}" 
                     style="border-left: 5px solid ${alarm.color || '#4ECDC4'}" 
                     onclick="app.showSetAlarmScreen(${alarm.id})">
                    <div class="alarm-info">
                        <div class="alarm-time-display">${alarm.time}</div>
                        <div class="alarm-label-display">${alarm.label}</div>
                        <div class="alarm-repeat">${repeatText} • ${alarm.ringtone}</div>
                        <div class="alarm-status">
                            <div class="status-dot ${alarm.enabled ? '' : 'disabled'}"></div>
                            <span>${alarm.enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                    <div class="alarm-controls">
                        <div class="toggle-switch ${alarm.enabled ? 'active' : ''}" 
                             onclick="event.stopPropagation(); app.toggleAlarm(${alarm.id})">
                        </div>
                        <button class="delete-btn" onclick="event.stopPropagation(); app.deleteAlarm(${alarm.id})">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    toggleTheme() {
        const html = document.documentElement;
        const themeToggle = document.getElementById('themeToggle');
        
        if (html.dataset.colorScheme === 'dark') {
            html.dataset.colorScheme = 'light';
            themeToggle.textContent = '🌙';
        } else {
            html.dataset.colorScheme = 'dark';
            themeToggle.textContent = '☀️';
        }
        
        this.showToast(`Switched to ${html.dataset.colorScheme} theme`);
    }
    
    loadAlarms() {
        // Load sample data since localStorage is not available
        this.alarms = [
            {
                id: 1,
                time: "07:00",
                label: "Morning Workout",
                enabled: true,
                repeat: [1, 2, 3, 4, 5],
                ringtone: "Energetic Beep",
                vibrate: true,
                color: "#FF6B6B"
            },
            {
                id: 2, 
                time: "12:30",
                label: "Lunch Break",
                enabled: false,
                repeat: [],
                ringtone: "Gentle Chime",
                vibrate: false,
                color: "#4ECDC4"
            },
            {
                id: 3,
                time: "18:00", 
                label: "Evening Walk",
                enabled: true,
                repeat: [0, 6],
                ringtone: "Nature Sounds",
                vibrate: true,
                color: "#45B7D1"
            }
        ];
    }
    
    saveAlarms() {
        // In a real app, this would save to localStorage or a server
        // For this demo, we'll just keep in memory
        console.log('Alarms saved:', this.alarms);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AlarmApp();
});

// Handle page visibility changes to keep clock accurate
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.app) {
        // Restart clock when page becomes visible again
        clearInterval(window.app.clockInterval);
        window.app.startClock();
    }
});