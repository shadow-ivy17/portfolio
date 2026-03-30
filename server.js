// server.js
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const LOCAL_MONGO_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'krithee-portfolio';
const CONTACTS_COLLECTION = process.env.CONTACTS_COLLECTION || 'krithee-portfolio';
const RECONNECT_INTERVAL_MS = Number(process.env.DB_RECONNECT_INTERVAL_MS || 15000);
let isDbConnected = false;
let activeClient = null;
let activeConnectionLabel = null;
let reconnectTimer = null;

if (!MONGO_URI && !LOCAL_MONGO_URI) {
    console.error('Missing both MONGO_URI and LOCAL_MONGO_URI in .env');
    process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

async function connectDB() {
    if (isDbConnected && activeClient) {
        return true;
    }

    const candidates = [];

    if (MONGO_URI) {
        candidates.push({ label: 'primary', uri: MONGO_URI });
    }

    if (LOCAL_MONGO_URI && LOCAL_MONGO_URI !== MONGO_URI) {
        candidates.push({ label: 'fallback', uri: LOCAL_MONGO_URI });
    }

    for (const candidate of candidates) {
        const client = new MongoClient(candidate.uri);

        try {
            await client.connect();
            activeClient = client;
            isDbConnected = true;
            activeConnectionLabel = candidate.label;
            console.log(`✅ Connected to MongoDB (${candidate.label})`);
            return true;
        } catch (err) {
            console.error(`❌ MongoDB ${candidate.label} connection error:`, err.message);
            await client.close().catch(() => {});
        }
    }

    isDbConnected = false;
    activeConnectionLabel = null;
    console.error('❌ MongoDB unavailable: primary and fallback connections failed.');
    return false;
}

function startReconnectLoop() {
    if (reconnectTimer) {
        return;
    }

    reconnectTimer = setInterval(async () => {
        if (isDbConnected) {
            return;
        }

        console.log('Attempting MongoDB reconnection...');
        await connectDB();
    }, RECONNECT_INTERVAL_MS);
}

// Routes
app.get('/api/projects', (req, res) => {
    const projects = [
        { title: "TaskFlow", desc: "Real-time collaborative task manager", tech: "Node.js + MongoDB" },
        { title: "EcomSwift", desc: "Modern e-commerce platform", tech: "Express + MongoDB" },
        { title: "Blogify", desc: "Clean blogging platform", tech: "MERN Stack" }
    ];
    res.json(projects);
});

app.post('/api/contact', async (req, res) => {
    try {
        if (!isDbConnected) {
            return res.status(503).json({ success: false, message: "Database is unavailable. Please try again later." });
        }

        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const db = activeClient.db(DB_NAME);
        const collection = db.collection(CONTACTS_COLLECTION);

        await collection.insertOne({
            name,
            email,
            message,
            createdAt: new Date()
        });

        console.log(`New contact from ${name} (${email})`);
        res.json({ success: true, message: "Message saved successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        server: 'running',
        dbConnected: isDbConnected,
        dbConnection: activeConnectionLabel,
        dbName: DB_NAME
    });
});

// Serve frontend for all other routes
app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    connectDB();
    startReconnectLoop();
});

process.on('SIGINT', async () => {
    if (reconnectTimer) {
        clearInterval(reconnectTimer);
    }

    if (activeClient) {
        await activeClient.close().catch(() => {});
    }

    process.exit(0);
});