const API_URL = 'http://localhost:3000/api';

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function setupModeratorNavigation() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.email === 'moderator@autoline.kz') {
        const nav = document.querySelector('.menu');
        const footerNav = document.querySelector('.f-col ul');
        
        if (nav) {
            const links = nav.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href.includes('index.html') || href.includes('cart.html') || 
                    href.includes('purchases.html') || href.includes('sell.html'))) {
                    link.style.display = 'none';
                }
            });
            
            if (!nav.querySelector('a[href="moderator.html"]')) {
                const moderatorLink = document.createElement('a');
                moderatorLink.href = 'moderator.html';
                moderatorLink.textContent = 'Moderator';
                const catalogLink = nav.querySelector('a[href="catalog.html"]');
                if (catalogLink) {
                    catalogLink.insertAdjacentElement('afterend', moderatorLink);
                }
            }
        }
        
        if (footerNav) {
            const footerLinks = footerNav.querySelectorAll('a');
            footerLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href.includes('index.html') || href.includes('cart.html') || 
                    href.includes('purchases.html') || href.includes('sell.html'))) {
                    link.parentElement.style.display = 'none';
                }
            });
            
            if (!footerNav.querySelector('a[href="moderator.html"]')) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = 'moderator.html';
                a.textContent = 'Moderator';
                li.appendChild(a);
                footerNav.appendChild(li);
            }
        }
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

async function loadCatalog() {
    try {
        const response = await fetch(`${API_URL}/cars/approved`);
        const cars = await response.json();
        displayCars(cars);
    } catch (error) {
        console.error('Error loading catalog:', error);
    }
}

function displayCars(cars) {
    const grid = document.getElementById('catalog-grid');
    const noCars = document.getElementById('no-cars');
    
    if (cars.length === 0) {
        grid.innerHTML = '';
        noCars.style.display = 'block';
        return;
    }
    
    noCars.style.display = 'none';
    grid.innerHTML = cars.map(car => createCarCard(car)).join('');
}

function createCarCard(car) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const isModerator = user && user.email === 'moderator@autoline.kz';
    const imageUrl = car.image || '';
    return `
        <div class="car-card">
            ${imageUrl ? `<img src="${imageUrl}" alt="${car.make} ${car.model}">` : '<div style="width: 100%; height: 200px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af;">No image</div>'}
            <div class="car-card-content">
                <h3>${car.make} ${car.model}</h3>
                <p>Year: ${car.year} | ${car.mileage.toLocaleString()} miles</p>
                <p>Color: ${car.color}</p>
                <div class="price">${car.price.toLocaleString()} ₸</div>
                ${!isModerator ? `<button class="btn primary" onclick="addToCart('${car.id}')" style="width: 100%;">Add to Cart</button>` : ''}
            </div>
        </div>
    `;
}

async function addToCart(carId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.email === 'moderator@autoline.kz') {
        showNotification('Moderators cannot add items to cart', 'error');
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.find(item => item.id === carId)) {
        showNotification('This car is already in your cart!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cars/${carId}`);
        const car = await response.json();
        cart.push(car);
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification('Car added to cart!', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding car to cart', 'error');
    }
}

async function deleteFromCatalog(carId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const isModerator = user && user.email === 'moderator@autoline.kz';
    
    try {
        let response = await fetch(`${API_URL}/cars/${carId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok && response.status === 404) {
            response = await fetch(`${API_URL}/ads/${carId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        if (response.ok) {
            showNotification('Car deleted successfully from catalog', 'success');
        
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            cart = cart.filter(item => item.id !== carId);
            localStorage.setItem('cart', JSON.stringify(cart));
            loadCatalog();
        } else {
            const data = await response.json().catch(() => ({ error: 'Unknown error' }));
            showNotification(data.error || 'Failed to delete car', 'error');
        }
    } catch (error) {
        console.error('Error deleting car:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

window.deleteFromCatalog = deleteFromCatalog;

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
        
        setupModeratorNavigation();
    }
    loadCatalog();
});

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    window.location.href = 'login.html';
}

