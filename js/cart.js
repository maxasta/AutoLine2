const API_URL = 'http://localhost:3000/api';

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
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
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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

function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemsDiv = document.getElementById('cart-items');
    const emptyDiv = document.getElementById('empty-cart');
    const summaryDiv = document.getElementById('cart-summary');
    
    if (cart.length === 0) {
        itemsDiv.innerHTML = '';
        emptyDiv.style.display = 'block';
        summaryDiv.style.display = 'none';
        return;
    }
    
    emptyDiv.style.display = 'none';
    summaryDiv.style.display = 'block';
    
    itemsDiv.innerHTML = cart.map((item, index) => createCartItem(item, index)).join('');
    updateTotal(cart);
}

function createCartItem(item, index) {
    const imageUrl = item.image || '';
    return `
        <div class="cart-item">
            ${imageUrl ? `<img src="${imageUrl}" alt="${item.make} ${item.model}">` : '<div style="width: 150px; height: 150px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af; border-radius: 5px;">No image</div>'}
            <div style="flex: 1;">
                <h3 style="margin-bottom: 0.5rem;">${item.make} ${item.model}</h3>
                <p style="color: #6b7280;">Year: ${item.year} | ${item.mileage.toLocaleString()} miles</p>
                <p style="font-size: 1.5rem; font-weight: bold; color: #2563eb; margin-top: 0.5rem;">${item.price.toLocaleString()} ₸</p>
            </div>
            <button class="btn" onclick="removeFromCart(${index})" style="background: #dc2626; color: white;">Remove</button>
        </div>
    `;
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    showNotification('Item removed from cart', 'success');
}

function updateTotal(cart) {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-total').textContent = `${total.toLocaleString()} ₸`;
}

async function checkout() {
    const user = checkAuth();
    if (!user) return;
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalText = checkoutBtn ? checkoutBtn.textContent : 'Checkout';
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Processing...';
    }
    
    try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const item of cart) {
            try {
                const response = await fetch(`${API_URL}/purchases`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        carId: item.id,
                        carData: item
                    })
                });
                
                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error('Failed to purchase item:', item.id);
                }
            } catch (error) {
                errorCount++;
                console.error('Error purchasing item:', item.id, error);
            }
        }
        
        if (successCount > 0) {
            localStorage.removeItem('cart');
            showNotification(`Successfully purchased ${successCount} item(s)!`, 'success');
            setTimeout(() => {
                window.location.href = 'purchases.html';
            }, 1500);
        } else {
            showNotification('Failed to complete purchase. Please try again.', 'error');
            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = originalText;
            }
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('Error during checkout. Please try again.', 'error');
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = originalText;
        }
    }
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
    loadCart();
});

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    window.location.href = 'login.html';
}

