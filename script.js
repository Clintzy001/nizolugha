document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. Splash Screen & Initialization ---
    const splash = document.getElementById('splash-screen');
    let currentLanguageData = null;
    let currentPhraseIndex = 0;

    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
        }, 2000); 
    }

    // --- 1. Home Screen: Dynamic Greeting ---
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

    // --- 2. Home Screen: Navigation Menu Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            if (window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
        });
    });

    // --- 3. Home Screen: Language Card Selection ---
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const langId = card.getAttribute('data-lang');
            
            // Visual feedback: briefly dim the card
            card.style.opacity = "0.7";
            
            setTimeout(() => {
                card.style.opacity = "1";
                if (langId) {
                    window.location.href = `lesson.html?lang=${langId}`;
                }
            }, 200);
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
            
            if (currentLanguageData) {
                updateLessonUI();
            }
        } catch (error) {
            console.error("Error fetching language data:", error);
        }
    }

    // --- 5. Lesson Screen: UI Updates ---
    function updateLessonUI() {
        const lesson = currentLanguageData.lessons[currentPhraseIndex];
        
        // Update words and translations
        const nativeWordEl = document.querySelector('.native-word');
        const translationEl = document.querySelector('.translation');
        
        if (nativeWordEl) nativeWordEl.innerText = lesson.phrase;
        if (translationEl) translationEl.innerText = `"${lesson.meaning}"`;
        
        // Update Progress Bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const progress = ((currentPhraseIndex + 1) / currentLanguageData.lessons.length) * 100;
            progressFill.style.width = `${progress}%`;
        }

        // Update the Language Label (e.g., SWAHILI, IGBO)
        const langLabel = document.getElementById('lang-label');
        if (langLabel) langLabel.innerText = currentLanguageData.name;

        // Update Tone/Culture Note
        const noteEl = document.querySelector('.culture-note') || createNoteElement();
        noteEl.innerText = lesson.note || lesson.tone || "";
    }

    // --- 6. Lesson Screen: Continue Button ---
    const nextBtn = document.getElementById('next-phrase');
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentLanguageData && currentPhraseIndex < currentLanguageData.lessons.length - 1) {
                currentPhraseIndex++;
                updateLessonUI();
            } else {
                // Trigger the Success Screen and celebratory sound defined in lesson.html
                if (typeof window.showSuccessScreen === 'function') {
                    window.showSuccessScreen();
                } else {
                    // Fallback in case the function isn't found
                    document.getElementById('success-overlay').style.display = 'flex';
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

    // Run the lesson initializer if we are on the lesson page
    if (window.location.pathname.includes('lesson.html')) {
        initLesson();
    }
});
