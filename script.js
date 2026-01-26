// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. Splash Screen Timer ---
    // Hides the splash screen after 2 seconds
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
        }, 2000); 
    }

    // --- 1. Dynamic UI Greeting ---
    // Uses Swahili, Yoruba, and Bemba based on the time of day
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

    // --- 2. Navigation Logic ---
    // Handles active states and haptic vibration for the bottom menu
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove 'active' status from others
            navItems.forEach(nav => nav.classList.remove('active'));
            // Set this one to active
            this.classList.add('active');
            
            // Haptic-like vibration for mobile devices
            if (window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
        });
    });

    // --- 3. Language Card Logic ---
    // Provides visual feedback and redirects to the lesson page
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get data for redirect and display
            const langId = card.getAttribute('data-lang');
            const langName = card.querySelector('h3').innerText;
            
            // Visual feedback: briefly dim the card
            card.style.opacity = "0.7";
            
            setTimeout(() => {
                card.style.opacity = "1";
                
                // If you have the lesson page ready, this will redirect:
                if (langId) {
                    window.location.href = `lesson.html?lang=${langId}`;
                } else {
                    alert(`Starting your ${langName} journey! Loading lessons...`);
                }
            }, 200);
        });
    });
});
