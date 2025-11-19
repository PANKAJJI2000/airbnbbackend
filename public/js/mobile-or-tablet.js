// Mobile and Tablet Detection Utility
(function() {
    'use strict';
    
    // Detect if device is mobile or tablet
    function isMobileOrTablet() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);
        
        return isMobile || isTablet;
    }
    
    // Add class to body for responsive styling
    function addDeviceClass() {
        const body = document.body;
        
        if (isMobileOrTablet()) {
            body.classList.add('mobile-device');
            
            // More specific detection
            if (/ipad|tablet/i.test(navigator.userAgent.toLowerCase())) {
                body.classList.add('tablet-device');
            } else {
                body.classList.add('phone-device');
            }
        } else {
            body.classList.add('desktop-device');
        }
    }
    
    // Check screen size
    function checkScreenSize() {
        const width = window.innerWidth;
        const body = document.body;
        
        body.classList.remove('screen-small', 'screen-medium', 'screen-large');
        
        if (width < 768) {
            body.classList.add('screen-small');
        } else if (width < 1024) {
            body.classList.add('screen-medium');
        } else {
            body.classList.add('screen-large');
        }
    }
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            addDeviceClass();
            checkScreenSize();
        });
    } else {
        addDeviceClass();
        checkScreenSize();
    }
    
    // Update on window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Export to global scope
    window.DeviceDetector = {
        isMobileOrTablet: isMobileOrTablet,
        checkScreenSize: checkScreenSize
    };
})();
