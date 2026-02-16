function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'pages/login.html';
        return null;
    }
    return user;
}

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    
    if (user) {
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');
        const userInitial = document.getElementById('user-initial');
        
        if (userMenu) {
            userMenu.style.display = 'flex';
            if (userName) userName.textContent = user.name;
            if (userInitial) userInitial.textContent = user.name.charAt(0).toUpperCase();
        }
    }
});

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    window.location.href = 'pages/login.html';
}