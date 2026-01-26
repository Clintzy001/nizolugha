// --- 1. Authentication Gatekeeper ---
// This runs immediately on every page load to protect the site
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('nizo_user'));
    // Checks if the current page is the login page
    const isAuthPage = window.location.pathname.includes('auth.html');

    if (!user || !user.isLoggedIn) {
        // Redirect to login if not logged in and not already on the login page
        if (!isAuthPage) {
            window.location.href = 'auth.html';
        }
    } else {
        // Redirect to home if logged in and trying to access the login page
        if (isAuthPage) {
            window.location.href = 'index.html';
        }
    }
}

// Execute check immediately before DOM loads
checkAuth();

// --- 2. Global State ---
let pendingLangId = null; // Store ID globally for category selection

// --- 3. Global Logout Function ---
window.logout = function() {
    // Option A: Remove only the session (keeps their XP and progress)
    localStorage.removeItem('nizo_user');
    
    /* Option B: Clear EVERYTHING (Reset XP, streak, and session)
    localStorage.clear(); 
    */

    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. Progress Tracking & Initialization ---
    const splash = document.getElementById('splash-screen');
    let currentLanguageData = null;
    let currentPhraseIndex = 0;

    // Initialize or Load User Stats from LocalStorage
    let userStats = JSON.parse(localStorage.getItem('nizo_stats')) || {
        xp: 0,
        streak: 0,
        lastDate: null,
        inventory: { freeze: 0, boost: 0 } 
    };

    function saveStats() {
        localStorage.setItem('nizo_stats', JSON.stringify(userStats));
    }

    // --- NEW: Category Locking Logic ---
    window.updateCategoryLocks = function() {
        const currentXP = userStats.xp || 0;
        
        const categories = [
            { id: 'cat-market', minXP: 100 },
            { id: 'cat-travel', minXP: 250 }
        ];

        categories.forEach(cat => {
            const btn = document.getElementById(cat.id);
            if (!btn) return;
            const statusSpan = btn.querySelector('.lock-status');
            
            if (currentXP < cat.minXP) {
                btn.classList.add('locked');
                statusSpan.innerHTML = `<span class="lock-tag"><i class="fas fa-lock"></i> ${cat.minXP} XP</span>`;
            } else {
                btn.classList.remove('locked');
                statusSpan.innerHTML = `<i class="fas fa-check-circle" style="color:#8BC34A; font-size:0.8rem; margin-left:auto;"></i>`;
            }
        });
    }

    // --- NEW: Lock Check Wrapper ---
    window.checkLock = function(category, requiredXP) {
        if (userStats.xp < requiredXP) {
            const btn = document.getElementById(`cat-${category}`);
            if (btn) {
                btn.style.animation = "shake 0.3s ease";
                setTimeout(() => btn.style.animation = "", 300);
            }
            alert(`You need ${requiredXP} XP to unlock this! Keep practicing basics.`);
        } else {
            if (typeof startLesson === 'function') startLesson(category);
        }
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
        if (hour < 12) welcomeHeader.innerText = "Ẹ kú àárọ̀! (Good Morning)";
        else if (hour < 18) welcomeHeader.innerText = "Habari za mchana! (Good Afternoon)";
        else welcomeHeader.innerText = "Muli shani! (Good Evening)";
    }

    const xpDisplay = document.querySelector('.stat-val-xp') || document.getElementById('user-xp');
    if (xpDisplay) xpDisplay.innerText = userStats.xp;

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
            e.preventDefault();
            const langId = card.getAttribute('data-lang');
            const langName = card.querySelector('h3').innerText;
            
            if (langId) {
                pendingLangId = langId; 
                const modalTitle = document.getElementById('selected-lang-name');
                if (modalTitle) modalTitle.innerText = "Learn " + langName;
                
                updateCategoryLocks();
                const overlay = document.getElementById('category-overlay');
                if (overlay) overlay.style.display = 'flex';
                
                if (window.navigator.vibrate) window.navigator.vibrate(15);
            }
        });
    });

    // --- 4. Lesson Screen: Data Loading Logic ---
    async function initLesson() {
        const params = new URLSearchParams(window.location.search);
        const langId = params.get('lang');
        const cat = params.get('cat') || 'basics';
        if (!langId) return;

        try {
            const response = await fetch('languages.json');
            const data = await response.json();
            const rawLangData = data.languages.find(l => l.id === langId);
            
            if (rawLangData) {
                const filtered = rawLangData.lessons.filter(l => l.type === cat);
                currentLanguageData = { ...rawLangData, lessons: filtered.length > 0 ? filtered : rawLangData.lessons };
                updateLessonUI();
            }
        } catch (error) {
            console.error("Error fetching language data:", error);
        }
    }

    // --- 5. Lesson Screen: UI Updates ---
    function updateLessonUI() {
        if (!currentLanguageData) return;
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
        noteEl.innerText = lesson.note || "";
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
                let xpEarned = 15;
                if (userStats.inventory && userStats.inventory.boost > 0) {
                    xpEarned = 30;
                    userStats.inventory.boost -= 1;
                }
                userStats.xp += xpEarned;
                const today = new Date().toDateString();
                if (userStats.lastDate !== today) {
                    userStats.streak += 1;
                    userStats.lastDate = today;
                }
                saveStats();
                if (typeof window.showSuccessScreen === 'function') window.showSuccessScreen();
            }
        });
    }

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
