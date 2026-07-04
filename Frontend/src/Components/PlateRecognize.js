import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function PlateRecognize() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cropUrl, setCropUrl] = useState('');

  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [videoStatus, setVideoStatus] = useState('');
  const [videoResult, setVideoResult] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const [parkingStatus, setParkingStatus] = useState(null);

  const imageRef = useRef(null);

  useEffect(() => {
    const fetchParkingStatus = async () => {
      try {
        const response = await fetch('http://localhost/updateParkingStatus.php');
        const data = await response.json();
        setParkingStatus(data);
      } catch (error) {
        console.error('Eroare la fetch parking status:', error);
      }
    };

    fetchParkingStatus();
    const interval = setInterval(fetchParkingStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const buildAccessMessage = (plate, php) => {
    const loc = php?.cod_loc || php?.rezervare?.cod_loc || null;
    const locText = loc ? ` - Loc alocat: ${loc}` : '';

    if (php?.status === 'ok') {
      if (php.already_inside) {
        return `${plate} - Vehiculul este deja în parcare${locText}`;
      }

      if (php.acces_permis) {
        if (php.autorizare === 'abonat') {
          return `${plate} - Acces permis pe baza unui abonament activ${locText}`;
        }

        if (php.autorizare === 'rezervare') {
          return `${plate} - Acces permis pe baza unei rezervări active${locText}`;
        }

        return `${plate} - Acces permis${locText}`;
      }

      return `${plate} - Acces respins: ${php.motiv}`;
    }

    if (php?.status === 'vehicul_neinregistrat') {
      return `${plate} - Vehicul neînregistrat în sistem`;
    }

    return `${plate} - Eroare verificare acces: ${php?.status || 'status necunoscut'}`;
  };

  const getResultColor = (php) => {
    if (!php) return '#444';
    if (php.already_inside) return '#ca8a04';
    if (php.acces_permis) return '#15803d';
    return '#dc2626';
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setCropUrl('');
    setStatus('');

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleVideoChange = (e) => {
    const selectedVideo = e.target.files[0];

    if (!selectedVideo) return;

    setVideoFile(selectedVideo);
    setVideoResult(null);
    setVideoStatus('');

    const url = URL.createObjectURL(selectedVideo);
    setVideoPreviewUrl(url);
  };

  const createCropFromImage = (bbox) => {
    const img = imageRef.current;

    if (!img || !bbox) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const scaleX = naturalWidth / bbox.image_width;
    const scaleY = naturalHeight / bbox.image_height;

    const x = bbox.x1 * scaleX;
    const y = bbox.y1 * scaleY;
    const width = (bbox.x2 - bbox.x1) * scaleX;
    const height = (bbox.y2 - bbox.y1) * scaleY;

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

    setCropUrl(canvas.toDataURL('image/jpeg'));
  };

  const getBoxStyle = () => {
    if (!result?.bbox || !imageRef.current) return null;

    const img = imageRef.current;
    const bbox = result.bbox;

    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;

    const scaleX = displayWidth / bbox.image_width;
    const scaleY = displayHeight / bbox.image_height;

    return {
      left: `${bbox.x1 * scaleX}px`,
      top: `${bbox.y1 * scaleY}px`,
      width: `${(bbox.x2 - bbox.x1) * scaleX}px`,
      height: `${(bbox.y2 - bbox.y1) * scaleY}px`,
    };
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('Selectează mai întâi o imagine.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setLoading(true);
      setStatus('Se procesează imaginea...');
      setResult(null);
      setCropUrl('');

      const response = await axios.post('http://localhost:5000/api/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Răspuns imagine de la Flask:', response.data);

      const data = response.data;

      if (data.status === 'plate_detected') {
        const php = data.php_result;

        const newResult = {
          plate: data.plate,
          ocr_score: data.ocr_score,
          yolo_confidence: data.yolo_confidence,
          bbox: data.bbox,
          php_result: php,
        };

        setResult(newResult);

        setTimeout(() => {
          createCropFromImage(data.bbox);
        }, 100);

        setStatus(buildAccessMessage(data.plate, php));
      } else if (data.status === 'no_plate_detected') {
        setStatus('Nu s-a detectat niciun număr');
      } else if (data.status === 'invalid_image') {
        setStatus('Imagine invalidă');
      } else {
        setStatus('Răspuns necunoscut de la Flask');
      }
    } catch (error) {
      console.error('Eroare imagine:', error);
      setStatus('Eroare la procesarea imaginii');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async () => {
    if (!videoFile) {
      setVideoStatus('Selectează mai întâi un video.');
      return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      setVideoLoading(true);
      setVideoStatus('Se procesează video-ul...');
      setVideoResult(null);

      const response = await axios.post('http://localhost:5000/api/ocr-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Răspuns video de la Flask:', response.data);

      const data = response.data;

      if (data.status === 'plate_detected') {
        const php = data.php_result;

        setVideoResult({
          plate: data.plate,
          detections_count: data.detections_count,
          frequency: data.frequency,
          best_score_plate: data.best_score_plate,
          ocr_score: data.ocr_score,
          yolo_confidence: data.yolo_confidence,
          processed_video_url: data.processed_video_url,
          crop_url: data.crop_url,
          php_result: php,
        });

        setVideoStatus(buildAccessMessage(data.plate, php));
      } else if (data.status === 'no_plate_detected') {
        setVideoStatus('Nu s-a detectat niciun număr în video');
      } else if (data.status === 'invalid_video_format') {
        setVideoStatus('Format video neacceptat');
      } else {
        setVideoStatus('Răspuns necunoscut de la Flask pentru video');
      }
    } catch (error) {
      console.error('Eroare video:', error);
      setVideoStatus('Eroare la procesarea video-ului');
    } finally {
      setVideoLoading(false);
    }
  };

  const boxStyle = getBoxStyle();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Intrare vehicul în parcare</h2>

      <p style={styles.subtitle}>
        Încarcă o imagine sau un video cu vehiculul. Sistemul detectează plăcuța cu YOLO,
        citește numărul cu OCR și verifică accesul în baza de date.
      </p>

      {/* Imagine */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recunoaștere din imagine</h3>

        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          style={styles.fileInput}
        />

        <button
          onClick={handleUpload}
          style={{
            ...styles.button,
            backgroundColor: loading ? '#6b7280' : '#007bff',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          disabled={loading}
        >
          {loading ? 'Se procesează intrarea...' : 'Procesează intrarea'}
        </button>

        {previewUrl && (
          <div style={styles.imageSection}>
            <h3 style={styles.sectionTitle}>Imagine analizată</h3>

            <div style={styles.imageWrapper}>
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Imagine vehicul"
                style={styles.previewImage}
                onLoad={() => {
                  if (result?.bbox) {
                    createCropFromImage(result.bbox);
                  }
                }}
              />

              {result?.bbox && boxStyle && (
                <div style={{ ...styles.detectionBox, ...boxStyle }}>
                  <span style={styles.detectionLabel}>{result.plate}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {status && (
          <p
            style={{
              ...styles.status,
              color: result ? getResultColor(result.php_result) : '#444',
            }}
          >
            {status}
          </p>
        )}

        {cropUrl && (
          <div style={styles.cropBox}>
            <h3 style={styles.sectionTitle}>Plăcuță decupată</h3>

            <img
              src={cropUrl}
              alt="Plăcuță detectată"
              style={styles.cropImage}
            />

            <p style={styles.detectedPlate}>
              Număr detectat: <strong>{result?.plate}</strong>
            </p>
          </div>
        )}

        {result && <ResultDetails result={result} />}
      </div>

      {/* Video */}
      <div style={styles.videoSection}>
        <h3 style={styles.sectionTitle}>Recunoaștere din video</h3>

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
          onClick={handleVideoUpload}
          style={{
            ...styles.button,
            backgroundColor: videoLoading ? '#6b7280' : '#166534',
            cursor: videoLoading ? 'not-allowed' : 'pointer',
            marginTop: '16px',
          }}
          disabled={videoLoading}
        >
          {videoLoading ? 'Se procesează intrarea...' : 'Procesează intrarea'}
        </button>

        {videoStatus && (
          <p
            style={{
              ...styles.status,
              color: videoResult ? getResultColor(videoResult.php_result) : '#444',
            }}
          >
            {videoStatus}
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

            <AccessDetails php={videoResult.php_result} />
          </div>
        )}
      </div>

      {parkingStatus && (
        <div style={styles.parkingBox}>
          <h3>Status Parcare</h3>
          <p>
            <strong>Locuri libere:</strong> {parkingStatus.locuri_disponibile}
          </p>
        </div>
      )}
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

      <AccessDetails php={result.php_result} />
    </div>
  );
}

function AccessDetails({ php }) {
  if (!php) return null;

  const locAlocat = php?.cod_loc || php?.rezervare?.cod_loc || null;

  return (
    <>
      <p>
        <strong>Acces:</strong>{' '}
        {php.already_inside
          ? 'Deja în parcare'
          : php.acces_permis
          ? 'Permis'
          : 'Respins'}
      </p>

      <p>
        <strong>Autorizare:</strong> {php.autorizare || '-'}
      </p>

      <p>
        <strong>Motiv:</strong> {php.motiv || '-'}
      </p>

      {locAlocat && (
        <p>
          <strong>Loc alocat:</strong> {locAlocat}
        </p>
      )}

      {php.rezervare && (
        <div style={styles.successBox}>
          <p>
            <strong>Rezervare activă</strong>
          </p>
          <p>
            <strong>Loc:</strong> {php.rezervare.cod_loc}
          </p>
          <p>
            <strong>Start:</strong> {php.rezervare.start_time}
          </p>
          <p>
            <strong>End:</strong> {php.rezervare.end_time}
          </p>
        </div>
      )}

      {php.abonament && (
        <div style={styles.successBox}>
          <p>
            <strong>Abonament activ</strong>
          </p>
          <p>
            <strong>Tip:</strong> {php.abonament.tip}
          </p>
          <p>
            <strong>Expiră:</strong> {php.abonament.data_expirare}
          </p>
        </div>
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

  sectionTitle: {
    color: '#166534',
    marginBottom: '12px',
  },

  fileInput: {
    marginBottom: '20px',
    fontSize: '16px',
    padding: '10px',
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

  imageSection: {
    marginTop: '30px',
  },

  imageWrapper: {
    position: 'relative',
    display: 'inline-block',
    maxWidth: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
  },

  previewImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '520px',
  },

  detectionBox: {
    position: 'absolute',
    border: '3px solid #22c55e',
    boxSizing: 'border-box',
    borderRadius: '4px',
    boxShadow: '0 0 12px rgba(34,197,94,0.8)',
  },

  detectionLabel: {
    position: 'absolute',
    top: '-30px',
    left: '-3px',
    backgroundColor: '#22c55e',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '14px',
    padding: '4px 8px',
    borderRadius: '6px 6px 0 0',
    whiteSpace: 'nowrap',
  },

  status: {
    marginTop: '20px',
    fontWeight: 'bold',
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

  successBox: {
    marginTop: '14px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px',
    color: '#166534',
  },

  parkingBox: {
    marginTop: '40px',
    textAlign: 'left',
    backgroundColor: '#e9f5e9',
    padding: '15px',
    borderRadius: '8px',
    color: '#166534',
  },
};

export default PlateRecognize;