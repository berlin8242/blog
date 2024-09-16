const express = require('express');
const bodyParser = require('body-parser');
const argon2 = require('argon2');
const cors = require('cors');
require('dotenv').config();

const { Pool } = require('pg');
const pool = new Pool({
  user: "postgres",
  password: "password",
  host: "localhost",
  port: "5433",
  database: "postgres",
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error executing query', err.stack);
  } else {
    console.log('Connection successful:', res.rows);
  }
});

// Création de l'application Express
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use('/images', express.static('images'));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Fonction pour la connexion à la base de données (utilise le pool existant)
async function connectToDatabase() {
  return pool;  // Retourne l'instance de pool existante
}

// Fonction pour la connexion d'un utilisateur
async function loginUser(email, password) {
  const client = await connectToDatabase();
  const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length > 0) {
    const user = result.rows[0];
    if (await argon2.verify(user.password, password)) {
      return user.id;
    } else {
      throw new Error('Mot de passe incorrect');
    }
  } else {
    throw new Error('Utilisateur non trouvé');
  }
}

// Fonction pour récupérer les articles
async function getArticles() {
  const client = await connectToDatabase();
  const result = await client.query('SELECT * FROM articles JOIN users ON articles.author = users.id');
  return result.rows;
}

// Fonction pour ajouter un article
async function addArticle(title, content, author, image) {
  const client = await connectToDatabase();
  const result = await client.query(
    'INSERT INTO articles (title, content, author, image) VALUES ($1, $2, $3, $4) RETURNING id',
    [title, content, author, image]
  );
  return result.rows[0].id;
}

async function createUser(email, password) {
  const client = await connectToDatabase();
  const hashedPassword = await argon2.hash(password);
  const result = await client.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
    [email, hashedPassword]
  );
  return result.rows[0].id;
}
// Routes
app.post('/register', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    console.log(email, password);
    const userId = await createUser(email, password);
    res.status(201).json({ message: 'Utilisateur créé', userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    console.log(email, password);
    const userId = await loginUser(email, password);
    res.status(200).json({ message: 'Connexion réussie', userId });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Mot de passe incorrect' });
  }
});

app.get('/articles/:id', async (req, res) => {
  const articleId = parseInt(req.params.id, 10);

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'ID d\'article invalide' });
  }

  try {
    const client = await connectToDatabase();
    const result = await client.query('SELECT * FROM articles WHERE id = $1', [articleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    const article = result.rows[0];
    res.status(200).json(article);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
app.get('/articles', async (req, res) => {
  try {
    const articles = await getArticles();
    res.status(200).json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/articles', async (req, res) => {
  try {
    const title = req.body.title;
    const content = req.body.content;
    const author = req.body.author;
    const image = req.body.image;
    const article = await addArticle(title, content, author, image);
    res.status(201).json({ message: 'Article créé', id: article.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Démarrage de l'application
const port = 3000;
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
