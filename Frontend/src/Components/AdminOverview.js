import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminOverview() {
  const navigate = useNavigate();

  const [adminData, setAdminData] = useState({
    stats: {},
    recent_payments: [],
    active_subscriptions: [],
    active_reservations: [],
    reservation_history: [],
    subscription_history: [],
  });

  const [adminStatus, setAdminStatus] = useState("");
  const [adminStatusType, setAdminStatusType] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAdminOverview = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost/admin_overview.php");
      const text = await res.text();

      console.log("RASPUNS ADMIN OVERVIEW:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        setAdminStatus("PHP nu returnează JSON valid pentru situația generală.");
        return;
      }

      if (data.success) {
        setAdminData({
          stats: data.stats || {},
          recent_payments: data.recent_payments || [],
          active_subscriptions: data.active_subscriptions || [],
          active_reservations: data.active_reservations || [],
          reservation_history: data.reservation_history || [],
          subscription_history: data.subscription_history || [],
        });
        setAdminStatus("");
      } else {
        setAdminStatus(data.message || "Eroare la preluarea datelor admin");
        console.log(data.details);
      }
    } catch (err) {
      console.error("Eroare overview admin:", err);
      setAdminStatus("Eroare server la situația generală.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const cancelReservation = async (reservation) => {
    const reservationId = reservation.reservation_id;
    const abonatId = reservation.abonat_id || reservation.subscriber_id;

    if (!reservationId || !abonatId) {
      setAdminStatus(
        "Nu se poate anula rezervarea deoarece lipsesc reservation_id sau abonat_id în datele primite din admin_overview.php."
      );
      return;
    }

    const confirmare = window.confirm(
      `Sigur dorești să anulezi rezervarea pentru ${
        reservation.numar_inmatriculare || "acest vehicul"
      }?`
    );

    if (!confirmare) return;

    try {
      const res = await fetch("http://localhost/cancel_reservation.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservationId,
          abonat_id: abonatId,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setAdminStatus(`${result.message}`);
        setAdminStatusType("success");
        fetchAdminOverview();
      } else {
        setAdminStatus(result.message || "Eroare la anularea rezervării.");
        setAdminStatusType("error");
        console.log(result.details);
      }
    } catch (err) {
      console.error("Eroare anulare rezervare:", err);
      setAdminStatus("Eroare server la anularea rezervării.");
      setAdminStatusType("error");
    }
  };

  const translateReservationStatus = (status) => {
    if (status === "active") return "Activă";
    if (status === "completed") return "Finalizată";
    if (status === "expired") return "Expirată";
    if (status === "cancelled") return "Anulată";

    return status || "-";
  };

  const translateSubscriptionType = (tip) => {
    if (tip === "frequent_monthly") return "Abonament lunar frecvent";
    if (tip === "business_monthly") return "Abonament lunar business";
    if (tip === "annual_traveller") return "Abonament anual";

    return tip || "-";
  };

  const matchesSearch = (item, extraText = "") => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return true;

    const valuesText = Object.values(item || {})
      .map((value) => String(value ?? ""))
      .join(" ")
      .toLowerCase();

    return `${valuesText} ${extraText.toLowerCase()}`.includes(term);
  };

  const filteredPayments = adminData.recent_payments.filter((p) =>
    matchesSearch(
      p,
      `${Number(p.achitat) === 1 ? "achitat" : "neachitat"} ${p.suma ? `${p.suma} lei` : ""}`
    )
  );

  const filteredActiveSubscriptions = adminData.active_subscriptions.filter((s) =>
    matchesSearch(
      s,
      `${translateSubscriptionType(s.tip)} ${
        Number(s.achitat) === 1 ? "achitat achitată" : "neachitat neachitată"
      } ${s.suma ? `${s.suma} lei` : ""}`
    )
  );

  const filteredActiveReservations = adminData.active_reservations.filter((r) =>
    matchesSearch(
      r,
      `${translateReservationStatus(r.reservation_status)} ${
        Number(r.achitat) === 1 ? "achitat achitată" : "neachitat neachitată"
      } ${r.suma ? `${r.suma} lei` : ""}`
    )
  );

  const filteredReservationHistory = adminData.reservation_history.filter((r) =>
    matchesSearch(
      r,
      `${translateReservationStatus(r.reservation_status)} ${r.suma ? `${r.suma} lei` : ""}`
    )
  );

  const filteredSubscriptionHistory = adminData.subscription_history.filter((s) =>
    matchesSearch(
      s,
      `${translateSubscriptionType(s.tip)} ${
        Number(s.status_plata) === 1 ? "achitat" : "neachitat"
      } ${s.suma ? `${s.suma} lei` : ""}`
    )
  );

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Situație generală</h2>
            <p style={styles.subtitle}>
              Vizualizare plăți, abonamente, rezervări active și istoricul acestora.
            </p>
          </div>

          <button style={styles.backButton} onClick={() => navigate("/admin/dashboard")}>
            Înapoi la panou
          </button>
        </div>

        {adminStatus && (
          <p
            style={{
              ...styles.errorText,
              color: adminStatusType === "success" ? "#15803d" : "#dc2626",
            }}
          >
            {adminStatus}
          </p>
        )}

        <div style={styles.topActions}>
          <button style={styles.refreshButton} onClick={fetchAdminOverview}>
            {loading ? "Se încarcă..." : "Reîmprospătează datele"}
          </button>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Caută după client, email, vehicul, loc, cod plată, status..."
            style={styles.searchInput}
          />

          {searchTerm && (
            <button style={styles.clearSearchButton} onClick={() => setSearchTerm("")}>
              Șterge căutarea
            </button>
          )}
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <strong>Rezervări active</strong>
            <span>{adminData.stats.rezervari_active || 0}</span>
          </div>

          <div style={styles.statCard}>
            <strong>Rezervări expirate</strong>
            <span>{adminData.stats.rezervari_expirate || 0}</span>
          </div>

          <div style={styles.statCard}>
            <strong>Abonamente active</strong>
            <span>{adminData.stats.abonamente_active || 0}</span>
          </div>

          <div style={styles.statCard}>
            <strong>Plăți achitate</strong>
            <span>{adminData.stats.plati_achitate || 0}</span>
          </div>

          <div style={styles.statCard}>
            <strong>Încasări totale</strong>
            <span>{adminData.stats.incasari_totale || 0} lei</span>
          </div>
        </div>

        <SectionTitle title="Plăți recente" color="#15803d" />

        {adminData.recent_payments.length === 0 ? (
          <p style={styles.emptyText}>Nu există plăți recente.</p>
        ) : filteredPayments.length === 0 ? (
          <p style={styles.emptyText}>Nu există rezultate pentru căutarea curentă.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={styles.th}>Cod</th>
                <th style={styles.th}>Tip</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Vehicul</th>
                <th style={styles.th}>Suma</th>
                <th style={styles.th}>Metodă</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Data</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map((p, idx) => (
                <tr key={p.id} style={rowStyle(idx)}>
                  <td style={styles.td}>{p.cod_bare || "-"}</td>
                  <td style={styles.td}>{p.tip_plata || "-"}</td>
                  <td style={styles.td}>{p.nume || "-"}</td>
                  <td style={styles.td}>{p.numar_inmatriculare || "-"}</td>
                  <td style={styles.td}>{p.suma ? `${p.suma} lei` : "-"}</td>
                  <td style={styles.td}>{p.metoda_plata || "-"}</td>
                  <td style={styles.td}>
                    {Number(p.achitat) === 1 ? (
                      <span style={styles.badgePaid}>Achitat</span>
                    ) : (
                      <span style={styles.badgeUnpaid}>Neachitat</span>
                    )}
                  </td>
                  <td style={styles.td}>{p.created_at || p.data_plata || "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <SectionTitle title="Abonamente active" color="#166534" />

        {adminData.active_subscriptions.length === 0 ? (
          <p style={styles.emptyText}>Nu există abonamente active.</p>
        ) : filteredActiveSubscriptions.length === 0 ? (
          <p style={styles.emptyText}>Nu există rezultate pentru căutarea curentă.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Tip</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>Expirare</th>
                <th style={styles.th}>Suma</th>
                <th style={styles.th}>Plată</th>
              </tr>
            </thead>

            <tbody>
              {filteredActiveSubscriptions.map((s, idx) => (
                <tr key={s.id} style={rowStyle(idx)}>
                  <td style={styles.td}>{s.nume}</td>
                  <td style={styles.td}>{s.email}</td>
                  <td style={styles.td}>{translateSubscriptionType(s.tip)}</td>
                  <td style={styles.td}>{s.data_start}</td>
                  <td style={styles.td}>{s.data_expirare}</td>
                  <td style={styles.td}>{s.suma ? `${s.suma} lei` : "-"}</td>
                  <td style={styles.td}>
                    {Number(s.achitat) === 1 ? (
                      <span style={styles.badgePaid}>Achitată</span>
                    ) : (
                      <span style={styles.badgeUnpaid}>Neachitată</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <SectionTitle title="Rezervări active" color="#0ea5e9" />

        {adminData.active_reservations.length === 0 ? (
          <p style={styles.emptyText}>Nu există rezervări active.</p>
        ) : filteredActiveReservations.length === 0 ? (
          <p style={styles.emptyText}>Nu există rezultate pentru căutarea curentă.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Vehicul</th>
                <th style={styles.th}>Loc</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>End</th>
                <th style={styles.th}>Suma</th>
                <th style={styles.th}>Plată</th>
                <th style={styles.th}>Acțiune</th>
              </tr>
            </thead>

            <tbody>
              {filteredActiveReservations.map((r, idx) => (
                <tr key={r.reservation_id} style={rowStyle(idx)}>
                  <td style={styles.td}>{r.nume}</td>
                  <td style={styles.td}>{r.numar_inmatriculare}</td>
                  <td style={styles.td}>{r.cod_loc}</td>
                  <td style={styles.td}>{r.start_time}</td>
                  <td style={styles.td}>{r.end_time}</td>
                  <td style={styles.td}>{r.suma ? `${r.suma} lei` : "-"}</td>
                  <td style={styles.td}>
                    {Number(r.achitat) === 1 ? (
                      <span style={styles.badgePaid}>Achitată</span>
                    ) : (
                      <span style={styles.badgeUnpaid}>Neachitată</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.cancelReservationButton}
                      onClick={() => cancelReservation(r)}
                    >
                      Anulează rezervare
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <SectionTitle title="Istoric rezervări" color="#4b5563" />

        {adminData.reservation_history.length === 0 ? (
          <p style={styles.emptyText}>Nu există istoric de rezervări.</p>
        ) : filteredReservationHistory.length === 0 ? (
          <p style={styles.emptyText}>Nu există rezultate pentru căutarea curentă.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Vehicul</th>
                <th style={styles.th}>Loc</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>End</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Suma</th>
              </tr>
            </thead>

            <tbody>
              {filteredReservationHistory.map((r, idx) => (
                <tr key={r.reservation_id} style={rowStyle(idx)}>
                  <td style={styles.td}>#{r.reservation_id}</td>
                  <td style={styles.td}>{r.nume}</td>
                  <td style={styles.td}>{r.numar_inmatriculare}</td>
                  <td style={styles.td}>{r.cod_loc}</td>
                  <td style={styles.td}>{r.start_time}</td>
                  <td style={styles.td}>{r.end_time}</td>
                  <td style={styles.td}>
                    {translateReservationStatus(r.reservation_status)}
                  </td>
                  <td style={styles.td}>{r.suma ? `${r.suma} lei` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <SectionTitle title="Istoric abonamente" color="#4b5563" />

        {adminData.subscription_history.length === 0 ? (
          <p style={styles.emptyText}>Nu există istoric de abonamente.</p>
        ) : filteredSubscriptionHistory.length === 0 ? (
          <p style={styles.emptyText}>Nu există rezultate pentru căutarea curentă.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Tip</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>Expirare</th>
                <th style={styles.th}>Suma</th>
                <th style={styles.th}>Status plată</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubscriptionHistory.map((s, idx) => (
                <tr key={s.id} style={rowStyle(idx)}>
                  <td style={styles.td}>#{s.id}</td>
                  <td style={styles.td}>{s.nume}</td>
                  <td style={styles.td}>{translateSubscriptionType(s.tip)}</td>
                  <td style={styles.td}>{s.data_start}</td>
                  <td style={styles.td}>{s.data_expirare}</td>
                  <td style={styles.td}>{s.suma ? `${s.suma} lei` : "-"}</td>
                  <td style={styles.td}>
                    {Number(s.status_plata) === 1 ? (
                      <span style={styles.badgePaid}>Achitat</span>
                    ) : (
                      <span style={styles.badgeUnpaid}>Neachitat</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
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

function SectionTitle({ title, color }) {
  return <h3 style={{ marginTop: "34px", color }}>{title}</h3>;
}

function Table({ children }) {
  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>{children}</table>
    </div>
  );
}

const rowStyle = (idx) => ({
  backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#ffffff",
});

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
    maxWidth: "1200px",
    width: "100%",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
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

  topActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: "10px",
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

  searchInput: {
    flex: 1,
    minWidth: "260px",
    padding: "11px 14px",
    fontSize: "14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    outline: "none",
    color: "#374151",
    background: "#f9fafb",
  },

  clearSearchButton: {
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: "700",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#6b7280",
    color: "#ffffff",
    cursor: "pointer",
    whiteSpace: "nowrap",
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
    minWidth: "950px",
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

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginTop: "24px",
    marginBottom: "20px",
  },

  statCard: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "16px",
    padding: "18px",
    color: "#166534",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    fontWeight: "700",
    textAlign: "center",
  },

  badgePaid: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "5px 9px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "12px",
  },

  badgeUnpaid: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "5px 9px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "12px",
  },

  cancelReservationButton: {
    padding: "8px 10px",
    fontSize: "12px",
    fontWeight: "700",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    cursor: "pointer",
    whiteSpace: "nowrap",
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
    marginTop: "24px",
    color: "#6b7280",
    fontSize: "14px",
  },
};

export default AdminOverview;