const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const DB_FILE = path.join(__dirname, 'db.json');

function sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

function generateId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const id = (timestamp + random).toString().slice(-8);
    return id;
}

async function initDB() {
    try {
        await fs.access(DB_FILE);
    } catch {
        const initialData = {
            users: [],
            ads: [],
            purchases: []
        };
        await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

async function readDB() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading DB:', error);
        throw error;
    }
}

async function writeDB(data) {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing DB:', error);
        throw error;
    }
}

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const db = await readDB();
        
        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const newUser = {
            id: generateId(),
            name,
            email,
            password: sha256(password),
            role: 'user'
        };
        
        db.users.push(newUser);
        await writeDB(db);
        
        res.status(201).json({ 
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
            message: 'Registration successful' 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const db = await readDB();
        const hashedPassword = sha256(password);
        const user = db.users.find(u => u.email === email && u.password === hashedPassword);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        res.json({ 
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            message: 'Login successful' 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/cars', async (req, res) => {
    try {
        res.json([]);
    } catch (error) {
        console.error('Error reading cars:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/cars/approved', async (req, res) => {
    try {
        const db = await readDB();
        const approvedCars = db.ads.filter(ad => ad.ad && ad.ad.status === 'approved').map(ad => ad.ad);
        res.json(approvedCars);
    } catch (error) {
        console.error('Error reading approved cars:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/cars/:id', async (req, res) => {
    try {
        const db = await readDB();
        const car = db.ads.map(ad => ad.ad).filter(Boolean).find(c => c && c.id === req.params.id);
        
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        res.json(car);
    } catch (error) {
        console.error('Error reading car:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/cars/:id', async (req, res) => {
    try {
        const db = await readDB();
        const carId = req.params.id;
        
        const adIndex = db.ads.findIndex(a => a.ad && String(a.ad.id) === String(carId));
        if (adIndex !== -1) {
            db.ads.splice(adIndex, 1);
            await writeDB(db);
            return res.json({ message: 'Car deleted successfully' });
        }
        
        return res.status(404).json({ error: 'Car not found' });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.post('/api/ads', async (req, res) => {
    try {
        const { make, model, year, price, mileage, color, description, image, userId, status } = req.body;
        
        if (!make || !model || !year || !price || !mileage || !color || !userId) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        
        const db = await readDB();
        
        const user = db.users.find(u => u.id === userId);
        const userInfo = user ? {
            id: user.id,
            name: user.name,
            email: user.email
        } : {
            id: userId,
            name: 'Unknown',
            email: 'Unknown'
        };
        
        const adInfo = {
            id: generateId(),
            make,
            model,
            year: parseInt(year),
            price: parseFloat(price),
            mileage: parseInt(mileage),
            color,
            description: description || '',
            image: image || '',
            status: status || 'pending',
            createdAt: new Date().toISOString()
        };
        
        const newAd = {
            user: userInfo,
            ad: adInfo
        };
        
        db.ads.push(newAd);
        await writeDB(db);
        
        res.status(201).json(newAd);
    } catch (error) {
        console.error('Error creating ad:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/ads', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.ads);
    } catch (error) {
        console.error('Error reading ads:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/ads/pending', async (req, res) => {
    try {
        const db = await readDB();
        const pendingAds = db.ads.filter(ad => ad.ad && ad.ad.status === 'pending');
        res.json(pendingAds);
    } catch (error) {
        console.error('Error reading pending ads:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/ads/approved', async (req, res) => {
    try {
        const db = await readDB();
        const approvedAds = db.ads.filter(ad => ad.ad && ad.ad.status === 'approved');
        res.json(approvedAds);
    } catch (error) {
        console.error('Error reading approved ads:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/ads/user/:userId', async (req, res) => {
    try {
        const db = await readDB();
        const userAds = db.ads.filter(ad => ad.user && ad.user.id === req.params.userId);
        res.json(userAds);
    } catch (error) {
        console.error('Error reading user ads:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/ads/:id', async (req, res) => {
    try {
        const db = await readDB();
        const ad = db.ads.find(a => a.ad && a.ad.id === req.params.id);
        
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }
        
        res.json(ad);
    } catch (error) {
        console.error('Error reading ad:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/ads/:id', async (req, res) => {
    try {
        const db = await readDB();
        const adIndex = db.ads.findIndex(a => a.ad && a.ad.id === req.params.id);
        
        if (adIndex === -1) {
            return res.status(404).json({ error: 'Ad not found' });
        }
        
        const { make, model, year, price, mileage, color, description, image, status } = req.body;
        
        if (db.ads[adIndex].ad) {
            db.ads[adIndex].ad = {
                ...db.ads[adIndex].ad,
                make: make || db.ads[adIndex].ad.make,
                model: model || db.ads[adIndex].ad.model,
                year: year ? parseInt(year) : db.ads[adIndex].ad.year,
                price: price ? parseFloat(price) : db.ads[adIndex].ad.price,
                mileage: mileage ? parseInt(mileage) : db.ads[adIndex].ad.mileage,
                color: color || db.ads[adIndex].ad.color,
                description: description !== undefined ? description : db.ads[adIndex].ad.description,
                image: image !== undefined ? image : db.ads[adIndex].ad.image,
                status: status !== undefined ? status : db.ads[adIndex].ad.status
            };
        }
        
        await writeDB(db);
        
        res.json(db.ads[adIndex]);
    } catch (error) {
        console.error('Error updating ad:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/ads/:id/approve', async (req, res) => {
    try {
        const db = await readDB();
        const adIndex = db.ads.findIndex(a => a.ad && a.ad.id === req.params.id);
        
        if (adIndex === -1) {
            return res.status(404).json({ error: 'Ad not found' });
        }
        
        if (db.ads[adIndex].ad) {
            db.ads[adIndex].ad.status = 'approved';
        }
        await writeDB(db);
        
        res.json(db.ads[adIndex]);
    } catch (error) {
        console.error('Error approving ad:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/ads/:id/reject', async (req, res) => {
    try {
        const db = await readDB();
        const adIndex = db.ads.findIndex(a => a.ad && a.ad.id === req.params.id);
        
        if (adIndex === -1) {
            return res.status(404).json({ error: 'Ad not found' });
        }
        
        if (db.ads[adIndex].ad) {
            db.ads[adIndex].ad.status = 'rejected';
        }
        await writeDB(db);
        
        res.json(db.ads[adIndex]);
    } catch (error) {
        console.error('Error rejecting ad:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/ads/:id', async (req, res) => {
    try {
        const db = await readDB();
        const adId = req.params.id;
        
        const adIndex = db.ads.findIndex(a => a.ad && String(a.ad.id) === String(adId));
        
        if (adIndex === -1) {
            return res.status(404).json({ error: 'Ad not found' });
        }
        
        db.ads.splice(adIndex, 1);
        await writeDB(db);
        
        res.json({ message: 'Ad deleted successfully' });
    } catch (error) {
        console.error('Error deleting ad:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.post('/api/purchases', async (req, res) => {
    try {
        const { userId, carId, carData } = req.body;
        
        if (!userId || !carId) {
            return res.status(400).json({ error: 'User ID and car ID are required' });
        }
        
        const db = await readDB();
        
        const user = db.users.find(u => u.id === userId);
        const userInfo = user ? {
            id: user.id,
            name: user.name,
            email: user.email
        } : {
            id: userId,
            name: 'Unknown',
            email: 'Unknown'
        };
        
        const purchaseInfo = {
            id: generateId(),
            carId,
            carData: carData || {},
            purchaseDate: new Date().toISOString()
        };
        
        let userPurchaseIndex = db.purchases.findIndex(p => p.user && p.user.id === userId);
        
        if (userPurchaseIndex !== -1) {
            db.purchases[userPurchaseIndex].purchases.push(purchaseInfo);
        } else {
            const newPurchase = {
                user: userInfo,
                purchases: [purchaseInfo]
            };
            db.purchases.push(newPurchase);
        }
        
        await writeDB(db);
        
        res.status(201).json(purchaseInfo);
    } catch (error) {
        console.error('Error creating purchase:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/purchases/user/:userId', async (req, res) => {
    try {
        const db = await readDB();
        const userPurchase = db.purchases.find(p => p.user && p.user.id === req.params.userId);
        
        if (!userPurchase) {
            return res.json({ user: { id: req.params.userId }, purchases: [] });
        }
        
        res.json(userPurchase);
    } catch (error) {
        console.error('Error reading purchases:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

async function startServer() {
    await initDB();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Moderator login: moderator@autoline.kz / barcelonatop1`);
        console.log(`Moderator ID: 1`);
    });
}

startServer().catch(console.error);

