import { useNavigate } from "react-router-dom";

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Bun venit în panoul administrativ Park&Go</h2>

        <p style={styles.subtitle}>
          Alegeți o secțiune pentru a gestiona utilizatorii, accesul în parcare,
          vehiculele și situația generală a sistemului.
        </p>

        <div style={styles.category}>
          <h3 style={styles.categoryTitle}>Administrare</h3>

          <div style={styles.buttonsGrid}>
            <button style={styles.button} onClick={() => navigate("/admin")}>
              Utilizatori
            </button>

            <button
              style={{ ...styles.button, backgroundColor: "#14532d" }}
              onClick={() => navigate("/admin/overview")}
            >
              Situația generală
            </button>
          </div>
        </div>

        <div style={styles.category}>
          <h3 style={styles.categoryTitle}>Acces parcare</h3>

          <div style={styles.buttonsGrid}>
            <button style={styles.button} onClick={() => navigate("/parking/entry")}>
              Intrare parcare
            </button>

            <button style={styles.button} onClick={() => navigate("/parking/exit")}>
              Ieșire parcare
            </button>

            <button
              style={{ ...styles.button, backgroundColor: "#10b981" }}
              onClick={() => navigate("/admin/vehicles")}
            >
              Vehicule în parcare
            </button>
          </div>
        </div>

        {onLogout && (
          <div style={styles.logoutWrapper}>
            <button
              style={{ ...styles.button, ...styles.logoutButton }}
              onClick={onLogout}
            >
              Deconectare
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #f0fdf4, #ffffff)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 16px",
    fontFamily: "sans-serif",
  },

  card: {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    padding: "48px",
    maxWidth: "900px",
    width: "100%",
    textAlign: "center",
  },

  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#15803d",
    marginBottom: "8px",
  },

  subtitle: {
    fontSize: "15px",
    color: "#6b7280",
    marginBottom: "36px",
    lineHeight: "1.6",
  },

  category: {
    marginTop: "28px",
  },

  categoryTitle: {
    color: "#166534",
    fontSize: "18px",
    fontWeight: "800",
    marginBottom: "16px",
    textAlign: "center",
  },

  buttonsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 220px))",
    justifyContent: "center",
    gap: "14px",
  },

  button: {
    width: "100%",
    padding: "13px 16px",
    fontSize: "15px",
    fontWeight: "700",
    borderRadius: "16px",
    border: "none",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.2s",
    boxShadow: "0 4px 10px rgba(22, 163, 74, 0.18)",
  },

  logoutWrapper: {
    marginTop: "34px",
    display: "flex",
    justifyContent: "center",
  },

  logoutButton: {
    backgroundColor: "#6b7280",
    maxWidth: "220px",
    boxShadow: "0 4px 10px rgba(107, 114, 128, 0.18)",
  },
};

export default AdminDashboard;