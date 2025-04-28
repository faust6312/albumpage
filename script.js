document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration Loading & Initial Setup ---
    const avatarElement = document.getElementById('avatar');
    const stickerBackground = document.getElementById('sticker-background');
    const tearLeft = document.querySelector('.tear-left');
    const tearRight = document.querySelector('.tear-right');

    // Check if config object exists (loaded from config.js)
    if (typeof config === 'undefined') {
        console.error('Configuration file (config.js) not found or loaded.');
        // Optionally display an error message to the user on the page
        return; 
    }

    // Set Avatar and make it clickable to blog
    if (avatarElement && config.avatarUrl) {
        avatarElement.src = config.avatarUrl;
        
        // Make avatar clickable to blog
        if (config.blogUrl) {
            avatarElement.style.cursor = 'pointer';
            avatarElement.addEventListener('click', () => {
                window.location.href = config.blogUrl;
            });
        }
    } else {
        console.warn('Avatar element or URL not found in config.');
    }

    // Generate Stickers
    if (stickerBackground && config.albumCoverUrls && config.albumCoverUrls.length > 0) {
        generateStickers(stickerBackground, config.albumCoverUrls);
    } else {
        console.warn('Sticker background element or album cover URLs not found in config.');
    }

    // Handle Tear Animation Removal
    handleTearAnimation(tearLeft, tearRight);

    // Setup Scroll Navigation (REMOVED)
    // if (config.neteaseMusicUrl && config.blogUrl) {
    //     setupScrollNavigation(config.neteaseMusicUrl, config.blogUrl);
    // } else {
    //     console.error("Navigation URLs (neteaseMusicUrl or blogUrl) missing in config.");
    // }
    
    // Add Scroll Indicator Text (REMOVED)
    // addScrollIndicator();
});

// --- Function Definitions ---

function generateStickers(container, urls) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Adjust sticker size range based on screen size for better responsiveness
    const isMobile = viewportWidth < 768;
    const stickerBaseMinWidth = isMobile ? 60 : 100;
    const stickerBaseMaxWidth = isMobile ? 120 : 250;
    const stickerBaseMinHeight = isMobile ? 60 : 100;
    const stickerBaseMaxHeight = isMobile ? 120 : 250;
    const curlPercentage = 0.15; // 15% chance of curl

    urls.forEach(url => {
        const sticker = document.createElement('img');
        sticker.src = url;
        sticker.classList.add('album-sticker');
        sticker.alt = 'Album Cover Sticker';
        sticker.style.position = 'absolute'; // Ensure positioning context
        sticker.loading = 'lazy'; // Add lazy loading for performance

        // Random size
        const width = Math.random() * (stickerBaseMaxWidth - stickerBaseMinWidth) + stickerBaseMinWidth;
        // Let height adjust automatically based on width to maintain aspect ratio
        sticker.style.width = `${width}px`;
        sticker.style.height = 'auto'; 

        // Random position within viewport bounds, considering sticker size
        // We need the natural height after setting width, but that's tricky before rendering.
        // For simplicity, we'll estimate or just place based on width.
        // A better approach might involve getting dimensions after image loads, but that's more complex.
        // Let's place randomly, allowing some overlap off-screen initially.
        const maxLeft = viewportWidth - stickerBaseMinWidth; // Use min width for calculation safety
        const maxTop = viewportHeight - stickerBaseMinHeight; // Use min height for calculation safety
        sticker.style.left = `${Math.random() * maxLeft}px`;
        sticker.style.top = `${Math.random() * maxTop}px`;

        // Random rotation
        const rotation = Math.random() * 30 - 15; // -15 to +15 degrees
        sticker.style.transform = `rotate(${rotation}deg)`;

        // Randomly add curled corner effect
        if (Math.random() < curlPercentage) {
            sticker.classList.add('curled-corner');
        }

        container.appendChild(sticker);
    });
}

function handleTearAnimation(tearLeft, tearRight) {
    if (tearLeft && tearRight) {
        // Remove overlays after animation finishes (1.5s duration from CSS)
        setTimeout(() => {
            if (tearLeft.parentNode) tearLeft.parentNode.removeChild(tearLeft);
            if (tearRight.parentNode) tearRight.parentNode.removeChild(tearRight);
            // Body overflow is already hidden by default in CSS, no need to change
        }, 1500); 
    }
}

// Debounce function: Executes the function only after inactivity
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupScrollNavigation(upUrl, downUrl) {
    let isNavigating = false; // Flag to prevent multiple navigations
    const navigationDelay = 500; // Min time between navigations
    const debounceWait = 150; // Time to wait after scroll stops before triggering
    
    // Create transition overlay for smooth transitions
    const transitionOverlay = document.createElement('div');
    transitionOverlay.classList.add('transition-overlay');
    document.body.appendChild(transitionOverlay);
    
    // Prefetch target pages to speed up loading
    prefetchPages([upUrl, downUrl]);

    const handleScroll = debounce((event) => {
        if (isNavigating) return; 

        const deltaY = event.deltaY;
        
        // Check if tear animation elements still exist (might have been removed by handleTearAnimation)
        const tearOverlayExists = document.querySelector('.tear-overlay');
        if (tearOverlayExists) {
            console.log('Tear animation in progress, navigation disabled.');
            return; // Don't navigate during tear animation
        }

        if (deltaY < -10) { // Add a small threshold to avoid accidental triggers
            console.log('Scrolling Up - Navigating to:', upUrl);
            navigateWithTransition(upUrl);
        } else if (deltaY > 10) { // Add a small threshold
            console.log('Scrolling Down - Navigating to:', downUrl);
            navigateWithTransition(downUrl);
        }
    }, debounceWait); 

    // Use passive: true for better scroll performance if default prevention isn't needed
    window.addEventListener('wheel', handleScroll, { passive: true }); 
    
    // Handle touch events for mobile devices
    let touchStartY = 0;
    
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    window.addEventListener('touchmove', debounce((e) => {
        if (isNavigating) return;
        
        const touchEndY = e.touches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        
        // Check if tear animation is in progress
        const tearOverlayExists = document.querySelector('.tear-overlay');
        if (tearOverlayExists) return;
        
        // Use a threshold to prevent accidental navigation
        if (Math.abs(deltaY) > 50) {
            if (deltaY < 0) { // Scrolling up
                navigateWithTransition(upUrl);
            } else { // Scrolling down
                navigateWithTransition(downUrl);
            }
        }
    }, debounceWait), { passive: true });
    
    // Function to handle navigation with transition effect
    function navigateWithTransition(url) {
        if (isNavigating) return;
        isNavigating = true;
        
        // Show transition overlay with fade-in effect
        transitionOverlay.style.opacity = '1';
        
        // Navigate after transition completes
        setTimeout(() => {
            window.location.href = url;
            // Reset flag after navigation delay (though page will unload)
            setTimeout(() => { isNavigating = false; }, navigationDelay);
        }, 300); // Match this with CSS transition duration
    }
}

// Function to prefetch pages for faster loading
function prefetchPages(urls) {
    urls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        // Also add preconnect for faster DNS resolution
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = new URL(url).origin;
        document.head.appendChild(preconnect);
    });
}

function addScrollIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('scroll-indicator');
    // Use innerText for security unless HTML is strictly needed and controlled
    indicator.innerText = 'Scroll Up: Music / Scroll Down: Blog'; 
    document.body.appendChild(indicator);
}
