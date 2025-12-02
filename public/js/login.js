// --- Get references to all the new elements ---
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

// --- Tab Switching Logic ---
loginTab.addEventListener('click', () => {
    // Make login tab active
    loginTab.classList.add('active');
    signupTab.classList.remove('active');

    // Show login form and hide signup form
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
});

signupTab.addEventListener('click', () => {
    // Make signup tab active
    signupTab.classList.add('active');
    loginTab.classList.remove('active');

    // Show signup form and hide login form
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

// --- Login Form Submission Logic (same as before) ---
loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent page refresh

    const username = usernameInput.value;
    const password = passwordInput.value;

    // FAKE authentication
    if ((username === 'supervisor' && password === 'pass123') || (username === 'staff' && password === 'pass123')) {
        console.log('Login successful!');
        window.location.href = 'dashboard.html';
    } else {
        errorMessage.textContent = 'Invalid username or password.';
    }
});

// --- (Optional) Add a simple handler for the signup form ---
signupForm.addEventListener('submit', function(event) {
    event.preventDefault();
    // In a real app, you would register the user here.
    // For now, we'll just log it and redirect.
    console.log('Signup form submitted. Simulating account creation...');
    alert('Account created successfully! Please log in.');
    
    // Switch back to the login tab
    loginTab.click();
});

