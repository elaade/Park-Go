import { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";

function Login({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', parola: '' });
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Trimitem datele:", formData);

    try {
      const res = await fetch('http://localhost/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      console.log("Răspuns server:", result);

      if (result.success) {
        const subscriber = {
          ...result.subscriber,
          role: result.subscriber.role || "user",
        };

        onLogin(subscriber);

        setStatus('Conectare reușită! Redirecționăm...');
        setStatusType('success');

        setTimeout(() => {
          if (subscriber.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/account");
          }
        }, 1000);
      } else {
        setStatus(`${result.error || 'Email sau parolă greșită'}`);
        setStatusType('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare la conectare server');
      setStatusType('error');
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

      {/* Login Section */}
      <div style={styles.loginSection}>
        <div style={styles.card}>
          <h2 style={styles.title}>Conectare cont</h2>
          <p style={styles.subtitle}>Introdu datele tale pentru a accesa Park&Go</p>

          <form onSubmit={handleSubmit} style={styles.form}>
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
              type="password"
              name="parola"
              placeholder="Parolă"
              value={formData.parola}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <button
              type="submit"
              style={styles.button}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#15803d')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#16a34a')}
            >
              Conectare
            </button>
          </form>

          {status && (
            <p
              style={{
                ...styles.status,
                color: statusType === 'success' ? '#15803d' : '#dc2626',
              }}
            >
              {status}
            </p>
          )}

          <p style={styles.registerText}>
            Nu ai cont?{' '}
            <Link to="/register" style={styles.registerLink}>
              Creează unul
            </Link>
          </p>
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

  loginSection: {
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

  registerText: {
    marginTop: '20px',
  },

  registerLink: {
    color: '#16a34a',
    textDecoration: 'underline',
  },

  footer: {
    background: "#f3f4f6",
    textAlign: "center",
    padding: "24px",
    color: "#6b7280",
    fontSize: "14px",
  },
};

export default Login;

