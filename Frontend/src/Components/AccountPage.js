import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function AccountPage({ user, onLogout }) {
  const navigate = useNavigate();

  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [abonament, setAbonament] = useState({ activ: false });
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicule, setVehicule] = useState([]);

  const [activeReservations, setActiveReservations] = useState([]);
  const [reservationsStatus, setReservationsStatus] = useState('');
  const [reservationsStatusType, setReservationsStatusType] = useState('');

  const fetchVehicule = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost/get_user_vehicles.php?abonat_id=${user.id}`
      );

      const data = await res.json();

      if (data.success) {
        setVehicule(data.vehicule);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user.id]);

  const fetchActiveReservations = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost/get_user_reservations.php?abonat_id=${user.id}`
      );

      const text = await res.text();
      console.log('RASPUNS REZERVARI ACTIVE:', text);

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        setReservationsStatus('PHP nu returnează JSON valid pentru rezervări.');
        return;
      }

      if (data.success) {
        const active = (data.reservations || []).filter(
          (r) => r.reservation_status === 'active'
        );

        setActiveReservations(active);
        setReservationsStatus('');
      } else {
        console.log(data.details);
        setReservationsStatus(data.message || 'Eroare la preluarea rezervărilor');
      }
    } catch (err) {
      console.error(err);
      setReservationsStatus('Eroare server la preluarea rezervărilor');
    }
  }, [user.id]);

  const adaugaVehicul = async () => {
    if (!vehicleNumber.trim()) {
      setStatus('Introdu un număr de înmatriculare');
      return;
    }

    try {
      const res = await fetch('http://localhost/add_vehicle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numar_inmatriculare: vehicleNumber,
          abonat_id: user.id,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setStatus('Vehicul adăugat cu succes!');
        setStatusType('success');
        setVehicleNumber('');
        fetchVehicule();
      } else {
        setStatus(result.error || 'Eroare la adăugarea vehiculului');
        setStatusType('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare server');
      setStatusType('error');
    }
  };

  const anuleazaRezervare = async (reservationId) => {
    const confirmare = window.confirm('Sigur dorești să anulezi această rezervare?');

    if (!confirmare) return;

    try {
      const res = await fetch('http://localhost/cancel_reservation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservationId,
          abonat_id: user.id,
        }),
      });

      const text = await res.text();
      console.log('RASPUNS ANULARE:', text);

      let result;

      try {
        result = JSON.parse(text);
      } catch (e) {
        setReservationsStatus('PHP nu returnează JSON valid la anulare.');
        return;
      }

      if (result.success) {
        setReservationsStatus(`${result.message}`);
        setReservationsStatusType('success');
        fetchActiveReservations();
      } else {
        console.log(result.details);
        setReservationsStatus(result.message || 'Eroare la anularea rezervării');
        setReservationsStatusType('error');
      }
    } catch (err) {
      console.error(err);
      setReservationsStatus('Eroare server la anularea rezervării');
      setReservationsStatusType('error');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost/get_subscription_status.php?abonat_id=${user.id}`
        );

        const data = await res.json();

        if (data.success && data.abonament_activ) {
          setAbonament({
            activ: true,
            tip: data.tip,
            expira: data.expira,
          });
        } else {
          setAbonament({ activ: false });
        }
      } catch (err) {
        console.error(err);
      }

      fetchVehicule();
      fetchActiveReservations();
    };

    fetchData();
  }, [user.id, fetchVehicule, fetchActiveReservations]);

  const translateSubscriptionType = (tip) => {
    if (tip === 'frequent_monthly') return 'Abonament Lunar';
    if (tip === 'annual_traveller') return 'Abonament Anual';

    return tip || '-';
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Contul Meu</h2>

        <p style={styles.subtitle}>
          Gestionează vehiculele, abonamentele și rezervările tale Park&Go.
        </p>

        {/* Date utilizator */}
        <div style={styles.section}>
          <div style={styles.infoBox}>
            <p>
              <strong>Nume:</strong> {user.nume}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Telefon:</strong> {user.telefon}
            </p>
          </div>
        </div>

        {/* Adaugă vehicul */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Adaugă vehicul</h3>

          <input
            type="text"
            placeholder="Număr înmatriculare (ex: TM01ABC)"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            style={styles.input}
          />

          <button
            onClick={adaugaVehicul}
            style={styles.button}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = '#15803d')
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = '#16a34a')
            }
          >
            Adaugă vehicul
          </button>
        </div>

        {/* Lista vehicule */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Vehiculele mele</h3>

          {vehicule.length === 0 ? (
            <p style={styles.emptyText}>Nu ai niciun vehicul adăugat.</p>
          ) : (
            <div style={styles.vehicleList}>
              {vehicule.map((v) => (
                <div key={v.id} style={styles.vehicleCard}>
                  {v.numar_inmatriculare}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rezervări active */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Rezervări active</h3>

            <button
              onClick={fetchActiveReservations}
              style={styles.refreshButton}
            >
              Reîmprospătează
            </button>
          </div>

          {reservationsStatus && (
            <p
              style={{
                ...styles.status,
                color: reservationsStatusType === 'success' ? '#15803d' : '#dc2626',
              }}
            >
              {reservationsStatus}
            </p>
          )}

          {activeReservations.length === 0 ? (
            <p style={styles.emptyText}>Nu ai rezervări active momentan.</p>
          ) : (
            <div style={styles.reservationList}>
              {activeReservations.map((r) => (
                <div key={r.reservation_id} style={styles.reservationCard}>
                  <div style={styles.reservationHeader}>
                    <div>
                      <strong>Rezervare #{r.reservation_id}</strong>
                      <br />
                      <span style={styles.smallText}>
                        Vehicul: {r.numar_inmatriculare}
                      </span>
                    </div>

                    <span style={styles.badgeActive}>Activă</span>
                  </div>

                  <div style={styles.reservationDetails}>
                    <p>
                      <strong>Loc:</strong> {r.cod_loc}
                    </p>
                    <p>
                      <strong>Început:</strong> {r.start_time}
                    </p>
                    <p>
                      <strong>Sfârșit:</strong> {r.end_time}
                    </p>
                    <p>
                      <strong>Suma:</strong> {r.suma ? `${r.suma} lei` : '-'}
                    </p>
                    <p>
                      <strong>Plată:</strong>{' '}
                      {Number(r.achitat) === 1 ? 'Achitată' : 'Neachitată'}
                    </p>
                  </div>

                  <button
                    onClick={() => anuleazaRezervare(r.reservation_id)}
                    style={styles.cancelButton}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = '#b91c1c')
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = '#dc2626')
                    }
                  >
                    Anulează rezervarea
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/reservation')}
            style={styles.button}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = '#15803d')
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = '#16a34a')
            }
          >
            Rezervă un loc de parcare
          </button>
        </div>

        {/* Abonament */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Abonamentul meu</h3>

          {abonament.activ ? (
            <div style={styles.activeSubscription}>
              <strong>{translateSubscriptionType(abonament.tip)}</strong>
              <br />
              Expiră pe: {abonament.expira}
            </div>
          ) : (
            <div style={styles.inactiveSubscription}>
              Nu ai niciun abonament activ
            </div>
          )}

          <p style={styles.emptyText}>
            Poți achiziționa un abonament lunar sau anual și poți consulta
            istoricul abonamentelor și al plăților.
          </p>

          <button
            onClick={() => navigate('/subscription')}
            style={styles.button}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = '#15803d')
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = '#16a34a')
            }
          >
            Achiziționează un abonament
          </button>
        </div>

        {/* Status */}
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

        {/* Logout */}
        <button
          onClick={onLogout}
          style={styles.logoutButton}
          onMouseEnter={(e) =>
            (e.target.style.backgroundColor = '#4b5563')
          }
          onMouseLeave={(e) =>
            (e.target.style.backgroundColor = '#6b7280')
          }
        >
          Deconectare
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f0fdf4, #ffffff)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 16px',
    fontFamily: 'sans-serif',
  },

  card: {
    background: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    padding: '48px',
    maxWidth: '600px',
    width: '100%',
  },

  title: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#15803d',
    marginBottom: '8px',
    marginTop: 0,
    textAlign: 'center',
  },

  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '36px',
    lineHeight: '1.6',
  },

  section: {
    marginBottom: '32px',
  },

  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#166534',
    marginBottom: '16px',
  },

  infoBox: {
    background: '#f9fafb',
    padding: '18px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    lineHeight: '1.9',
    color: '#374151',
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
    marginBottom: '14px',
  },

  button: {
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
    marginBottom: '12px',
  },

  vehicleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  vehicleCard: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '14px',
    padding: '14px 16px',
    fontWeight: '600',
    color: '#4b5563',
  },

  activeSubscription: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '14px',
    padding: '16px',
    color: '#374151',
    marginBottom: '20px',
    lineHeight: '1.7',
    fontWeight: '600',
  },

  inactiveSubscription: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '14px',
    padding: '16px',
    color: '#dc2626',
    marginBottom: '20px',
    fontWeight: '600',
  },

  emptyText: {
    color: '#6b7280',
    lineHeight: '1.5',
  },

  status: {
    marginTop: '24px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '15px',
  },

  logoutButton: {
    width: '100%',
    padding: '14px',
    marginTop: '24px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#6b7280',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },

  refreshButton: {
    padding: '9px 12px',
    fontSize: '13px',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    cursor: 'pointer',
  },

  reservationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '16px',
  },

  reservationCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '16px',
  },

  reservationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
  },

  reservationDetails: {
    color: '#374151',
    lineHeight: '1.7',
    fontSize: '14px',
  },

  smallText: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '8px',
    fontWeight: '400',
  },

  badgeActive: {
    background: '#dbeafe',
    color: '#1d4ed8',
    padding: '6px 10px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
  },

  cancelButton: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '700',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'background-color 0.2s',
  },
};

export default AccountPage;

