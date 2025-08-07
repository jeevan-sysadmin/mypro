document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const staffIdInput = document.getElementById('staffId');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    const errorMessage = document.getElementById('errorMessage');
    const sessionMessage = document.getElementById('sessionMessage');

    // Check URL parameters for session expiration
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('session_expired')) {
        sessionMessage.style.display = 'block';
        
        // Remove the parameter from URL without reloading
        const cleanUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, document.title, cleanUrl);
    }

    // Clear any existing session data
    localStorage.removeItem('staffid');

    // Password toggle functionality
    function togglePasswordVisibility() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.textContent = type === 'password' ? 'visibility_off' : 'visibility';
        togglePassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
    }

    togglePassword.addEventListener('click', togglePasswordVisibility);
    
    // Also allow toggling with Enter key for accessibility
    togglePassword.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePasswordVisibility();
        }
    });

    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const staffId = staffIdInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validate inputs
        if (!staffId) {
            showError("Please enter your Staff ID");
            staffIdInput.focus();
            return;
        }

        if (!password) {
            showError("Please enter your password");
            passwordInput.focus();
            return;
        }

        // Show loading state
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        errorMessage.style.display = 'none';
        sessionMessage.style.display = 'none';
        
        try {
            // Basic input sanitization
            const sanitizedStaffId = staffId.replace(/[^a-zA-Z0-9]/g, '');
            const sanitizedPassword = password.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
            
            // Simulate network delay for demo (remove in production)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch(`http://localhost/sxc/log_credential_25.php?fid=${encodeURIComponent(sanitizedStaffId)}&pass=${encodeURIComponent(sanitizedPassword)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const result = await response.text();
                if (result.trim() === '1') {
                    // Store staff ID in local storage
                    localStorage.setItem('staffid', sanitizedStaffId);
                    
                    // Successful login - redirect to splash screen
                    window.location.href = 'splash_screen.html';
                } else {
                    showError("Invalid Staff ID or Password");
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } else {
                throw new Error(`Server responded with status ${response.status}`);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError("Login failed. Please try again later.");
        } finally {
            // Hide loading state
            loginBtn.disabled = false;
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    // Focus on staff ID field when page loads
    staffIdInput.focus();
    
    // Handle Enter key to move between fields
    staffIdInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInput.focus();
        }
    });
    
    passwordInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});