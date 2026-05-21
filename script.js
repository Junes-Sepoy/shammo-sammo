// Scroll-triggered animations
document.addEventListener('DOMContentLoaded', function() {
    const mainTitle = document.getElementById('mainTitle');
    const logo = document.querySelector('.logo');
    const fadeElements = document.querySelectorAll('.fade-element');
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px'
    };
    
    // Observer for title backflip (home page)
    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('backflip')) {
                entry.target.classList.add('backflip');
            }
        });
    }, observerOptions);
    
    // Observer for fade-in elements
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe elements
    if (mainTitle) {
        titleObserver.observe(mainTitle);
    }
    
    // Logo already animates on page load, no need to observe
    
    fadeElements.forEach(element => {
        fadeObserver.observe(element);
    });
});