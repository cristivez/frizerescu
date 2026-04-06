/**
 * Frizerescu Barber Shop — Main JavaScript
 * Handles: navigation, language switching, scroll animations, booking tracking
 */

document.addEventListener('DOMContentLoaded', function () {

    // =============================
    // Language Switching (i18n)
    // =============================
    const langRo = document.getElementById('lang-ro');
    const langEn = document.getElementById('lang-en');

    function setLanguage(lang) {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translations[lang][key];
                } else if (el.classList.contains('footer-copy')) {
                    el.innerHTML = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });
    }

    function updateActiveLang(lang) {
        if (langRo) langRo.setAttribute('aria-pressed', lang === 'ro' ? 'true' : 'false');
        if (langEn) langEn.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
        if (langRo) langRo.classList.toggle('active', lang === 'ro');
        if (langEn) langEn.classList.toggle('active', lang === 'en');
    }

    function switchLang(lang) {
        setLanguage(lang);
        localStorage.setItem('frizerescu-lang', lang);
        updateActiveLang(lang);
    }

    if (langRo && langEn) {
        langRo.addEventListener('click', function () { switchLang('ro'); });
        langEn.addEventListener('click', function () { switchLang('en'); });
    }

    // Restore saved language on load
    const savedLang = localStorage.getItem('frizerescu-lang') || 'ro';
    setLanguage(savedLang);
    updateActiveLang(savedLang);


    // =============================
    // Mobile Navigation (Hamburger)
    // =============================
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
            const isOpen = navLinks.classList.contains('active');
            hamburger.setAttribute('aria-expanded', isOpen);
        });

        // Close menu when a nav link is clicked
        document.querySelectorAll('.nav-links a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }


    // =============================
    // Smooth Scrolling for Anchor Links
    // =============================
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const header = document.querySelector('.header');
                const headerOffset = header ? header.offsetHeight : 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });


    // =============================
    // Hero Buttons → Scroll to Locations
    // =============================
    document.querySelectorAll('.hero-scroll-locatii').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const locationsSection = document.getElementById('locations');
            if (locationsSection) {
                const header = document.querySelector('.header');
                const headerOffset = header ? header.offsetHeight : 80;
                const elementPosition = locationsSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });


    // =============================
    // Header Scroll Effect
    // =============================
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }


    // =============================
    // Highlight Active Menu Item on Scroll
    // =============================
    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav-links a[href^="#"]');

    window.addEventListener('scroll', function () {
        const headerEl = document.querySelector('.header');
        const headerHeight = headerEl ? headerEl.offsetHeight : 100;
        let current = '';

        sections.forEach(function (section) {
            const sectionTop = section.offsetTop - headerHeight - 10;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinksAll.forEach(function (link) {
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

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.service-card, .location-card, .review-card').forEach(function (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });


    // =============================
    // Booking Button Click Tracking
    // =============================
    document.querySelectorAll('a[href*="mero.ro"]').forEach(function (button) {
        button.addEventListener('click', function () {
            const location = this.href.includes('mega-mall') ? 'mega-mall' :
                             this.href.includes('kaufland') ? 'kaufland' : 'pipera';
            console.log('Booking clicked for: ' + location);
        });
    });

});
