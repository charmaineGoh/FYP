const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const res = await fetch('http://localhost:3000/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            const err = await res.json();
            errorMessage.textContent = err.error || 'Login failed';
        }
    } catch (err) {
        console.error('Login error:', err);
        errorMessage.textContent = 'Unable to connect to server';
    }
});

