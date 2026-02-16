const API_URL = 'http://localhost:3000/api';

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.email !== 'moderator@autoline.kz') {
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

async function loadAllAds() {
    try {
        const response = await fetch(`${API_URL}/ads`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const allAds = await response.json();
        
        console.log('Loaded ads from API:', allAds);
        
        if (!Array.isArray(allAds)) {
            console.error('API returned non-array:', allAds);
            throw new Error('Invalid data format from server');
        }
        
        const pendingAds = [];
        const approvedAds = [];
        const rejectedAds = [];
        
        allAds.forEach(adData => {
            const ad = adData.ad || adData;
            if (!ad || !ad.status) {
                console.warn('Invalid ad data:', adData);
                return;
            }
            
            if (ad.status === 'pending') {
                pendingAds.push(adData);
            } else if (ad.status === 'approved') {
                approvedAds.push(adData);
            } else if (ad.status === 'rejected') {
                rejectedAds.push(adData);
            }
        });
        
        console.log('Separated ads - Pending:', pendingAds.length, 'Approved:', approvedAds.length, 'Rejected:', rejectedAds.length);
        
        displayStatusSections(pendingAds, approvedAds, rejectedAds);
        
        localStorage.setItem('allAds', JSON.stringify(allAds));
    } catch (error) {
        console.error('Error loading ads:', error);
        showNotification('Error loading ads', 'error');
    }
}

function displayStatusSections(pendingAds, approvedAds, rejectedAds) {
    const pendingContainer = document.getElementById('pending-list');
    const pendingCount = document.getElementById('pending-count');
    if (pendingContainer) {
        if (pendingAds.length === 0) {
            pendingContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No pending ads</div>
                </div>
            `;
        } else {
            pendingContainer.innerHTML = pendingAds.map(ad => createAdCard(ad)).join('');
        }
    }
    if (pendingCount) {
        pendingCount.textContent = pendingAds.length;
    }
    
    const approvedContainer = document.getElementById('approved-list');
    const approvedCount = document.getElementById('approved-count');
    if (approvedContainer) {
        if (approvedAds.length === 0) {
            approvedContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No approved ads</div>
                </div>
            `;
        } else {
            approvedContainer.innerHTML = approvedAds.map(ad => createAdCard(ad)).join('');
        }
    }
    if (approvedCount) {
        approvedCount.textContent = approvedAds.length;
    }
    
    const rejectedContainer = document.getElementById('rejected-list');
    const rejectedCount = document.getElementById('rejected-count');
    if (rejectedContainer) {
        if (rejectedAds.length === 0) {
            rejectedContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No rejected ads</div>
                </div>
            `;
        } else {
            rejectedContainer.innerHTML = rejectedAds.map(ad => createAdCard(ad)).join('');
        }
    }
    if (rejectedCount) {
        rejectedCount.textContent = rejectedAds.length;
    }
}

function createAdCard(adData) {
    const ad = adData.ad || adData;
    
    if (!ad || !ad.id) {
        console.error('Invalid ad data:', adData);
        return '';
    }
    
    const imageUrl = ad.image || '';
    const price = ad.price ? ad.price.toLocaleString() : '0';
    const mileage = ad.mileage ? ad.mileage.toLocaleString() : '0';
    const year = ad.year || 'N/A';
    const make = ad.make || '';
    const model = ad.model || '';
    const userName = adData.user ? adData.user.name : 'Unknown';
    const status = ad.status || 'pending';
    
    return `
        <div class="status-card" data-ad-id="${ad.id}" data-status="${status}">
            <div class="status-card-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${make} ${model}">` : `<div class="no-image">No image</div>`}
            </div>
            <div class="status-card-content">
                <h4>${make} ${model}</h4>
                <p class="ad-id">ID: ${ad.id}</p>
                <p class="car-info">${year} - ${price} ₸</p>
                <p class="car-details">${mileage} mi, ${ad.color || 'N/A'}</p>
                <p class="owner-info">👤 ${userName}</p>
            </div>
            <div class="status-card-actions">
                ${status === 'pending' ? `
                    <button class="action-btn approve-btn" onclick="approveAd('${ad.id}')" title="Approve">
                        Approve
                    </button>
                    <button class="action-btn reject-btn" onclick="rejectAd('${ad.id}')" title="Reject">
                        Reject
                    </button>
                ` : status === 'approved' ? `
                    <button class="action-btn reject-btn" onclick="rejectAd('${ad.id}')" title="Reject">
                        Reject
                    </button>
                ` : `
                    <button class="action-btn approve-btn" onclick="approveAd('${ad.id}')" title="Approve">
                        Approve
                    </button>
                `}
            </div>
        </div>
    `;
}

async function approveAd(adId) {
    try {
        const response = await fetch(`${API_URL}/ads/${adId}/approve`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showNotification('Ad approved! Moving to Approved section...', 'success');
            await loadAllAds();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Failed to approve ad', 'error');
        }
    } catch (error) {
        console.error('Error approving ad:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function rejectAd(adId) {
    try {
        const response = await fetch(`${API_URL}/ads/${adId}/reject`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showNotification('Ad rejected. Moving to Rejected section...', 'success');
            await loadAllAds();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Failed to reject ad', 'error');
        }
    } catch (error) {
        console.error('Error rejecting ad:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function updateLocalStorage() {
    try {
        const approvedResponse = await fetch(`${API_URL}/cars/approved`);
        if (approvedResponse.ok) {
            const approvedCars = await approvedResponse.json();
            localStorage.setItem('approvedCars', JSON.stringify(approvedCars));
        }
    } catch (error) {
        console.error('Error updating localStorage:', error);
    }
}

let searchTimeout;

async function performSearch() {
    const searchInput = document.getElementById('search-ads');
    const query = searchInput ? searchInput.value.trim() : '';
    
    if (!query) {
        clearSearch();
        return;
    }
    
    await searchAds(query);
}

async function searchAds(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!query) {
        clearSearch();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/ads`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const ads = await response.json();
        
        const filtered = ads.filter(adData => {
            const ad = adData.ad || adData;
            const user = adData.user || {};
            
            if (!ad) return false;
            
            const adId = ad.id ? ad.id.toString() : '';
            const make = (ad.make || '').toLowerCase().trim();
            const model = (ad.model || '').toLowerCase().trim();
            const fullCarName = `${make} ${model}`.trim();
            
            const searchFields = [
                adId.toLowerCase(),
                make,
                model,
                fullCarName,
                (ad.year ? ad.year.toString() : ''),
                (ad.price ? ad.price.toString() : ''),
                (ad.color || '').toLowerCase(),
                (ad.description || '').toLowerCase(),
                (user.name || '').toLowerCase(),
                (user.email || '').toLowerCase()
            ];
            
            return searchFields.some(field => field && field.includes(searchTerm));
        });
        
        console.log(`Search for "${query}": found ${filtered.length} ads out of ${ads.length}`);
        
        const searchResultsSection = document.getElementById('search-results-section');
        const searchQueryText = document.getElementById('search-query-text');
        const searchResultsCount = document.getElementById('search-results-count');
        const searchResultsGrid = document.getElementById('search-results-grid');
        
        if (searchResultsSection) {
            searchResultsSection.classList.add('active');
        }
        
        if (searchQueryText) {
            searchQueryText.textContent = query;
        }
        
        if (searchResultsCount) {
            searchResultsCount.textContent = `Found ${filtered.length} ad(s)`;
            searchResultsCount.style.color = filtered.length > 0 ? '#059669' : '#dc2626';
        }
        
        if (searchResultsGrid) {
            if (filtered.length === 0) {
                searchResultsGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <div class="empty-state-text">No ads found matching "${query}"</div>
                    </div>
                `;
            } else {
                searchResultsGrid.innerHTML = filtered.map(ad => createAdCard(ad)).join('');
            }
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Error searching ads', 'error');
    }
}

function clearSearch() {
    const searchInput = document.getElementById('search-ads');
    const searchResultsSection = document.getElementById('search-results-section');
    
    if (searchInput) searchInput.value = '';
    if (searchResultsSection) {
        searchResultsSection.classList.remove('active');
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
        
        loadAllAds();
        updateLocalStorage();
        
        const searchInput = document.getElementById('search-ads');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length === 0) {
                    clearSearch();
                    return;
                }
                
                searchTimeout = setTimeout(() => {
                    performSearch();
                }, 300);
            });
        }
    }
});

window.clearSearch = clearSearch;
window.performSearch = performSearch;
window.approveAd = approveAd;
window.rejectAd = rejectAd;

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('allAds');
    localStorage.removeItem('approvedCars');
    localStorage.removeItem('pendingAds');
    localStorage.removeItem('approvedAds');
    window.location.href = 'login.html';
}