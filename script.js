document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. Progress Tracking & Initialization ---
    const splash = document.getElementById('splash-screen');
    let currentLanguageData = null;
    let currentPhraseIndex = 0;

    // Initialize or Load User Stats from LocalStorage (Includes Inventory)
    let userStats = JSON.parse(localStorage.getItem('nizo_stats')) || {
        xp: 0,
        streak: 0,
        lastDate: null,
        inventory: { freeze: 0, boost: 0 } // Default inventory
    };

    function saveStats() {
        localStorage.setItem('nizo_stats', JSON.stringify(userStats));
    }

    // Splash Screen Logic
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
        }, 2000); 
    }

    // --- 1. Home & Profile UI Updates ---
    const welcomeHeader = document.querySelector('.welcome-text');
    const hour = new Date().getHours();
    
    if (welcomeHeader) {
        if (hour < 12) {
            welcomeHeader.innerText = "Ẹ kú àárọ̀! (Good Morning)";
        } else if (hour < 18) {
            welcomeHeader.innerText = "Habari za mchana! (Good Afternoon)";
        } else {
            welcomeHeader.innerText = "Muli shani! (Good Evening)";
        }
    }

    const xpDisplay = document.querySelector('.stat-val-xp') || document.getElementById('user-xp');
    if (xpDisplay) {
        xpDisplay.innerText = userStats.xp;
    }

    // --- 2. Home Screen: Navigation Menu Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            if (window.navigator.vibrate) window.navigator.vibrate(10);
        });
    });

    // --- 3. Home Screen: Language Card Selection ---
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            const langId = card.getAttribute('data-lang');
            if (langId) {
                e.preventDefault();
                card.style.opacity = "0.7";
                setTimeout(() => {
                    card.style.opacity = "1";
                    window.location.href = `lesson.html?lang=${langId}`;
                }, 200);
            }
        });
    });

    // --- 4. Lesson Screen: Data Loading Logic ---
    async function initLesson() {
        const params = new URLSearchParams(window.location.search);
        const langId = params.get('lang');
        if (!langId) return;

        try {
            const response = await fetch('languages.json');
            const data = await response.json();
            currentLanguageData = data.languages.find(l => l.id === langId);
            if (currentLanguageData) updateLessonUI();
        } catch (error) {
            console.error("Error fetching language data:", error);
        }
    }

    // --- 5. Lesson Screen: UI Updates ---
    function updateLessonUI() {
        const lesson = currentLanguageData.lessons[currentPhraseIndex];
        const nativeWordEl = document.querySelector('.native-word');
        const translationEl = document.querySelector('.translation');
        
        if (nativeWordEl) nativeWordEl.innerText = lesson.phrase;
        if (translationEl) translationEl.innerText = `"${lesson.meaning}"`;
        
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const progress = ((currentPhraseIndex + 1) / currentLanguageData.lessons.length) * 100;
            progressFill.style.width = `${progress}%`;
        }

        const langLabel = document.getElementById('lang-label');
        if (langLabel) langLabel.innerText = currentLanguageData.name;

        const noteEl = document.querySelector('.culture-note') || createNoteElement();
        noteEl.innerText = lesson.note || lesson.tone || "";
    }

    // --- 6. Lesson Screen: Continue Button & Success Logic ---
    const nextBtn = document.getElementById('next-phrase');
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentLanguageData && currentPhraseIndex < currentLanguageData.lessons.length - 1) {
                currentPhraseIndex++;
                updateLessonUI();
            } else {
                // --- LESSON COMPLETE LOGIC (Updated with Booster) ---
                let xpEarned = 15; // Base XP

                // Check if user has an active XP Booster in their inventory
                if (userStats.inventory && userStats.inventory.boost > 0) {
                    xpEarned = 30; // Double XP!
                    userStats.inventory.boost -= 1; // Consume 1 booster
                    console.log("XP Boost Applied! +30 XP gained.");
                }

                userStats.xp += xpEarned;
                
                // Update Streak (only once per day)
                const today = new Date().toDateString();
                if (userStats.lastDate !== today) {
                    userStats.streak += 1;
                    userStats.lastDate = today;
                }
                
                saveStats();

                // Trigger Success Overlay
                if (typeof window.showSuccessScreen === 'function') {
                    window.showSuccessScreen();
                } else {
                    const successOverlay = document.getElementById('success-overlay');
                    if (successOverlay) successOverlay.style.display = 'flex';
                }
            }
        });
    }

    // --- Helper: Create Note Element ---
    function createNoteElement() {
        const note = document.createElement('p');
        note.className = 'culture-note';
        note.style.cssText = "margin-top: 20px; color: #888; font-size: 0.9rem; font-style: italic;";
        const card = document.querySelector('.word-card');
        if (card) card.appendChild(note);
        return note;
    }

    if (window.location.pathname.includes('lesson.html')) {
        initLesson();
    }
});
