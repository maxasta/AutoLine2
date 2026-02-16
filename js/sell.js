const API_URL = 'http://localhost:3000/api';

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function showCreateForm() {
    document.getElementById('create-section').style.display = 'block';
    document.getElementById('my-ads-section').style.display = 'none';
    document.getElementById('create-tab').classList.add('active');
    document.getElementById('my-ads-tab').classList.remove('active');
}

function showMyAds() {
    document.getElementById('create-section').style.display = 'none';
    document.getElementById('my-ads-section').style.display = 'block';
    document.getElementById('my-ads-tab').classList.add('active');
    document.getElementById('create-tab').classList.remove('active');
    loadMyAds();
}

function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function() {
            resolve(reader.result);
        };
        reader.onerror = function(error) {
            reject(error);
        };
    });
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

    const adImageInput = document.getElementById('ad-image');
    if (adImageInput) {
        adImageInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                const preview = document.getElementById('image-preview');
                const previewImg = document.getElementById('preview-img');
                const base64 = await fileToBase64(file);
                previewImg.src = base64;
                preview.style.display = 'block';
            }
        });
    }

    const createForm = document.getElementById('create-ad-form');
    if (createForm) {
        createForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const user = checkAuth();
            if (!user) return;
            
            const submitBtn = createForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            const imageFile = document.getElementById('ad-image').files[0];
            if (!imageFile) {
                document.getElementById('create-error').textContent = 'Please select the car image';
                document.getElementById('create-error').style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            let imageBase64;
            try {
                imageBase64 = await fileToBase64(imageFile);
            } catch (error) {
                console.log('Error converting image:', error);
                document.getElementById('create-error').textContent = 'Image processing error. Please try again.';
                document.getElementById('create-error').style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            const adData = {
                make: document.getElementById('ad-make').value.trim(),
                model: document.getElementById('ad-model').value.trim(),
                year: parseInt(document.getElementById('ad-year').value),
                price: parseFloat(document.getElementById('ad-price').value),
                mileage: parseInt(document.getElementById('ad-mileage').value),
                color: document.getElementById('ad-color').value.trim(),
                description: document.getElementById('ad-description').value.trim(),
                image: imageBase64,
                userId: user.id,
                status: 'pending'
            };
            
            try {
                const response = await fetch(`${API_URL}/ads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(adData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById('create-success').textContent = 'Ad submitted for approval!';
                    document.getElementById('create-success').style.display = 'block';
                    document.getElementById('create-error').style.display = 'none';
                    document.getElementById('create-ad-form').reset();
                    document.getElementById('image-preview').style.display = 'none';
                    
                    setTimeout(function() {
                        document.getElementById('create-success').style.display = 'none';
                        showMyAds(); 
                    }, 2000);
                } else {
                    document.getElementById('create-error').textContent = data.error || 'Failed to create ad';
                    document.getElementById('create-error').style.display = 'block';
                    document.getElementById('create-success').style.display = 'none';
                }
            } catch (error) {
                console.log('Network error:', error);
                document.getElementById('create-error').textContent = 'Network error. Please try again.';
                document.getElementById('create-error').style.display = 'block';
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
    }

    const editImageInput = document.getElementById('edit-image');
    if (editImageInput) {
        editImageInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                const preview = document.getElementById('edit-image-preview');
                const previewImg = document.getElementById('edit-preview-img');
                const base64 = await fileToBase64(file);
                previewImg.src = base64;
                preview.style.display = 'block';
            }
        });
    }

    const editForm = document.getElementById('edit-ad-form');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const adId = document.getElementById('edit-ad-id').value;
            
            let imageBase64 = undefined;
            const imageFile = document.getElementById('edit-image').files[0];
            
            if (imageFile) {
                imageBase64 = await fileToBase64(imageFile);
            } else {
                const previewImg = document.getElementById('edit-preview-img');
                if (previewImg.src && previewImg.src.startsWith('data:')) {
                    imageBase64 = previewImg.src;
                }
            }
            
            const adData = {
                make: document.getElementById('edit-make').value.trim(),
                model: document.getElementById('edit-model').value.trim(),
                year: parseInt(document.getElementById('edit-year').value),
                price: parseFloat(document.getElementById('edit-price').value),
                mileage: parseInt(document.getElementById('edit-mileage').value),
                color: document.getElementById('edit-color').value.trim(),
                description: document.getElementById('edit-description').value.trim(),
                image: imageBase64 || undefined,
                status: 'pending'
            };
            
            try {
                const response = await fetch(`${API_URL}/ads/${adId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(adData)
                });
                
                if (response.ok) {
                    closeEditModal();
                    loadMyAds();
                }
            } catch (error) {
                console.log('Error updating ad:', error);
            }
        });
    }
});

