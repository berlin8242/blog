const connexionForm = document.getElementById('connexion-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

connexionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  // Vérifier les informations de connexion avec une base de données ou un système d'authentification

  if (validateCredentials(email, password)) {
    const formData = {
      email: emailInput.value,
      password: passwordInput.value
    };
    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then(response => response.json().then(data => ({ status: response.status, body: data })))
      .then(({ status, body }) => {
        if (status !== 200) {
          throw new Error(body.message || 'Erreur lors de la connexion');
        }
        console.log('Connexion etablie', body);
        // Rediriger vers la liste des articles
        window.location.href = 'articles.html';
      })
      .catch(error => {
        console.error('Erreur:', error.message);
        alert('Erreur lors de la connexion: ' + error.message);
      });
  } else {
    // Afficher un message d'erreur
    displayErrorMessage('Nom d\'utilisateur ou mot de passe incorrect');
  }
});

function displayErrorMessage(message) {
  // Afficher un message d'erreur de manière sécurisée
  const errorMessage = document.createElement('p');
  errorMessage.textContent = message;
  errorMessage.style.color = 'red';
  connexionForm.appendChild(errorMessage);
}

function validateCredentials(email, password) {
  if (email === '') {
    return false;
  }

  if (password === '') {
    return false;
  }
  return true;
}