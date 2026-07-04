import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function Subscription({ user }) {
  const navigate = useNavigate();

  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const translateSubscriptionType = (tip) => {
    if (tip === 'frequent_monthly') return 'Abonament Lunar';
    if (tip === 'annual_traveller') return 'Abonament Anual';

    return tip || '-';
  };

  const fetchSubscriptionHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost/get_user_subscriptions.php?abonat_id=${user.id}`
      );

      const text = await res.text();
      console.log('RASPUNS ISTORIC ABONAMENTE:', text);

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        setStatus('PHP nu returnează JSON valid pentru istoricul abonamentelor.');
        return;
      }

      if (data.success) {
        setSubscriptionHistory(data.subscriptions || []);
      } else {
        console.log(data.details);
        setStatus(data.message || 'Eroare la preluarea istoricului abonamentelor');
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare server la preluarea istoricului abonamentelor');
    }
  }, [user.id]);

  useEffect(() => {
    fetchSubscriptionHistory();
  }, [fetchSubscriptionHistory]);

  const creeazaAbonament = async (tip) => {
    const abonamente = {
      frequent_monthly: {
        nume: 'Abonament Lunar',
        pret: 399,
        durata: 'lună',
      },
      annual_traveller: {
        nume: 'Abonament Anual',
        pret: 3990,
        durata: 'an',
      },
    };

    const abonamentAles = abonamente[tip];

    if (!abonamentAles) {
      setStatus('Tip de abonament invalid');
      return;
    }

    const confirmare = window.confirm(
      `Confirmi plata de ${abonamentAles.pret} lei pentru ${abonamentAles.nume}?`
    );

    if (!confirmare) return;

    try {
      const res = await fetch('http://localhost/pay_subscription.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abonat_id: user.id,
          tip,
          metoda_plata: 'card_simulat',
        }),
      });

      const text = await res.text();
      console.log('RASPUNS PHP ABONAMENT:', text);

      let result;

      try {
        result = JSON.parse(text);
      } catch (e) {
        setStatus('PHP nu returnează JSON valid la abonament.');
        return;
      }

      if (result.success) {
        setStatus(`${result.message}`);
        setStatusType('success');
        fetchSubscriptionHistory();
      } else {
        console.log(result.details);
        setStatus(result.message || 'Eroare la plata abonamentului');
        setStatusType('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare server la plata abonamentului');
      setStatusType('error');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Abonamente Park&Go</h2>

        <p style={styles.subtitle}>
          Alege un abonament pentru acces rapid în parcare. Poți consulta aici
          istoricul abonamentelor și al plăților.
        </p>

        <button style={styles.backButton} onClick={() => navigate('/account')}>
          Înapoi la contul meu
        </button>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Achiziționează un abonament</h3>

          <div style={styles.subscriptionCard}>
            <h4 style={styles.planTitle}>Abonament Lunar</h4>
            <p style={styles.planPrice}>399 lei/lună</p>
            <p style={styles.planText}>
              Potrivit pentru utilizatorii care parchează frecvent.
            </p>

            <button
              onClick={() => creeazaAbonament('frequent_monthly')}
              style={styles.button}
            >
              Cumpără abonament lunar
            </button>
          </div>

          <div style={styles.subscriptionCard}>
            <h4 style={styles.planTitle}>Abonament Anual</h4>
            <p style={styles.planPrice}>3990 lei/an</p>
            <p style={styles.planText}>
              Variantă avantajoasă pentru utilizare pe termen lung.
            </p>

            <button
              onClick={() => creeazaAbonament('annual_traveller')}
              style={styles.secondaryButton}
            >
              Cumpără abonament anual
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <button
            style={styles.secondaryButton}
            onClick={() => setShowHistory((prev) => !prev)}
          >
            {showHistory ? 'Ascunde istoric abonamente' : 'Vezi istoric abonamente și plăți'}
          </button>

          {showHistory && (
            <>
              <h3 style={styles.sectionTitle}>Istoric abonamente</h3>

              {subscriptionHistory.length === 0 ? (
                <p style={styles.emptyText}>Nu există abonamente în istoricul tău.</p>
              ) : (
                <div style={styles.historyList}>
                  {subscriptionHistory.map((s) => (
                    <div key={s.id} style={styles.historyCard}>
                      <div style={styles.historyHeader}>
                        <strong>{translateSubscriptionType(s.tip)}</strong>

                        {Number(s.status_plata) === 1 ? (
                          <span style={styles.badgePaid}>Achitat</span>
                        ) : (
                          <span style={styles.badgeUnpaid}>Neachitat</span>
                        )}
                      </div>

                      <p>
                        <strong>Start:</strong> {s.data_start || '-'}
                      </p>

                      <p>
                        <strong>Expirare:</strong> {s.data_expirare || '-'}
                      </p>

                      <p>
                        <strong>Suma:</strong> {s.suma ? `${s.suma} lei` : '-'}
                      </p>

                      <p>
                        <strong>Metodă plată:</strong> {s.metoda_plata || '-'}
                      </p>

                      <p>
                        <strong>Cod plată:</strong> {s.cod_bare || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

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
    marginTop: '12px',
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
    marginTop: '12px',
  },

  subscriptionCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '18px',
    padding: '18px',
    marginBottom: '16px',
  },

  planTitle: {
    color: '#166534',
    fontSize: '18px',
    fontWeight: '800',
    margin: 0,
    marginBottom: '8px',
  },

  planPrice: {
    color: '#15803d',
    fontSize: '22px',
    fontWeight: '800',
    margin: 0,
    marginBottom: '8px',
  },

  planText: {
    color: '#6b7280',
    lineHeight: '1.5',
    margin: 0,
  },

  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  historyCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '16px',
    color: '#374151',
    lineHeight: '1.7',
  },

  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },

  badgePaid: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '6px 10px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
  },

  badgeUnpaid: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '6px 10px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
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
};

export default Subscription;