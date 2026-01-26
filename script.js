document.addEventListener('DOMContentLoaded', () => {
    // 1. Bottom Navigation Switching
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            navItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');
            
            // Log for testing
            console.log(`Mapsd to: ${item.querySelector('i').className}`);
        });
    });

    // 2. Language Card Interaction
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Prevent default jump if using # links
            e.preventDefault();
            
            const language = card.querySelector('h3').innerText;
            alert(`Opening ${language} lessons... Stay tuned!`);
            
            // Here you would eventually use: window.location.href = 'lesson.html';
        });
    });

    // 3. Subtle Greeting based on time of day
    const welcomeText = document.querySelector('.welcome-text');
    const hour = new Date().getHours();
    
    if (hour < 12) welcomeText.innerText = "Good Morning! Ready to learn?";
    else if (hour < 18) welcomeText.innerText = "Good Afternoon! Let's pick up where you left off.";
    else welcomeText.innerText = "Good Evening! A quick lesson before bed?";
});
