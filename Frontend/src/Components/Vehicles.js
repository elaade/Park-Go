import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Vehicles() {
  const navigate = useNavigate();

  const [activeVehicles, setActiveVehicles] = useState([]);
  const [historyVehicles, setHistoryVehicles] = useState([]);

  const [showHistory, setShowHistory] = useState(false);
  const [status, setStatus] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchActiveVehicles = async () => {
    try {
      const res = await fetch("http://localhost/parking_active.php");
      const data = await res.json();

      if (!data.error) {
        setActiveVehicles(data);
        setStatus("");
      } else {
        setStatus("Eroare la preluarea vehiculelor active.");
      }
    } catch (err) {
      console.error("Eroare la preluarea vehiculelor active:", err);
      setStatus("Eroare server la preluarea vehiculelor active.");
    }
  };

  const fetchHistoryVehicles = async () => {
    try {
      const res = await fetch("http://localhost/parking_list.php");
      const data = await res.json();

      if (!data.error) {
        setHistoryVehicles(data);
        setHistoryStatus("");
      } else {
        setHistoryStatus("Eroare la preluarea istoricului.");
      }
    } catch (err) {
      console.error("Eroare la preluarea istoricului:", err);
      setHistoryStatus("Eroare server la preluarea istoricului.");
    }
  };

  useEffect(() => {
    fetchActiveVehicles();

    const interval = setInterval(fetchActiveVehicles, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchHistoryVehicles();
    }
  }, [showHistory]);

  const matchesSearch = (item, extraText = "") => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return true;

    const valuesText = Object.values(item || {})
      .map((value) => String(value ?? ""))
      .join(" ")
      .toLowerCase();

    return `${valuesText} ${extraText.toLowerCase()}`.includes(term);
  };

  const filteredActiveVehicles = activeVehicles.filter((v) =>
    matchesSearch(v, "în parcare in parcare activ activă intrare vehicul")
  );

  const filteredHistoryVehicles = historyVehicles.filter((v) =>
    matchesSearch(
      v,
      `${v.iesire ? "iesire ieșire iesit ieșit istoric" : "în parcare in parcare"} vehicul`
    )
  );

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Vehicule în parcare</h2>
            <p style={styles.subtitle}>
              Monitorizare vehicule aflate în parcare și istoric intrări/ieșiri.
            </p>
          </div>

          <button style={styles.backButton} onClick={() => navigate("/admin/dashboard")}>
            Înapoi la panou
          </button>
        </div>

        <div style={styles.actions}>
          <button style={styles.refreshButton} onClick={fetchActiveVehicles}>
            Reîmprospătează vehicule
          </button>

          <button
            style={styles.historyButton}
            onClick={() => setShowHistory((prev) => !prev)}
          >
            {showHistory ? "Ascunde istoric vehicule" : "Vezi istoric vehicule"}
          </button>
        </div>

        <div style={styles.searchBox}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Caută după vehicul, nume, statut, intrare sau ieșire..."
            style={styles.searchInput}
          />

          {searchTerm && (
            <button style={styles.clearSearchButton} onClick={() => setSearchTerm("")}>
              Șterge căutarea
            </button>
          )}
        </div>

        {status && <p style={styles.errorText}>{status}</p>}

        <h3 style={styles.sectionTitle}>Vehicule aflate în parcare</h3>

        {activeVehicles.length === 0 ? (
          <p style={styles.emptyText}>Nicio mașină în parcare momentan.</p>
        ) : filteredActiveVehicles.length === 0 ? (
          <p style={styles.emptyText}>Nu există rezultate pentru căutarea curentă.</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Număr înmatriculare</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>Nume</th>
                  <th style={styles.th}>Intrare</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredActiveVehicles.map((v, idx) => (
                  <tr
                    key={`${v.vehicul}-${idx}`}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#ffffff",
                    }}
                  >
                    <td style={styles.td}>
                      <strong>{v.vehicul}</strong>
                    </td>
                    <td style={styles.td}>{v.tip || "-"}</td>
                    <td style={styles.td}>{v.nume || "-"}</td>
                    <td style={styles.td}>{v.intrare || "-"}</td>
                    <td style={{ ...styles.td, color: "#15803d", fontWeight: "700" }}>
                      În parcare
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showHistory && (
          <>
            <div style={styles.historyHeader}>
              <h3 style={{ ...styles.sectionTitle, color: "#0ea5e9" }}>
                Istoric vehicule
              </h3>

              <button style={styles.refreshButton} onClick={fetchHistoryVehicles}>
                Reîmprospătează istoric
              </button>
            </div>

            {historyStatus && <p style={styles.errorText}>{historyStatus}</p>}

            {historyVehicles.length === 0 ? (
              <p style={styles.emptyText}>Nu există date înregistrate.</p>
            ) : filteredHistoryVehicles.length === 0 ? (
              <p style={styles.emptyText}>Nu există rezultate pentru căutarea curentă.</p>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Vehicul</th>
                      <th style={styles.th}>Statut</th>
                      <th style={styles.th}>Nume</th>
                      <th style={styles.th}>Intrare</th>
                      <th style={styles.th}>Ieșire</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredHistoryVehicles.map((v, idx) => (
                      <tr
                        key={`${v.vehicul || v.numar_inmatriculare}-${idx}`}
                        style={{
                          backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#ffffff",
                        }}
                      >
                        <td style={styles.td}>
                          <strong>{v.vehicul || v.numar_inmatriculare}</strong>
                        </td>
                        <td style={styles.td}>{v.tip || "-"}</td>
                        <td style={styles.td}>{v.abonat || v.nume || "-"}</td>
                        <td style={styles.td}>{v.intrare || "-"}</td>
                        <td
                          style={{
                            ...styles.td,
                            color:
                              v.iesire === "În parcare" || !v.iesire
                                ? "#15803d"
                                : "#dc2626",
                            fontWeight: "700",
                          }}
                        >
                          {v.iesire || "În parcare"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {hasSearch && (
          <p style={styles.searchInfo}>
            Căutare activă pentru: <strong>{searchTerm}</strong>
          </p>
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
    padding: "42px",
    maxWidth: "1100px",
    width: "100%",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },

  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#15803d",
    margin: 0,
  },

  subtitle: {
    fontSize: "15px",
    color: "#6b7280",
    marginTop: "8px",
    marginBottom: 0,
    lineHeight: "1.6",
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },

  backButton: {
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "700",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#6b7280",
    color: "#ffffff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  refreshButton: {
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: "700",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    cursor: "pointer",
  },

  historyButton: {
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: "700",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#0ea5e9",
    color: "#ffffff",
    cursor: "pointer",
  },

  searchBox: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  searchInput: {
    flex: 1,
    minWidth: "260px",
    padding: "12px 14px",
    fontSize: "14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    outline: "none",
    color: "#374151",
    background: "#f9fafb",
  },

  clearSearchButton: {
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: "700",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#6b7280",
    color: "#ffffff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  sectionTitle: {
    marginTop: "20px",
    color: "#15803d",
  },

  historyHeader: {
    marginTop: "34px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },

  tableContainer: {
    marginTop: "16px",
    maxHeight: "450px",
    overflowY: "auto",
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "center",
    fontSize: "14px",
    color: "#374151",
    minWidth: "850px",
  },

  th: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
    padding: "12px",
    borderBottom: "1px solid #bbf7d0",
    fontWeight: "700",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "middle",
  },

  emptyText: {
    color: "#6b7280",
    marginTop: "10px",
  },

  errorText: {
    color: "#dc2626",
    fontWeight: "700",
    marginTop: "10px",
  },

  searchInfo: {
    marginTop: "18px",
    color: "#6b7280",
    fontSize: "14px",
  },
};

export default Vehicles;