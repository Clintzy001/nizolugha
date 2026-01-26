// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Navigation Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove 'active' status from others
            navItems.forEach(nav => nav.classList.remove('active'));
            // Set this one to active
            this.classList.add('active');
            
            // Haptic-like vibration for mobile
            if (window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
        });
    });

    // --- 2. Language Card Logic ---
    const languageCards = document.querySelectorAll('.card');
    
    languageCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = card.querySelector('h3').innerText;
            
            // Visual feedback: briefly dim the card
            card.style.opacity = "0.7";
            
            setTimeout(() => {
                card.style.opacity = "1";
                alert(`Starting your ${lang} journey! Loading lessons...`);
                // Future: window.location.href = `lessons/${lang.toLowerCase()}.html`;
            }, 200);
        });
    });

    // --- 3. Dynamic UI Greeting ---
    const welcomeHeader = document.querySelector('.welcome-text');
    const time = new Date().getHours();
    
    const greetings = {
        morning: "E ku aarọ! Ready to learn?",
        afternoon: "Habari za mchana! Let's study.",
        evening: "Muli shani! Time for a quick lesson."
    };

    if (time < 12) welcomeHeader.innerText = greetings.morning;
    else if (time < 18) welcomeHeader.innerText = greetings.afternoon;
    else welcomeHeader.innerText = greetings.evening;

});
