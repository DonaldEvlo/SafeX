import React from 'react';
import styles from '../styles/HomeStyle.module.css';
const Home = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={styles.logo}>
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>SafeX</h2>
        </div>
        <nav className={styles.nav}>
          <a className={styles.navLink} href="#">Download</a>
          <a className={styles.navLink} href="#">Features</a>
          <a className={styles.navLink} href="#">Pricing</a>
          <a className={styles.navLink} href="#">Support</a>
        </nav>
       <button 
    className={styles.button}
    onClick={() => navigate('/login')}
  >
    Connexion
  </button>
      </header>

      <main>
        {/* Hero Section */}
        <section
          className={styles.hero}
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBckRuOLOcgZSI3bTwndARuDGlgTdkq5Xx1Qlr4fegnOQRdZ3uJCoeSVGTiycM8xvGOczVE7eo6CeZ9EKEKTFdS1zDaBdwsO0iPnQgmkosNp7iTqyzGE-VkFckwuGBluRlxXqinrwLC6xNKj8F9ZkVXkQL1-hz4ePfwN_Kt1zJU5NCs7OlHSoyUaW3dWe4uzC_BMxTi9Tz6XsaBbpO5epGhEhPCUo5LSyqTwIX57-sU2AWRZUXa2tJ4lhnAXA70H4bFqhQxwXAH0t-L')`,
          }}
        >
          <h1>Your conversations, protected.</h1>
          <p>
            SafeX est une plateforme de messagerie ultra sécurisée, intégrant le chiffrement quantique et un audit complet des activités pour garantir la confidentialité totale.
          </p>
          <a href="/login" className={styles.button}>
            Accéder à la plateforme
          </a>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className={styles.featureCard}>
            <h3>Chiffrement quantique (QKD)</h3>
            <p>Protège vos clés de chiffrement contre toute interception, même par des ordinateurs quantiques.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Audit des actions</h3>
            <p>Chaque action importante est enregistrée et consultable par les administrateurs.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Sessions sécurisées</h3>
            <p>Déconnexion automatique après inactivité pour une meilleure sécurité.</p>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <h2>Commencez à chatter en toute sécurité.</h2>
          <p>
            Rejoignez SafeX et échangez sans crainte. Notre priorité est votre vie privée, aujourd'hui et demain.
          </p>
          <a href="/login" className={styles.button}>
            Créer un compte
          </a>
        </section>
      </main>

      <footer style={{ 
        textAlign: 'center', 
        fontSize: '0.875rem', 
        color: '#94a3b8', 
        padding: '2rem 0',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        © {new Date().getFullYear()} SafeX. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;