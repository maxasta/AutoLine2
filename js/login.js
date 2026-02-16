const API_URL = 'http://localhost:3000/api';

function showRegister() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
}
function showLogin() {
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
            
            const existingSuccess = document.getElementById('register-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }
            
            const successDiv = document.createElement('div');
            successDiv.id = 'register-success';
            successDiv.style.cssText = 'margin-top: 1rem; padding: 0.75rem; background: #dcfce7; color: #166534; border-radius: 5px;';
            successDiv.textContent = 'Registration successful! Please login with your credentials.';
            document.getElementById('register-section').insertBefore(successDiv, document.getElementById('register-form'));
            
            document.getElementById('register-form').reset();
            
            setTimeout(() => {
                showLogin();
                document.getElementById('login-email').value = email;
            }, 1500);
        } else {
            errorDiv.textContent = data.error || 'Registration failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            if (data.user.email === 'moderator@autoline.kz') {
                window.location.href = 'moderator.html';
            } else {
                window.location.href = '../index.html';
            }
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
});

