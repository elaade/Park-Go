import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function Reservation({ user }) {
  const navigate = useNavigate();

  const [vehicule, setVehicule] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const [reservationStatus, setReservationStatus] = useState('');
  const [reservationStatusType, setReservationStatusType] = useState('');
  const [myReservations, setMyReservations] = useState([]);
  const [myReservationsStatus, setMyReservationsStatus] = useState('');
  const [myReservationsStatusType, setMyReservationsStatusType] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

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

  const fetchMyReservations = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost/get_user_reservations.php?abonat_id=${user.id}`
      );

      const text = await res.text();
      console.log('RASPUNS REZERVARILE MELE:', text);

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        setMyReservationsStatus('PHP nu returnează JSON valid pentru rezervările mele.');
        setMyReservationsStatusType('error');
        return;
      }

      if (data.success) {
        setMyReservations(data.reservations);
        setMyReservationsStatus('');
        setMyReservationsStatusType('');
      } else {
        console.log(data.details);
        setMyReservationsStatus(data.message || 'Eroare la preluarea rezervărilor');
        setMyReservationsStatusType('error');
      }
    } catch (err) {
      console.error(err);
      setMyReservationsStatus('Eroare server la preluarea rezervărilor');
      setMyReservationsStatusType('error');
    }
  }, [user.id]);

  useEffect(() => {
    fetchVehicule();
    fetchMyReservations();
  }, [fetchVehicule, fetchMyReservations]);

  const calculeazaZile = () => {
    if (!start || !end) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) return 0;

    const diffMs = endDate - startDate;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays < 1 ? 1 : diffDays;
  };

  const calculeazaPret = () => {
    const zile = calculeazaZile();

    const tarife = {
      1: 35,
      2: 65,
      3: 90,
      4: 115,
      5: 140,
      6: 165,
      7: 185,
      8: 205,
      9: 225,
      10: 245,
      11: 265,
      12: 285,
      13: 305,
      14: 320,
    };

    if (zile === 0) return 0;

    if (zile > 14) return 0;

    return tarife[zile] || 0;
  };

  const rezervaLoc = async () => {
    setReservationStatus('');
    setReservationStatusType('');

    if (!selectedVehicleId) {
      setReservationStatus('Selectează un vehicul pentru rezervare');
      setReservationStatusType('error');
      return;
    }

    if (!start || !end) {
      setReservationStatus('Selectează data de start și data de final');
      setReservationStatusType('error');
      return;
    }

    if (new Date(start) >= new Date(end)) {
      setReservationStatus('Data de final trebuie să fie după data de start');
      setReservationStatusType('error');
      return;
    }

    const zile = calculeazaZile();

    if (zile > 14) {
      setReservationStatus('Rezervarea nu poate depăși 14 zile.');
      setReservationStatusType('error');
      return;
    }

    const pret = calculeazaPret();

    if (pret <= 0) {
      setReservationStatus('Nu există tarif definit pentru perioada selectată.');
      setReservationStatusType('error');
      return;
    }

    const confirmare = window.confirm(
      `Confirmi plata de ${pret} lei pentru ${zile} zile de parcare?`
    );

    if (!confirmare) return;

    try {
      const res = await fetch('http://localhost/reserve.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          start_time: start.replace('T', ' '),
          end_time: end.replace('T', ' '),
          suma: pret,
          zile,
          metoda_plata: 'card_simulat',
        }),
      });

      const text = await res.text();
      console.log('RASPUNS PHP:', text);

      let result;

      try {
        result = JSON.parse(text);
      } catch (e) {
        setReservationStatus('PHP nu returnează JSON valid. Verifică consola.');
        setReservationStatusType('error');
        return;
      }

      if (result.success) {
        setReservationStatus(result.message);
        setReservationStatusType('success');
        setSelectedVehicleId('');
        setStart('');
        setEnd('');
        fetchMyReservations();
      } else {
        console.log(result.details);
        setReservationStatus(result.message || 'Rezervarea a eșuat');
        setReservationStatusType('error');
      }
    } catch (err) {
      console.error(err);
      setReservationStatus('Eroare server');
      setReservationStatusType('error');
    }
  };

  const translateReservationStatus = (status) => {
    if (status === 'active') return 'Activă';
    if (status === 'completed') return 'Finalizată';
    if (status === 'expired') return 'Expirată';
    if (status === 'cancelled') return 'Anulată';

    return status || '-';
  };

  const historyReservations = myReservations.filter(
    (r) => r.reservation_status !== 'active'
  );

  const paymentHistory = myReservations.filter(
    (r) => r.suma || r.cod_bare || r.achitat !== null
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Rezervări parcare</h2>

        <p style={styles.subtitle}>
          Aici poți rezerva un loc de parcare și poți consulta istoricul
          rezervărilor și al plăților.
        </p>

        <button style={styles.backButton} onClick={() => navigate('/account')}>
          Înapoi la contul meu
        </button>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Rezervă un loc de parcare</h3>

          {vehicule.length === 0 ? (
            <p style={styles.emptyText}>
              Pentru a face o rezervare, trebuie să adaugi mai întâi un vehicul.
            </p>
          ) : (
            <>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                style={styles.input}
              >
                <option value="">Selectează vehiculul</option>

                {vehicule.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.numar_inmatriculare}
                  </option>
                ))}
              </select>

              <label style={styles.label}>Început:</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={styles.input}
              />

              <label style={styles.label}>Sfârșit:</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={styles.input}
              />

              {start && end && new Date(start) < new Date(end) && (
                <div style={styles.priceBox}>
                  <p>
                    <strong>Durată:</strong> {calculeazaZile()} zile
                  </p>

                  {calculeazaZile() > 14 ? (
                    <p style={{ color: '#dc2626' }}>
                      Rezervarea nu poate depăși 14 zile.
                    </p>
                  ) : (
                    <p>
                      <strong>Total de plată:</strong> {calculeazaPret()} lei
                    </p>
                  )}
                </div>
              )}

              <button onClick={rezervaLoc} style={styles.button}>
                Plătește și rezervă loc
              </button>

              {reservationStatus && (
                <p
                  style={{
                    ...styles.status,
                    color: reservationStatusType === 'success' ? '#15803d' : '#dc2626',
                  }}
                >
                  {reservationStatus}
                </p>
              )}
            </>
          )}
        </div>

        {myReservationsStatus && (
          <p
            style={{
              ...styles.status,
              color: myReservationsStatusType === 'success' ? '#15803d' : '#dc2626',
            }}
          >
            {myReservationsStatus}
          </p>
        )}

        <div style={styles.section}>
          <button
            style={styles.secondaryButton}
            onClick={() => setShowHistory((prev) => !prev)}
          >
            {showHistory ? 'Ascunde istoric rezervări' : 'Vezi istoric rezervări'}
          </button>

          {showHistory && (
            <>
              <h3 style={styles.sectionTitle}>Istoric rezervări</h3>

              {historyReservations.length === 0 ? (
                <p style={styles.emptyText}>Nu există istoric de rezervări.</p>
              ) : (
                <div style={styles.reservationList}>
                  {historyReservations.map((r) => (
                    <ReservationCard
                      key={r.reservation_id}
                      reservation={r}
                      translateReservationStatus={translateReservationStatus}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.section}>
          <button
            style={styles.secondaryButton}
            onClick={() => setShowPayments((prev) => !prev)}
          >
            {showPayments ? 'Ascunde istoric plăți' : 'Vezi istoric plăți'}
          </button>

          {showPayments && (
            <>
              <h3 style={styles.sectionTitle}>Istoric plăți rezervări</h3>

              {paymentHistory.length === 0 ? (
                <p style={styles.emptyText}>Nu există plăți înregistrate.</p>
              ) : (
                <div style={styles.paymentList}>
                  {paymentHistory.map((p) => (
                    <div key={p.reservation_id} style={styles.paymentCard}>
                      <strong>Rezervare #{p.reservation_id}</strong>
                      <p>
                        <strong>Vehicul:</strong> {p.numar_inmatriculare}
                      </p>
                      <p>
                        <strong>Suma:</strong> {p.suma ? `${p.suma} lei` : '-'}
                      </p>
                      <p>
                        <strong>Status plată:</strong>{' '}
                        {Number(p.achitat) === 1 ? 'Achitată' : 'Neachitată'}
                      </p>
                      <p>
                        <strong>Cod plată:</strong> {p.cod_bare || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReservationCard({ reservation, translateReservationStatus }) {
  return (
    <div style={styles.reservationCard}>
      <div style={styles.reservationHeader}>
        <div>
          <strong>Rezervare #{reservation.reservation_id}</strong>
          <br />
          <span style={styles.smallText}>
            Vehicul: {reservation.numar_inmatriculare}
          </span>
        </div>

        <span
          style={
            reservation.reservation_status === 'active'
              ? styles.badgeActive
              : reservation.reservation_status === 'expired'
              ? styles.badgeExpired
              : reservation.reservation_status === 'completed'
              ? styles.badgeCompleted
              : styles.badgeCancelled
          }
        >
          {translateReservationStatus(reservation.reservation_status)}
        </span>
      </div>

      <div style={styles.reservationDetails}>
        <p>
          <strong>Loc:</strong> {reservation.cod_loc}
        </p>

        <p>
          <strong>Început:</strong> {reservation.start_time}
        </p>

        <p>
          <strong>Sfârșit:</strong> {reservation.end_time}
        </p>

        <p>
          <strong>Suma:</strong> {reservation.suma ? `${reservation.suma} lei` : '-'}
        </p>

        <p>
          <strong>Plată:</strong>{' '}
          {Number(reservation.achitat) === 1 ? 'Achitată' : 'Neachitată'}
        </p>

        <p>
          <strong>Cod plată:</strong> {reservation.cod_bare || '-'}
        </p>
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
    maxWidth: '650px',
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
    marginBottom: '28px',
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

  label: {
    display: 'block',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
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

  secondaryButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginBottom: '18px',
  },

  backButton: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#6b7280',
    color: '#ffffff',
    cursor: 'pointer',
    marginBottom: '32px',
  },

  priceBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '14px',
    padding: '16px',
    color: '#166534',
    marginBottom: '16px',
    lineHeight: '1.7',
    fontWeight: '600',
  },

  smallText: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '8px',
    fontWeight: '400',
  },

  emptyText: {
    color: '#6b7280',
  },

  status: {
    marginTop: '12px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '15px',
  },

  reservationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
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

  paymentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  paymentCard: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '16px',
    padding: '16px',
    color: '#374151',
    lineHeight: '1.7',
  },

  badgeActive: {
    background: '#dbeafe',
    color: '#1d4ed8',
    padding: '6px 10px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
  },

  badgeExpired: {
    background: '#f3f4f6',
    color: '#4b5563',
    padding: '6px 10px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
  },

  badgeCompleted: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '6px 10px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
  },

  badgeCancelled: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '6px 10px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
  },
};

export default Reservation;