async function loadMyAds() {
    const user = checkAuth();
    if (!user) return;
    
    try {
        const response = await fetch(`${API_URL}/ads/user/${user.id}`);
        const ads = await response.json();
        displayMyAds(ads);
    } catch (error) {
        console.log('Error loading ads:', error);
    }
}

function displayMyAds(ads) {
    const grid = document.getElementById('my-ads-grid');
    const noAds = document.getElementById('no-ads');
    
    if (!ads || ads.length === 0) {
        grid.innerHTML = '';
        if (noAds) {
            noAds.style.display = 'block';
        }
        return;
    }
    
    if (noAds) {
        noAds.style.display = 'none';
    }
    
    let cardsHTML = '';
    for (let i = 0; i < ads.length; i++) {
        cardsHTML += createAdCard(ads[i]);
    }
    grid.innerHTML = cardsHTML;
}

function createAdCard(adData) {
    const ad = adData.ad || adData;
    
    if (!ad || !ad.id) {
        console.log('Invalid ad data:', adData);
        return '';
    }
    
    const imageUrl = ad.image || '';
    
    let statusClass;
    let statusText;
    
    if (ad.status === 'approved') {
        statusClass = 'status-approved';
        statusText = 'Approved';
    } else if (ad.status === 'rejected') {
        statusClass = 'status-rejected';
        statusText = 'Rejected';
    } else {
        statusClass = 'status-pending';
        statusText = 'Pending';
    }
    
    const price = ad.price ? ad.price.toLocaleString() : '0';
    const mileage = ad.mileage ? ad.mileage.toLocaleString() : '0';
    const year = ad.year || 'N/A';
    const make = ad.make || '';
    const model = ad.model || '';
    
    let imageHTML;
    if (imageUrl) {
        imageHTML = `<img src="${imageUrl}" alt="${make} ${model}" style="width: 100%; height: 200px; object-fit: cover;">`;
    } else {
        imageHTML = '<div style="width: 100%; height: 200px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af;">No image</div>';
    }
    
    return `
        <div class="ad-card">
            <div style="position: relative;">
                ${imageHTML}
                <div class="status-badge ${statusClass}" style="position: absolute; top: 1rem; right: 1rem;">
                    ${statusText}
                </div>
            </div>
            <div class="ad-card-content" style="padding: 1.5rem;">
                <h3 style="font-size: 1.25rem; font-weight: bold; color: #2563eb; margin-bottom: 0.5rem;">${make} ${model}</h3>
                <p style="color: #6b7280; margin-bottom: 0.5rem;">Year: ${year} | ${price} ₸</p>
                <p style="color: #6b7280; margin-bottom: 0.5rem; font-size: 0.9rem;">Mileage: ${mileage} km</p>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button onclick="editAd('${ad.id}')" class="btn primary" style="flex: 1;">Edit</button>
                    <button onclick="deleteAd('${ad.id}')" class="btn" style="flex: 1; background: #dc2626; color: white;">Delete</button>
                </div>
            </div>
        </div>
    `;
}

async function editAd(adId) {
    try {
        const response = await fetch(`${API_URL}/ads/${adId}`);
        const adData = await response.json();
        const ad = adData.ad || adData;
        
        document.getElementById('edit-ad-id').value = ad.id;
        document.getElementById('edit-make').value = ad.make || '';
        document.getElementById('edit-model').value = ad.model || '';
        document.getElementById('edit-year').value = ad.year || '';
        document.getElementById('edit-price').value = ad.price || '';
        document.getElementById('edit-mileage').value = ad.mileage || '';
        document.getElementById('edit-color').value = ad.color || '';
        document.getElementById('edit-description').value = ad.description || '';
        
        if (ad.image) {
            const preview = document.getElementById('edit-image-preview');
            const previewImg = document.getElementById('edit-preview-img');
            previewImg.src = ad.image;
            preview.style.display = 'block';
        }
        
        document.getElementById('edit-modal').style.display = 'flex';
    } catch (error) {
        console.log('Error loading ad:', error);
    }
}

async function deleteAd(adId) {
    const user = checkAuth();
    if (!user) return;
    
    try {
        const response = await fetch(`${API_URL}/ads/${adId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            loadMyAds();
        }
    } catch (error) {
        console.log('Error deleting ad:', error);
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    document.getElementById('edit-image-preview').style.display = 'none';
    document.getElementById('edit-image').value = '';
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    window.location.href = 'login.html';
}

window.deleteAd = deleteAd;
window.editAd = editAd;
window.closeEditModal = closeEditModal;
window.showCreateForm = showCreateForm;
window.showMyAds = showMyAds;