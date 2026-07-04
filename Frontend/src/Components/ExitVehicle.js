import { useState } from 'react';
import axios from 'axios';

function ExitVehicle() {
  const [plate, setPlate] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [manualDetails, setManualDetails] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageMessage, setImageMessage] = useState('');
  const [imageResult, setImageResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [videoMessage, setVideoMessage] = useState('');
  const [videoResult, setVideoResult] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const buildExitMessage = (plateNumber, php) => {
    if (php?.success && php?.status === 'ok') {
      const locText = php.cod_loc ? ` Loc eliberat: ${php.cod_loc}.` : '';
      return `Ieșire înregistrată pentru ${plateNumber}.${locText}`;
    }

    if (php?.status === 'vehicul_inexistent') {
      return `${plateNumber} - Vehiculul nu există în sistem.`;
    }

    if (php?.status === 'acces_inexistent' || php?.status === 'vehicul_nu_este_in_parcare') {
      return `${plateNumber} - Vehiculul nu este în parcare.`;
    }

    return `${plateNumber} - Eroare la procesarea ieșirii: ${php?.message || php?.status || 'status necunoscut'}`;
  };

  const getResultColor = (php) => {
    if (!php) return '#444';
    if (php.success && php.status === 'ok') return '#15803d';
    return '#dc2626';
  };

  const handleManualExit = async () => {
    if (!plate.trim()) {
      setManualMessage('Introdu un număr valid!');
      setManualDetails(null);
      return;
    }

    try {
      setManualLoading(true);
      setManualMessage('Se procesează ieșirea...');
      setManualDetails(null);

      const normalizedPlate = plate.trim().toUpperCase();

      const res = await fetch('http://localhost/exit_vehicle.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ plate: normalizedPlate }),
      });

      const data = await res.json();

      setManualDetails(data);
      setManualMessage(buildExitMessage(normalizedPlate, data));
    } catch (error) {
      console.error(error);
      setManualMessage('Eroare la conectarea cu serverul.');
      setManualDetails(null);
    } finally {
      setManualLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setImageResult(null);
    setImageMessage('');

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleImageExit = async () => {
    if (!file) {
      setImageMessage('Selectează mai întâi o imagine.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setImageLoading(true);
      setImageMessage('Se procesează imaginea pentru ieșire...');
      setImageResult(null);

      const response = await axios.post('http://localhost:5000/api/ocr-exit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Răspuns ieșire imagine:', response.data);

      const data = response.data;

      if (data.status === 'plate_detected') {
        const php = data.php_result;

        const resultData = {
          plate: data.plate,
          ocr_score: data.ocr_score,
          yolo_confidence: data.yolo_confidence,
          bbox: data.bbox,
          php_result: php,
        };

        setImageResult(resultData);
        setImageMessage(buildExitMessage(data.plate, php));
      } else if (data.status === 'no_plate_detected') {
        setImageMessage('Nu s-a detectat niciun număr în imagine.');
      } else if (data.status === 'invalid_image') {
        setImageMessage('Imagine invalidă.');
      } else {
        setImageMessage('Răspuns necunoscut de la Flask pentru imagine.');
      }
    } catch (error) {
      console.error('Eroare imagine ieșire:', error);
      setImageMessage('Eroare la procesarea imaginii pentru ieșire.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleVideoChange = (e) => {
    const selectedVideo = e.target.files[0];

    if (!selectedVideo) return;

    setVideoFile(selectedVideo);
    setVideoResult(null);
    setVideoMessage('');

    const url = URL.createObjectURL(selectedVideo);
    setVideoPreviewUrl(url);
  };

  const handleVideoExit = async () => {
    if (!videoFile) {
      setVideoMessage('Selectează mai întâi un video.');
      return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      setVideoLoading(true);
      setVideoMessage('Se procesează video-ul pentru ieșire...');
      setVideoResult(null);

      const response = await axios.post('http://localhost:5000/api/ocr-exit-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Răspuns ieșire video:', response.data);

      const data = response.data;

      if (data.status === 'plate_detected') {
        const php = data.php_result;

        const resultData = {
          plate: data.plate,
          detections_count: data.detections_count,
          frequency: data.frequency,
          best_score_plate: data.best_score_plate,
          ocr_score: data.ocr_score,
          yolo_confidence: data.yolo_confidence,
          processed_video_url: data.processed_video_url,
          crop_url: data.crop_url,
          php_result: php,
        };

        setVideoResult(resultData);
        setVideoMessage(buildExitMessage(data.plate, php));
      } else if (data.status === 'no_plate_detected') {
        setVideoMessage('Nu s-a detectat niciun număr în video.');
      } else if (data.status === 'invalid_video_format') {
        setVideoMessage('Format video neacceptat.');
      } else {
        setVideoMessage('Răspuns necunoscut de la Flask pentru video.');
      }
    } catch (error) {
      console.error('Eroare video ieșire:', error);
      setVideoMessage('Eroare la procesarea video-ului pentru ieșire.');
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Ieșire vehicul</h2>

      <p style={styles.subtitle}>
        Încarcă o imagine sau un video cu vehiculul la ieșire. Sistemul detectează
        plăcuța, înregistrează ieșirea și eliberează automat locul ocupat.
      </p>

      {/* Imagine */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recunoaștere ieșire din imagine</h3>

        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          style={styles.fileInput}
        />

        <button
          onClick={handleImageExit}
          style={{
            ...styles.button,
            backgroundColor: imageLoading ? '#6b7280' : '#007bff',
            cursor: imageLoading ? 'not-allowed' : 'pointer',
          }}
          disabled={imageLoading}
        >
          {imageLoading ? 'Se procesează ieșirea...' : 'Procesează ieșire'}
        </button>

        {previewUrl && (
          <div style={styles.previewBox}>
            <h3 style={styles.sectionTitle}>Imagine analizată</h3>

            <img
              src={previewUrl}
              alt="Imagine vehicul ieșire"
              style={styles.previewImage}
            />
          </div>
        )}

        {imageMessage && (
          <p
            style={{
              ...styles.status,
              color: imageResult ? getResultColor(imageResult.php_result) : '#444',
            }}
          >
            {imageMessage}
          </p>
        )}

        {imageResult && (
          <ResultDetails result={imageResult} />
        )}
      </div>

      {/* Video */}
      <div style={styles.videoSection}>
        <h3 style={styles.sectionTitle}>Recunoaștere ieșire din video</h3>

        <input
          type="file"
          onChange={handleVideoChange}
          accept="video/*"
          style={styles.fileInput}
        />

        {videoPreviewUrl && (
          <div style={styles.videoPreviewBox}>
            <h3 style={styles.sectionTitle}>Video original</h3>

            <video
              src={videoPreviewUrl}
              controls
              style={styles.videoPreview}
            />
          </div>
        )}

        <button
          onClick={handleVideoExit}
          style={{
            ...styles.button,
            backgroundColor: videoLoading ? '#6b7280' : '#166534',
            cursor: videoLoading ? 'not-allowed' : 'pointer',
            marginTop: '16px',
          }}
          disabled={videoLoading}
        >
          {videoLoading ? 'Se procesează ieșirea...' : 'Procesează ieșire'}
        </button>

        {videoMessage && (
          <p
            style={{
              ...styles.status,
              color: videoResult ? getResultColor(videoResult.php_result) : '#444',
            }}
          >
            {videoMessage}
          </p>
        )}

        {videoResult && (
          <div style={styles.resultBox}>
            <h3 style={styles.resultTitle}>Rezultat video</h3>

            <p>
              <strong>Număr detectat:</strong> {videoResult.plate}
            </p>

            <p>
              <strong>Apariții ale numărului:</strong> {videoResult.frequency || '-'}
            </p>

            <p>
              <strong>Total detecții:</strong> {videoResult.detections_count || '-'}
            </p>

            <p>
              <strong>Cel mai bun număr după scor:</strong>{' '}
              {videoResult.best_score_plate || '-'}
            </p>

            <p>
              <strong>Scor OCR:</strong> {videoResult.ocr_score || '-'}
            </p>

            <p>
              <strong>Încredere YOLO:</strong> {videoResult.yolo_confidence || '-'}
            </p>

            {videoResult.processed_video_url && (
              <div style={styles.processedVideoBox}>
                <h3 style={styles.sectionTitle}>Video procesat cu detecție</h3>

                <video controls style={styles.videoPreview}>
                  <source src={videoResult.processed_video_url} type="video/mp4" />
                  Browserul nu poate reda acest video.
                </video>
              </div>
            )}

            {videoResult.crop_url && (
              <div style={styles.cropBox}>
                <h3 style={styles.sectionTitle}>Plăcuță decupată din video</h3>

                <img
                  src={videoResult.crop_url}
                  alt="Plăcuță detectată din video"
                  style={styles.cropImage}
                />

                <p style={styles.detectedPlate}>
                  Număr detectat: <strong>{videoResult.plate}</strong>
                </p>
              </div>
            )}

            <ExitDetails php={videoResult.php_result} />
          </div>
        )}
      </div>

      {/* Manual fallback */}
      <div style={styles.manualSection}>
        <h3 style={styles.sectionTitle}>Introducere manuală număr</h3>

        <p style={styles.smallText}>
          Folosește această variantă doar dacă OCR-ul nu detectează corect numărul.
        </p>

        <input
          type="text"
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          placeholder="Număr înmatriculare"
          style={styles.input}
        />

        <button
          onClick={handleManualExit}
          style={{
            ...styles.button,
            backgroundColor: manualLoading ? '#6b7280' : '#166534',
            cursor: manualLoading ? 'not-allowed' : 'pointer',
          }}
          disabled={manualLoading}
        >
          {manualLoading ? 'Se procesează...' : 'Procesează ieșirea manual'}
        </button>

        {manualMessage && (
          <p
            style={{
              ...styles.status,
              color: manualDetails ? getResultColor(manualDetails) : '#444',
            }}
          >
            {manualMessage}
          </p>
        )}

        {manualDetails && (
          <div style={styles.resultBox}>
            <h3 style={styles.resultTitle}>Detalii ieșire manuală</h3>
            <ExitDetails php={manualDetails} />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultDetails({ result }) {
  return (
    <div style={styles.resultBox}>
      <h3 style={styles.resultTitle}>Rezultat recunoaștere</h3>

      <p>
        <strong>Număr detectat:</strong> {result.plate}
      </p>

      <p>
        <strong>Scor OCR:</strong> {result.ocr_score}
      </p>

      <p>
        <strong>Încredere YOLO:</strong> {result.yolo_confidence}
      </p>

      <ExitDetails php={result.php_result} />
    </div>
  );
}

function ExitDetails({ php }) {
  if (!php) return null;

  return (
    <>
      <p>
        <strong>Status:</strong>{' '}
        {php.success && php.status === 'ok' ? 'Ieșire înregistrată' : 'Eroare'}
      </p>

      <p>
        <strong>Mesaj:</strong> {php.message || '-'}
      </p>

      {php.plate && (
        <p>
          <strong>Număr:</strong> {php.plate}
        </p>
      )}

      {php.cod_loc && (
        <div style={styles.successBox}>
          <p>
            <strong>Loc eliberat:</strong> {php.cod_loc}
          </p>
        </div>
      )}

      {php.data_in && (
        <p>
          <strong>Data intrare:</strong> {php.data_in}
        </p>
      )}

      {php.data_out && (
        <p>
          <strong>Data ieșire:</strong> {php.data_out}
        </p>
      )}
    </>
  );
}

const styles = {
  container: {
    maxWidth: '820px',
    margin: '40px auto',
    padding: '30px',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  },

  title: {
    marginBottom: '10px',
    color: '#15803d',
  },

  subtitle: {
    color: '#6b7280',
    lineHeight: '1.5',
    marginBottom: '24px',
  },

  section: {
    marginTop: '20px',
  },

  videoSection: {
    marginTop: '46px',
    paddingTop: '30px',
    borderTop: '1px solid #e5e7eb',
  },

  manualSection: {
    marginTop: '46px',
    paddingTop: '30px',
    borderTop: '1px solid #e5e7eb',
  },

  sectionTitle: {
    color: '#166534',
    marginBottom: '12px',
  },

  fileInput: {
    marginBottom: '20px',
    fontSize: '16px',
    padding: '10px',
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
    background: '#ffffff',
    marginBottom: '14px',
    marginTop: '10px',
  },

  button: {
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.3s',
  },

  previewBox: {
    marginTop: '30px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    padding: '12px',
  },

  previewImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '520px',
    margin: '0 auto',
    borderRadius: '10px',
  },

  videoPreviewBox: {
    marginTop: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    padding: '12px',
  },

  videoPreview: {
    width: '100%',
    maxHeight: '420px',
    borderRadius: '10px',
  },

  processedVideoBox: {
    marginTop: '24px',
    backgroundColor: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    padding: '14px',
  },

  status: {
    marginTop: '20px',
    fontWeight: 'bold',
  },

  resultBox: {
    marginTop: '28px',
    textAlign: 'left',
    backgroundColor: '#ffffff',
    padding: '18px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    color: '#374151',
    lineHeight: '1.7',
  },

  resultTitle: {
    color: '#166534',
    marginTop: 0,
  },

  cropBox: {
    marginTop: '28px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '18px',
  },

  cropImage: {
    maxWidth: '100%',
    border: '3px solid #22c55e',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(34,197,94,0.5)',
  },

  detectedPlate: {
    marginTop: '12px',
    fontSize: '18px',
    color: '#166534',
  },

  successBox: {
    marginTop: '14px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px',
    color: '#166534',
  },

  smallText: {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.5',
  },
};

export default ExitVehicle;


