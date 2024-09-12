const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const argon2 = require('argon2');

// Configuration du serveur Express
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration de PostgreSQL
const db = new Client({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    port: '5433',
    database: 'postgres',   
});


db.connect()
    .then(() => console.log('Connecté à PostgreSQL'))
    .catch(err => console.error('Erreur de connexion à PostgreSQL', err));

// Inscription d'un utilisateur avec hachage du mot de passe (Argon2)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Hacher le mot de passe avec Argon2
    try {
        const hashedPassword = await argon2.hash(password);
        const result = await db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id', 
            [username, hashedPassword]
        );
        res.status(201).json({ message: 'Utilisateur créé', userId: result.rows[0].id });
    } catch (err) {
        console.error('Erreur lors de la création de l\'utilisateur', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Connexion d'un utilisateur avec vérification du mot de passe
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // Vérification du mot de passe
            if (await argon2.verify(user.password, password)) {
                res.status(200).json({ message: 'Connexion réussie', userId: user.id });
            } else {
                res.status(401).json({ message: 'Mot de passe incorrect' });
            }
        } else {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
    } catch (err) {
        console.error('Erreur lors de la connexion', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer tous les articles
app.get('/articles', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM articles');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des articles', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Ajouter un article
app.post('/articles', async (req, res) => {
    const { title, content, author_id } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO articles (title, content, author_id) VALUES ($1, $2, $3) RETURNING id',
            [title, content, author_id]
        );
        res.status(201).json({ message: 'Article créé', articleId: result.rows[0].id });
    } catch (err) {
        console.error('Erreur lors de la création de l\'article', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
