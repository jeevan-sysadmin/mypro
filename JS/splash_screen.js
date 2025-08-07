document.addEventListener('DOMContentLoaded', function() {
    // Check URL parameters for session expiration
    const urlParams = new URLSearchParams(window.location.search);
    const sessionExpiredMessage = document.getElementById('sessionExpiredMessage');
    const splashContent = document.getElementById('splashContent');
    
    if (urlParams.has('session_expired')) {
        // Show session expired message and hide splash content
        sessionExpiredMessage.style.display = 'block';
        splashContent.style.display = 'none';
    } else {
        // Check if staff ID exists in local storage
        const staffId = localStorage.getItem('staffid');
        
        if (!staffId) {
            // No staff ID found, redirect to login
            window.location.href = 'login.html?session_expired=true';
            return;
        }
        
        // Set timeout for the splash screen delay
        setTimeout(function() {
            // Redirect to home screen
            window.location.href = 'home_screen.html';
        }, 1500); // 1.5 second delay
    }
});

function redirectToLogin() {
    // Redirect to login page without session_expired parameter
    window.location.href = 'login.html';
}