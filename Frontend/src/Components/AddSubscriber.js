import { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";

function AddSubscriber() {
  const navigate = useNavigate();
  const location = useLocation();

  const isFromAdmin = location.state?.fromAdmin === true;

  const [formData, setFormData] = useState({
    nume: '',
    email: '',
    telefon: '',
    parola: ''
  });

  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Trimitem datele:", formData);

    try {
      const res = await fetch('http://localhost/add_subscriber.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      console.log("Răspunsul server:", result);

      if (result.success) {
        setStatus('Cont creat cu succes!');
        setStatusType('success');
        setAccountCreated(true);
        setFormData({ nume: '', email: '', telefon: '', parola: '' });
      } else {
        setStatus(`Eroare: ${result.error || 'necunoscută'}`);
        setStatusType('error');
        setAccountCreated(false);
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare la conectare server');
      setStatusType('error');
      setAccountCreated(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <h1 style={styles.logo} onClick={() => navigate("/")}>
          Park&Go
        </h1>
      </nav>

      {/* Register Section */}
      <div style={styles.registerSection}>
        <div style={styles.card}>
          <h2 style={styles.title}>Creare Cont</h2>
          <p style={styles.subtitle}>
            Completează datele pentru a te înregistra în sistemul Park&Go
          </p>

          <div style={styles.form}>
            <input
              type="text"
              name="nume"
              placeholder="Nume complet"
              value={formData.nume}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="text"
              name="telefon"
              placeholder="Telefon"
              value={formData.telefon}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="password"
              name="parola"
              placeholder="Parolă"
              value={formData.parola}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <button
              onClick={handleSubmit}
              style={styles.button}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#15803d')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#16a34a')}
            >
              Creează cont
            </button>
          </div>

          {status && (
            <p
              style={{
                ...styles.status,
                color: statusType === 'success' ? '#15803d' : '#dc2626'
              }}
            >
              {status}
            </p>
          )}

          {accountCreated && (
            <div style={styles.afterCreateButtons}>
              <button
                onClick={() => navigate('/login')}
                style={styles.loginButton}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#15803d')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#16a34a')}
              >
                Autentificare
              </button>

              {isFromAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  style={styles.adminBackButton}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#4b5563')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#6b7280')}
                >
                  Înapoi la gestionare utilizatori
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={{ margin: 0 }}>Park&Go © 2026</p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(to bottom, #f0fdf4, #ffffff)",
    fontFamily: "sans-serif",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    background: "#ffffff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },

  logo: {
    color: "#16a34a",
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
    cursor: "pointer",
  },

  registerSection: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px 16px",
  },

  card: {
    background: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    padding: '48px',
    maxWidth: '480px',
    width: '100%',
    margin: '0 auto',
    textAlign: 'center',
  },

  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#15803d',
    marginBottom: '8px',
    marginTop: 0,
  },

  subtitle: {
    fontSize: '15px',
    color: '#6b7280',
    marginBottom: '32px',
    lineHeight: '1.6',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    textAlign: 'left',
  },

  input: {
    padding: '12px 16px',
    fontSize: '15px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    color: '#374151',
    background: '#f9fafb',
  },

  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s',
  },

  status: {
    marginTop: '20px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '15px',
  },

  afterCreateButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '22px',
  },

  loginButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },

  adminBackButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#6b7280',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },

  footer: {
    background: "#f3f4f6",
    textAlign: "center",
    padding: "24px",
    color: "#6b7280",
    fontSize: "14px",
  },
};

export default AddSubscriber;



