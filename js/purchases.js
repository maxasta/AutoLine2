const API_URL = 'http://localhost:3000/api';

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

async function loadPurchases() {
    const user = checkAuth();
    if (!user) return;
    
    try {
        const response = await fetch(`${API_URL}/purchases/user/${user.id}`);
        
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        
        const data = await response.json();
        const purchases = data.purchases || [];
        
        displayPurchases(purchases);
        
    } catch (error) {
        console.log('Error loading purchases:', error);
        
        const listDiv = document.getElementById('purchases-list');
        const noDiv = document.getElementById('no-purchases');
        
        if (listDiv) {
            listDiv.innerHTML = '';
        }
        
        if (noDiv) {
            noDiv.innerHTML = '<div class="emoji">⚠️</div><p>Error loading purchases. Please try again.</p>';
            noDiv.style.display = 'block';
        }
    }
}

function displayPurchases(purchases) {
    const listDiv = document.getElementById('purchases-list');
    const noDiv = document.getElementById('no-purchases');
    
    if (!purchases || purchases.length === 0) {
        if (listDiv) {
            listDiv.innerHTML = '';
        }
        if (noDiv) {
            noDiv.style.display = 'block';
        }
        return;
    }
    
    if (noDiv) {
        noDiv.style.display = 'none';
    }
    
    if (listDiv) {
        let purchasesHTML = '';
        for (let i = 0; i < purchases.length; i++) {
            purchasesHTML += createPurchaseItem(purchases[i]);
        }
        listDiv.innerHTML = purchasesHTML;
    }
}

function createPurchaseItem(purchase) {
    const car = purchase.carData || purchase;
    
    if (!car) {
        console.log('Invalid purchase data:', purchase);
        return '';
    }
    
    const imageUrl = car.image || '';
    const date = new Date(purchase.purchaseDate || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const price = car.price ? car.price.toLocaleString() : '0';
    const mileage = car.mileage ? car.mileage.toLocaleString() : '0';
    const year = car.year || 'N/A';
    const make = car.make || '';
    const model = car.model || '';
    
    let imageHTML;
    if (imageUrl) {
        imageHTML = `<img src="${imageUrl}" alt="${make} ${model}">`;
    } else {
        imageHTML = '<div style="width: 150px; height: 100px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af; border-radius: 5px;">No image</div>';
    }
    
    return `
        <div class="purchase-item">
            ${imageHTML}
            <div style="flex: 1;">
                <h3 style="margin-bottom: 0.5rem;">${make} ${model}</h3>
                <p style="color: #6b7280;">Year: ${year} | ${mileage} miles</p>
                <p style="color: #6b7280;">Purchased on: ${date}</p>
                <p style="font-size: 1.5rem; font-weight: bold; color: #10b981; margin-top: 0.5rem;">${price} ₸</p>
            </div>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    
    if (user) {
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');
        const userInitial = document.getElementById('user-initial');
        
        if (userMenu) {
            userMenu.style.display = 'flex';
            
            if (userName) {
                userName.textContent = user.name;
            }
            
            if (userInitial) {
                userInitial.textContent = user.name.charAt(0).toUpperCase();
            }
        }
    }
    
    loadPurchases();
});