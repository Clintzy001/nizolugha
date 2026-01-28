// --- 0. Supabase Configuration ---
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

/**
 * Saves XP to the Supabase 'profiles' table.
 */
async function saveXPToCloud(newXP) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    xp: newXP,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            
            if (error) throw error;
            console.log("XP synced to cloud successfully.");
        }
    } catch (error) {
        console.error("Cloud Sync Error:", error.message);
    }
}

// --- 1. Authentication Gatekeeper ---
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('nizo_user'));
    const isAuthPage = window.location.pathname.includes('auth.html');

    if (!user || !user.isLoggedIn) {
        if (!isAuthPage) window.location.href = 'auth.html';
    } else {
        if (isAuthPage) window.location.href = 'index.html';
    }
}
checkAuth();

// --- 2. Global State & UI Utilities ---
let pendingLangId = null;

// Navigation Item Toggle Logic
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const currentActive = document.querySelector('.nav-item.active');
        if (currentActive) currentActive.classList.remove('active');
        this.classList.add('active');
    });
});

/**
 * Updates the visual progress bar on the UI
 * @param {number} percent - The percentage (0-100)
 */
window.updateProgress = function(percent) {
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
}

window.logout = async function() {
    await supabase.auth.signOut();
    localStorage.removeItem('nizo_user');
    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 3. Progress Tracking & Initialization ---
    const splash = document.getElementById('splash-screen');
    let currentLanguageData = null;
    let currentPhraseIndex = 0;

    let userStats = JSON.parse(localStorage.getItem('nizo_stats')) || {
        xp: 0,
        streak: 0,
        lastDate: null,
        inventory: { freeze: 0, boost: 0 } 
    };

    function saveStats() {
        localStorage.setItem('nizo_stats', JSON.stringify(userStats));
        saveXPToCloud(userStats.xp);
    }

    // --- 4. Category Locking Logic ---
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
                if(statusSpan) statusSpan.innerHTML = `<span class="lock-tag"><i class="fas fa-lock"></i> ${cat.minXP} XP</span>`;
            } else {
                btn.classList.remove('locked');
                if(statusSpan) statusSpan.innerHTML = `<i class="fas fa-check-circle" style="color:#8BC34A; font-size:0.8rem; margin-left:auto;"></i>`;
            }
        });
    }

    window.checkLock = function(category, requiredXP) {
        if (userStats.xp < requiredXP) {
            const btn = document.getElementById(`cat-${category}`);
            if (btn) {
                btn.style.animation = "shake 0.3s ease";
                setTimeout(() => btn.style.animation = "", 300);
            }
            alert(`You need ${requiredXP} XP to unlock this! Keep practicing.`);
        } else {
            if (typeof startLesson === 'function') startLesson(category);
        }
    }

    if (splash) setTimeout(() => splash.classList.add('fade-out'), 2000); 

    // --- 5. UI Updates ---
    const xpDisplay = document.querySelector('.stat-val-xp') || document.getElementById('user-xp');
    if (xpDisplay) xpDisplay.innerText = userStats.xp;

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
            }
        });
    });

    // --- 6. Lesson Logic ---
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

    function updateLessonUI() {
        if (!currentLanguageData) return;
        const lesson = currentLanguageData.lessons[currentPhraseIndex];
        const nativeWordEl = document.querySelector('.native-word');
        const translationEl = document.querySelector('.translation');
        
        if (nativeWordEl) nativeWordEl.innerText = lesson.phrase;
        if (translationEl) translationEl.innerText = `"${lesson.meaning}"`;
        
        const progress = ((currentPhraseIndex + 1) / currentLanguageData.lessons.length) * 100;
        
        // Use the new updateProgress function for the progress bar
        updateProgress(progress);

        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) progressFill.style.width = `${progress}%`;
    }

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

    if (window.location.pathname.includes('lesson.html')) initLesson();
});
