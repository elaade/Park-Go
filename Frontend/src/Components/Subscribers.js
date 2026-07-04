import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Subscribers() {
  const navigate = useNavigate();

  const [subscribers, setSubscribers] = useState([]);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({
    nume: '',
    email: '',
    telefon: '',
  });

  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [editVehicleNumber, setEditVehicleNumber] = useState('');

  const [addingVehicleForUserId, setAddingVehicleForUserId] = useState(null);
  const [newVehicleNumber, setNewVehicleNumber] = useState('');

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setStatus('');

      const res = await fetch('http://localhost/get_subscribers.php');
      const data = await res.json();

      console.log('Răspuns get_subscribers:', data);

      if (data.success) {
        setSubscribers(data.subscribers || []);
      } else {
        setStatus(data.message || 'Eroare la preluarea utilizatorilor');
        console.log(data.details);
      }
    } catch (err) {
      console.error('Eroare:', err);
      setStatus('Eroare server la preluarea utilizatorilor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const startEditUser = (sub) => {
    setEditingUserId(sub.subscriber_id);
    setEditUserData({
      nume: sub.nume || '',
      email: sub.email || '',
      telefon: sub.telefon || '',
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditUserData({
      nume: '',
      email: '',
      telefon: '',
    });
  };

  const saveUser = async (subscriberId) => {
    try {
      const res = await fetch('http://localhost/update_subscriber.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subscriberId,
          nume: editUserData.nume,
          email: editUserData.email,
          telefon: editUserData.telefon,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setStatus(`${result.message}`);
        setStatusType('success');
        cancelEditUser();
        fetchSubscribers();
      } else {
        setStatus(result.message || 'Eroare la actualizarea utilizatorului');
        setStatusType('error');
        console.log(result.details);
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare server la actualizarea utilizatorului');
      setStatusType('error');
    }
  };

  const startEditVehicle = (sub) => {
    setEditingVehicleId(sub.vehicle_id);
    setEditVehicleNumber(sub.numar_inmatriculare || '');
  };

  const cancelEditVehicle = () => {
    setEditingVehicleId(null);
    setEditVehicleNumber('');
  };

  const saveVehicle = async (vehicleId) => {
    try {
      const res = await fetch('http://localhost/update_vehicle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          numar_inmatriculare: editVehicleNumber,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setStatus(`${result.message}`);
        setStatusType('success');
        cancelEditVehicle();
        fetchSubscribers();
      } else {
        setStatus(result.message || 'Eroare la actualizarea vehiculului');
        setStatusType('error');
        console.log(result.details);
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare server la actualizarea vehiculului');
      setStatusType('error');
    }
  };

  const removeVehicle = async (vehicleId) => {
    const confirmare = window.confirm(
      'Sigur dorești să ștergi acest vehicul din contul utilizatorului?'
    );

    if (!confirmare) return;

    try {
      const res = await fetch('http://localhost/admin_remove_vehicle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setStatus(`${result.message}`);
        setStatusType('success');
        fetchSubscribers();
      } else {
        setStatus(result.message || 'Eroare la ștergerea vehiculului');
        setStatusType('error');
        console.log(result.details);
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare server la ștergerea vehiculului');
      setStatusType('error');
    }
  };

  const updateAccountStatus = async (subscriberId, action) => {
    const message =
      action === 'deactivate'
        ? 'Sigur dorești să dezactivezi acest cont? Utilizatorul nu se va mai putea autentifica.'
        : 'Sigur dorești să reactivezi acest cont?';

    const confirmare = window.confirm(message);

    if (!confirmare) return;

    try {
      const res = await fetch('http://localhost/update_subscriber_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriber_id: subscriberId,
          action,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setStatus(`${result.message}`);
        setStatusType('success');
        fetchSubscribers();
      } else {
        setStatus(result.message || 'Eroare la actualizarea statusului contului');
        setStatusType('error');
        console.log(result.details);
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare server la actualizarea statusului contului');
      setStatusType('error');
    }
  };

  const startAddVehicle = (subscriberId) => {
    setAddingVehicleForUserId(subscriberId);
    setNewVehicleNumber('');
  };

  const cancelAddVehicle = () => {
    setAddingVehicleForUserId(null);
    setNewVehicleNumber('');
  };

  const addVehicle = async (subscriberId) => {
    try {
      const res = await fetch('http://localhost/admin_add_vehicle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abonat_id: subscriberId,
          numar_inmatriculare: newVehicleNumber,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setStatus(`${result.message}`);
        setStatusType('success');
        cancelAddVehicle();
        fetchSubscribers();
      } else {
        setStatus(result.message || 'Eroare la adăugarea vehiculului');
        setStatusType('error');
        console.log(result.details);
      }
    } catch (err) {
      console.error(err);
      setStatus('Eroare server la adăugarea vehiculului');
      setStatusType('error');
    }
  };

  const renderBooleanBadge = (value, trueText, falseText) => {
    return value ? (
      <span style={styles.badgeGreen}>{trueText}</span>
    ) : (
      <span style={styles.badgeGray}>{falseText}</span>
    );
  };

  const renderVehicleType = (tip) => {
    if (tip === 'abonat') {
      return <span style={styles.badgeBlue}>Abonat</span>;
    }

    return <span style={styles.badgeUser}>Utilizator</span>;
  };

  const renderAccountStatus = (role) => {
    if (role === 'disabled') {
      return <span style={styles.badgeRed}>Dezactivat</span>;
    }

    if (role === 'admin') {
      return <span style={styles.badgeAdmin}>Admin</span>;
    }

    return <span style={styles.badgeGreen}>Activ</span>;
  };

  const translateSubscriptionType = (tip) => {
    if (tip === 'frequent_monthly') return 'Abonament lunar frecvent';
    if (tip === 'business_monthly') return 'Abonament lunar business';
    if (tip === 'annual_traveller') return 'Abonament anual';

    return tip || '-';
  };

  const matchesSearch = (sub) => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return true;

    const role = sub.role || 'user';
    const statusCont =
      role === 'disabled'
        ? 'dezactivat cont dezactivat'
        : role === 'admin'
        ? 'admin administrator'
        : 'activ cont activ user utilizator';

    const abonamentText = sub.abonament_activ
      ? `abonament activ da ${translateSubscriptionType(sub.tip_abonament)} ${sub.abonament_expirare || ''}`
      : 'abonament nu fara abonament';

    const rezervareText = sub.rezervare_activa
      ? `rezervare activa da ${sub.rezervare_start || ''} ${sub.rezervare_end || ''}`
      : 'rezervare nu fara rezervare';

    const parcareText = sub.in_parcare
      ? `in parcare da ${sub.data_in || ''}`
      : 'nu este in parcare';

    const valuesText = Object.values(sub || {})
      .map((value) => String(value ?? ''))
      .join(' ')
      .toLowerCase();

    return `${valuesText} ${statusCont} ${abonamentText} ${rezervareText} ${parcareText}`
      .toLowerCase()
      .includes(term);
  };

  const filteredSubscribers = subscribers.filter(matchesSearch);
  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Gestionare utilizatori</h2>
            <p style={styles.subtitle}>
              Vizualizare utilizatori, vehicule, abonamente valide și rezervări active.
            </p>
          </div>

          <div style={styles.headerButtons}>
            <button
              style={styles.addUserButton}
              onClick={() => navigate('/register', { state: { fromAdmin: true } })}
            >
              Creează utilizator
            </button>

            <button style={styles.refreshButton} onClick={fetchSubscribers}>
              {loading ? 'Se încarcă...' : 'Reîmprospătează'}
            </button>
          </div>
        </div>

        <div style={styles.searchBox}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Caută după nume, email, telefon, vehicul, loc, status cont..."
            style={styles.searchInput}
          />

          {searchTerm && (
            <button style={styles.clearSearchButton} onClick={() => setSearchTerm('')}>
              Șterge căutarea
            </button>
          )}
        </div>

        {status && (
          <p
            style={{
              ...styles.statusText,
              color: statusType === 'success' ? '#15803d' : '#dc2626',
            }}
          >
            {status}
          </p>
        )}

        {subscribers.length === 0 && !loading ? (
          <p style={styles.emptyText}>Nu există utilizatori înregistrați.</p>
        ) : filteredSubscribers.length === 0 ? (
          <p style={styles.emptyText}>Nu există rezultate pentru căutarea curentă.</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Utilizator</th>
                  <th style={styles.th}>Status cont</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Vehicul</th>
                  <th style={styles.th}>Tip vehicul</th>
                  <th style={styles.th}>Abonament activ</th>
                  <th style={styles.th}>Rezervare activă</th>
                  <th style={styles.th}>Loc</th>
                  <th style={styles.th}>În parcare</th>
                  <th style={styles.th}>Acțiuni</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubscribers.map((sub, idx) => {
                  const role = sub.role || 'user';

                  return (
                    <tr
                      key={`${sub.subscriber_id}-${sub.vehicle_id || idx}`}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#ffffff',
                      }}
                    >
                      <td style={styles.td}>#{sub.subscriber_id}</td>

                      <td style={styles.td}>
                        {editingUserId === sub.subscriber_id ? (
                          <input
                            type="text"
                            value={editUserData.nume}
                            onChange={(e) =>
                              setEditUserData({
                                ...editUserData,
                                nume: e.target.value,
                              })
                            }
                            style={styles.inputSmall}
                          />
                        ) : (
                          <strong>{sub.nume || '-'}</strong>
                        )}
                      </td>

                      <td style={styles.td}>{renderAccountStatus(role)}</td>

                      <td style={styles.td}>
                        {editingUserId === sub.subscriber_id ? (
                          <div style={styles.editColumn}>
                            <input
                              type="email"
                              value={editUserData.email}
                              onChange={(e) =>
                                setEditUserData({
                                  ...editUserData,
                                  email: e.target.value,
                                })
                              }
                              style={styles.inputSmall}
                              placeholder="Email"
                            />

                            <input
                              type="text"
                              value={editUserData.telefon}
                              onChange={(e) =>
                                setEditUserData({
                                  ...editUserData,
                                  telefon: e.target.value,
                                })
                              }
                              style={styles.inputSmall}
                              placeholder="Telefon"
                            />
                          </div>
                        ) : (
                          <>
                            <span>{sub.email || '-'}</span>
                            <br />
                            <span style={styles.smallText}>{sub.telefon || '-'}</span>
                          </>
                        )}
                      </td>

                      <td style={styles.td}>
                        {editingVehicleId === sub.vehicle_id ? (
                          <input
                            type="text"
                            value={editVehicleNumber}
                            onChange={(e) => setEditVehicleNumber(e.target.value)}
                            style={styles.inputSmall}
                            placeholder="Număr înmatriculare"
                          />
                        ) : sub.numar_inmatriculare ? (
                          <strong>{sub.numar_inmatriculare}</strong>
                        ) : (
                          <span style={styles.smallText}>Fără vehicul</span>
                        )}

                        {addingVehicleForUserId === sub.subscriber_id && (
                          <div style={styles.addVehicleBox}>
                            <input
                              type="text"
                              value={newVehicleNumber}
                              onChange={(e) => setNewVehicleNumber(e.target.value)}
                              style={styles.inputSmall}
                              placeholder="Număr nou"
                            />

                            <div style={styles.actionGroup}>
                              <button
                                style={styles.saveSmallButton}
                                onClick={() => addVehicle(sub.subscriber_id)}
                              >
                                Adaugă
                              </button>

                              <button
                                style={styles.cancelSmallButton}
                                onClick={cancelAddVehicle}
                              >
                                Renunță
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td style={styles.td}>
                        {sub.numar_inmatriculare
                          ? renderVehicleType(sub.tip_vehicul)
                          : '-'}
                      </td>

                      <td style={styles.td}>
                        {sub.abonament_activ ? (
                          <div>
                            <span style={styles.badgeGreen}>Da</span>
                            <br />
                            <span style={styles.smallText}>
                              {translateSubscriptionType(sub.tip_abonament)}
                            </span>
                            <br />
                            <span style={styles.smallText}>
                              Expiră: {sub.abonament_expirare || '-'}
                            </span>
                          </div>
                        ) : (
                          <span style={styles.badgeGray}>Nu</span>
                        )}
                      </td>

                      <td style={styles.td}>
                        {sub.rezervare_activa ? (
                          <div>
                            <span style={styles.badgeBlue}>Da</span>
                            <br />
                            <span style={styles.smallText}>
                              {sub.rezervare_start || '-'}
                            </span>
                            <br />
                            <span style={styles.smallText}>
                              până la {sub.rezervare_end || '-'}
                            </span>
                          </div>
                        ) : (
                          <span style={styles.badgeGray}>Nu</span>
                        )}
                      </td>

                      <td style={styles.td}>
                        {sub.cod_loc ? (
                          <span style={styles.badgeSpot}>{sub.cod_loc}</span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td style={styles.td}>
                        {renderBooleanBadge(sub.in_parcare, 'Da', 'Nu')}
                        {sub.in_parcare && (
                          <>
                            <br />
                            <span style={styles.smallText}>
                              Intrare: {sub.data_in || '-'}
                            </span>
                          </>
                        )}
                      </td>

                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {editingUserId === sub.subscriber_id ? (
                            <>
                              <button
                                style={styles.saveSmallButton}
                                onClick={() => saveUser(sub.subscriber_id)}
                              >
                                Salvează utilizator
                              </button>

                              <button
                                style={styles.cancelSmallButton}
                                onClick={cancelEditUser}
                              >
                                Renunță
                              </button>
                            </>
                          ) : (
                            <button
                              style={styles.editSmallButton}
                              onClick={() => startEditUser(sub)}
                            >
                              Editează utilizator
                            </button>
                          )}

                          {sub.vehicle_id && (
                            <>
                              {editingVehicleId === sub.vehicle_id ? (
                                <>
                                  <button
                                    style={styles.saveSmallButton}
                                    onClick={() => saveVehicle(sub.vehicle_id)}
                                  >
                                    Salvează vehicul
                                  </button>

                                  <button
                                    style={styles.cancelSmallButton}
                                    onClick={cancelEditVehicle}
                                  >
                                    Renunță
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    style={styles.editSmallButton}
                                    onClick={() => startEditVehicle(sub)}
                                  >
                                    Editează vehicul
                                  </button>

                                  <button
                                    style={styles.deleteSmallButton}
                                    onClick={() => removeVehicle(sub.vehicle_id)}
                                  >
                                    Șterge vehicul
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {addingVehicleForUserId !== sub.subscriber_id && (
                            <button
                              style={styles.addSmallButton}
                              onClick={() => startAddVehicle(sub.subscriber_id)}
                            >
                              Adaugă vehicul
                            </button>
                          )}

                          {role !== 'admin' && (
                            role === 'disabled' ? (
                              <button
                                style={styles.reactivateButton}
                                onClick={() =>
                                  updateAccountStatus(sub.subscriber_id, 'reactivate')
                                }
                              >
                                Reactivează cont
                              </button>
                            ) : (
                              <button
                                style={styles.deactivateButton}
                                onClick={() =>
                                  updateAccountStatus(sub.subscriber_id, 'deactivate')
                                }
                              >
                                Dezactivează cont
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {hasSearch && (
          <p style={styles.searchInfo}>
            Căutare activă pentru: <strong>{searchTerm}</strong>
          </p>
        )}

        <p style={styles.note}>
          Utilizatorii cu abonament activ sunt tratați ca abonați. Utilizatorii fără
          abonament pot intra doar dacă au o rezervare activă. Conturile dezactivate
          rămân în sistem pentru păstrarea istoricului, dar nu se mai pot autentifica.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f0fdf4, #ffffff)',
    padding: '40px 16px',
    fontFamily: 'Arial, sans-serif',
  },

  container: {
    maxWidth: '1500px',
    margin: 'auto',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    padding: '34px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px',
  },

  headerButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },

  title: {
    color: '#15803d',
    margin: 0,
    fontSize: '28px',
    fontWeight: '800',
  },

  subtitle: {
    color: '#6b7280',
    marginTop: '8px',
    marginBottom: 0,
    lineHeight: '1.5',
  },

  addUserButton: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  refreshButton: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  searchBox: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },

  searchInput: {
    flex: 1,
    minWidth: '260px',
    padding: '12px 14px',
    fontSize: '14px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    outline: 'none',
    color: '#374151',
    background: '#f9fafb',
  },

  clearSearchButton: {
    padding: '12px 14px',
    fontSize: '14px',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#6b7280',
    color: '#ffffff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  tableContainer: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
  },

  table: {
    width: '100%',
    minWidth: '1450px',
    borderCollapse: 'collapse',
    textAlign: 'center',
    fontSize: '14px',
    color: '#374151',
  },

  th: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    padding: '12px',
    borderBottom: '1px solid #bbf7d0',
    fontWeight: '700',
  },

  td: {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'middle',
  },

  smallText: {
    color: '#6b7280',
    fontSize: '12px',
  },

  badgeGreen: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '5px 9px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
    display: 'inline-block',
  },

  badgeBlue: {
    background: '#dbeafe',
    color: '#1d4ed8',
    padding: '5px 9px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
    display: 'inline-block',
  },

  badgeGray: {
    background: '#f3f4f6',
    color: '#4b5563',
    padding: '5px 9px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
    display: 'inline-block',
  },

  badgeRed: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '5px 9px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
    display: 'inline-block',
  },

  badgeAdmin: {
    background: '#ede9fe',
    color: '#6d28d9',
    padding: '5px 9px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
    display: 'inline-block',
  },

  badgeUser: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '5px 9px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '12px',
    display: 'inline-block',
  },

  badgeSpot: {
    background: '#ecfdf5',
    color: '#047857',
    padding: '5px 10px',
    borderRadius: '999px',
    fontWeight: '800',
    fontSize: '13px',
    display: 'inline-block',
  },

  statusText: {
    fontWeight: '700',
    marginTop: '10px',
    marginBottom: '18px',
  },

  emptyText: {
    color: '#6b7280',
    marginTop: '10px',
  },

  note: {
    marginTop: '20px',
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.5',
  },

  searchInfo: {
    marginTop: '14px',
    color: '#6b7280',
    fontSize: '14px',
  },

  inputSmall: {
    width: '100%',
    minWidth: '140px',
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
  },

  editColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '150px',
  },

  actionGroup: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
    justifyContent: 'center',
  },

  addVehicleBox: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #e5e7eb',
  },

  editSmallButton: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    cursor: 'pointer',
  },

  addSmallButton: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    cursor: 'pointer',
  },

  saveSmallButton: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    cursor: 'pointer',
  },

  cancelSmallButton: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#6b7280',
    color: '#ffffff',
    cursor: 'pointer',
  },

  deleteSmallButton: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    cursor: 'pointer',
  },

  deactivateButton: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#fecaca',
    color: '#991b1b',
    cursor: 'pointer',
  },

  reactivateButton: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#bbf7d0',
    color: '#166534',
    cursor: 'pointer',
  },
};

export default Subscribers;
