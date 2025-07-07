
/**
 * Frizerescu Barber Shop Website
 * script.js
 * -----------------------------------
 * Main JavaScript for navigation, animations, booking, and performance.
 * All major blocks are documented in English for maintainability.
 */

// =============================
// Mobile Navigation (Hamburger)
// =============================
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Close menu when a nav link is clicked
    const navLinksItems = document.querySelectorAll('.nav-links a');
    navLinksItems.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
});

// =============================
// Smooth Scrolling for Anchor Links
// =============================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// =============================
// Highlight Active Menu Item on Scroll
// =============================
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// =============================
// Scroll Animations for Cards
// =============================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};
const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);
document.querySelectorAll('.service-card, .location-card, .review-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// =============================
// Booking Button Click Tracking (Analytics)
// =============================
function trackBookingClick(location) {
    // Add analytics code here (Google Analytics, etc.)
    console.log(`Booking clicked for: ${location}`);
    // Optionally show a confirmation message
    // alert('Redirecting to booking page for ' + location);
}
document.addEventListener('DOMContentLoaded', function() {
    const bookingButtons = document.querySelectorAll('a[href*="mero.ro"]');
    bookingButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const location = this.href.includes('kaufland') ? 'kaufland' : 'pipera';
            trackBookingClick(location);
        });
    });
});

// =============================
// Lazy Loading for Images
// =============================
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    images.forEach(img => imageObserver.observe(img));
}
setupLazyLoading();

// =============================
// Performance Optimization (Preload important links)
// =============================
function optimizePerformance() {
    const importantLinks = [
        'https://mero.ro/p/frizerescu',
        'https://mero.ro/p/frizerescu-kaufland'
    ];
    importantLinks.forEach(link => {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.href = link;
        preloadLink.as = 'document';
        document.head.appendChild(preloadLink);
    });
}
document.addEventListener('DOMContentLoaded', optimizePerformance);

// =============================
// Service Worker Registration (Optional, for caching)
// =============================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed');
            });
    });
}
