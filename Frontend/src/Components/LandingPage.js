import React from "react";
import { useNavigate } from "react-router-dom";
import { FaCar, FaTicketAlt, FaClipboardCheck, FaRobot } from "react-icons/fa";
import {
  AiOutlineCamera,
  AiOutlineUnlock,
  AiOutlineClockCircle,
  AiOutlineCheck,
} from "react-icons/ai";

export default function LandingPage() {
  const navigate = useNavigate();

  const benefits = [
    { icon: <FaCar size={40} color="#16a34a" />, text: "Acces rapid fără oprire" },
    { icon: <FaTicketAlt size={40} color="#16a34a" />, text: "Fără bilete sau carduri" },
    { icon: <FaClipboardCheck size={40} color="#16a34a" />, text: "Control complet asupra parcării" },
    { icon: <FaRobot size={40} color="#16a34a" />, text: "Automatizare inteligentă" },
  ];

  const steps = [
    { icon: <AiOutlineCamera size={40} color="#16a34a" />, text: "Camera detectează vehiculul" },
    { icon: <AiOutlineCheck size={40} color="#16a34a" />, text: "Sistemul identifică numărul" },
    { icon: <AiOutlineClockCircle size={40} color="#16a34a" />, text: "Verifică accesul în timp real" },
    { icon: <AiOutlineUnlock size={40} color="#16a34a" />, text: "Bariera se deschide automat" },
  ];

  const priceRows = [
    { zile: 1, pret: 35 },
    { zile: 2, pret: 65 },
    { zile: 3, pret: 90 },
    { zile: 4, pret: 115 },
    { zile: 5, pret: 140 },
    { zile: 6, pret: 165 },
    { zile: 7, pret: 185 },
    { zile: 8, pret: 205 },
    { zile: 9, pret: 225 },
    { zile: 10, pret: 245 },
    { zile: 11, pret: 265 },
    { zile: 12, pret: 285 },
    { zile: 13, pret: 305 },
    { zile: 14, pret: 320 },
  ];

  const subscriptions = [
    {
      denumire: "Abonament Lunar",
      perioada: "1 lună",
      pret: "399 lei",
      descriere: "Potrivit pentru utilizatorii care folosesc frecvent parcarea.",
    },
    {
      denumire: "Abonament Anual",
      perioada: "1 an",
      pret: "3990 lei",
      descriere: "Variantă avantajoasă pentru acces pe termen lung.",
    },
  ];

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <h1 style={styles.logo} onClick={() => navigate("/")}>
          Park&Go
        </h1>
      </nav>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroCard}>
          <h2 style={styles.heroTitle}>Acces inteligent în parcare</h2>
          <p style={styles.heroText}>
            Elimină timpul pierdut la intrare și gestionează parcările eficient
            cu tehnologia de recunoaștere automată a numerelor de înmatriculare.
          </p>
          <div style={styles.heroButtons}>
            <button onClick={() => navigate("/register")} style={styles.buttonPrimary}>
              Creează cont / Începe acum
            </button>
            <button onClick={() => navigate("/login")} style={styles.buttonSecondary}>
              Autentificare
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section style={styles.aboutSection}>
        <div style={styles.aboutCard}>
          <h3 style={styles.sectionTitle}>Ce oferă Park&Go?</h3>

          <p style={styles.aboutText}>
            Park&Go este o aplicație pentru administrarea inteligentă a accesului
            într-o parcare, folosind recunoașterea automată a numerelor de
            înmatriculare. Utilizatorii își pot crea cont, pot adăuga vehicule,
            pot rezerva un loc de parcare pentru o perioadă aleasă și pot urmări
            rezervările active direct din contul personal.
          </p>

          <p style={styles.aboutText}>
            Sistemul permite accesul doar utilizatorilor autorizați: cei care au
            o rezervare activă sau cei care dețin un abonament valid. Rezervările
            pot fi anulate înainte de data începerii, iar la intrarea în parcare
            locul este ocupat automat. La ieșire, locul este eliberat, iar
            disponibilitatea parcării se actualizează în timp real.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={styles.benefitsSection}>
        <h3 style={styles.sectionTitle}>Beneficii Park&Go</h3>
        <div style={styles.grid}>
          {benefits.map((item, i) => (
            <div key={i} style={styles.card}>
              <div style={{ marginBottom: "16px" }}>{item.icon}</div>
              <p style={styles.cardText}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prices Section */}
      <section style={styles.pricesSection}>
        <h3 style={styles.sectionTitle}>Tarife rezervări</h3>

        <p style={styles.sectionDescription}>
          Tarifele pentru rezervarea unui loc de parcare sunt calculate în
          funcție de numărul de zile selectat.
        </p>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Durată</th>
                <th style={styles.tableHeader}>Preț</th>
              </tr>
            </thead>
            <tbody>
              {priceRows.map((row) => (
                <tr key={row.zile}>
                  <td style={styles.tableCell}>
                    {row.zile} {row.zile === 1 ? "zi" : "zile"}
                  </td>
                  <td style={styles.tableCell}>{row.pret} lei</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={styles.smallNote}>
          Pentru rezervări mai mari de 14 zile sunt disponibile abonamente avantajoase.
        </p>
      </section>

      {/* Subscriptions Section */}
      <section style={styles.subscriptionsSection}>
        <h3 style={styles.sectionTitle}>Abonamente disponibile</h3>

        <p style={styles.sectionDescription}>
          Abonamentele oferă acces rapid în parcare pe perioada de valabilitate,
          fără a fi necesară o rezervare pentru fiecare intrare.
        </p>

        <div style={styles.subscriptionGrid}>
          {subscriptions.map((sub, index) => (
            <div key={index} style={styles.subscriptionCard}>
              <h4 style={styles.subscriptionTitle}>{sub.denumire}</h4>
              <p style={styles.subscriptionPrice}>{sub.pret}</p>
              <p style={styles.subscriptionPeriod}>{sub.perioada}</p>
              <p style={styles.subscriptionText}>{sub.descriere}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works Section */}
      <section style={styles.stepsSection}>
        <h3 style={styles.sectionTitle}>Cum funcționează</h3>
        <div style={styles.grid}>
          {steps.map((step, i) => (
            <div key={i} style={styles.stepCard}>
              <div style={{ marginBottom: "12px" }}>{step.icon}</div>
              <p style={styles.cardText}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

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

  heroSection: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px 16px",
  },

  heroCard: {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    padding: "48px",
    maxWidth: "720px",
    width: "100%",
    margin: "0 auto",
    textAlign: "center",
  },

  heroTitle: {
    fontSize: "40px",
    fontWeight: "800",
    color: "#15803d",
    marginBottom: "24px",
    marginTop: 0,
  },

  heroText: {
    fontSize: "18px",
    color: "#374151",
    marginBottom: "40px",
    lineHeight: "1.7",
  },

  heroButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  buttonPrimary: {
    padding: "14px 36px",
    background: "#16a34a",
    color: "#ffffff",
    borderRadius: "16px",
    fontSize: "17px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
  },

  buttonSecondary: {
    padding: "14px 36px",
    background: "#ffffff",
    color: "#374151",
    borderRadius: "16px",
    fontSize: "17px",
    fontWeight: "600",
    border: "1px solid #d1d5db",
    cursor: "pointer",
  },

  aboutSection: {
    padding: "80px 40px",
    background: "#ffffff",
  },

  aboutCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "40px",
    maxWidth: "1000px",
    margin: "0 auto",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },

  aboutText: {
    fontSize: "17px",
    color: "#374151",
    lineHeight: "1.8",
    marginBottom: "18px",
  },

  benefitsSection: {
    padding: "80px 40px",
    background: "#f9fafb",
  },

  pricesSection: {
    padding: "80px 40px",
    background: "#ffffff",
  },

  subscriptionsSection: {
    padding: "80px 40px",
    background: "#f9fafb",
  },

  stepsSection: {
    padding: "80px 40px",
    background: "#ffffff",
  },

  sectionTitle: {
    fontSize: "32px",
    fontWeight: "600",
    textAlign: "center",
    color: "#1f2937",
    marginBottom: "24px",
    marginTop: 0,
  },

  sectionDescription: {
    maxWidth: "760px",
    margin: "0 auto 36px auto",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "17px",
    lineHeight: "1.7",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  card: {
    padding: "32px",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  stepCard: {
    padding: "32px",
    background: "#f0fdf4",
    borderRadius: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  cardText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#374151",
    margin: 0,
  },

  tableWrapper: {
    maxWidth: "720px",
    margin: "0 auto",
    overflowX: "auto",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeader: {
    background: "#16a34a",
    color: "#ffffff",
    padding: "16px",
    textAlign: "left",
    fontSize: "16px",
  },

  tableCell: {
    padding: "14px 16px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: "15px",
    fontWeight: "500",
  },

  smallNote: {
    maxWidth: "720px",
    margin: "18px auto 0 auto",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.6",
    textAlign: "center",
  },

  subscriptionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px",
    maxWidth: "900px",
    margin: "0 auto",
  },

  subscriptionCard: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "32px",
    textAlign: "center",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },

  subscriptionTitle: {
    color: "#166534",
    fontSize: "22px",
    fontWeight: "800",
    margin: "0 0 12px 0",
  },

  subscriptionPrice: {
    color: "#15803d",
    fontSize: "30px",
    fontWeight: "800",
    margin: "0 0 8px 0",
  },

  subscriptionPeriod: {
    color: "#6b7280",
    fontSize: "15px",
    fontWeight: "600",
    margin: "0 0 18px 0",
  },

  subscriptionText: {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: 0,
  },

  footer: {
    background: "#f3f4f6",
    textAlign: "center",
    padding: "24px",
    color: "#6b7280",
    fontSize: "14px",
  },
};

