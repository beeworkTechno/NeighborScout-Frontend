import React, { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImageFile } from '../utils/cropImage';

const MIN_ZOOM = 0.3;
const DEFAULT_ZOOM = 0.75;
const MAX_ZOOM = 4;

export default function ImageCropModal({
  visible,
  imageUri,
  aspect = 1,
  fileName = 'cropped-image.jpg',
  onCancel,
  onCropDone,
}) {
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && imageUri) {
      setCrop({
        x: 0,
        y: 0,
      });

      setZoom(DEFAULT_ZOOM);
      setCroppedPixels(null);
      setSaving(false);
    }
  }, [visible, imageUri]);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      if (!croppedPixels || !imageUri || saving) return;

      setSaving(true);

      const croppedFile = await getCroppedImageFile(
        imageUri,
        croppedPixels,
        fileName
      );

      const previewUri = URL.createObjectURL(croppedFile);

      onCropDone({
        file: croppedFile,
        uri: previewUri,
      });
    } catch (error) {
      console.log('Crop Save Error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!visible || !imageUri) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Crop Photo</h2>

        <p style={styles.helperText}>
          Use the slider to zoom in or zoom out, then drag the image to adjust.
        </p>

        <div style={styles.cropBox}>
          <Cropper
            image={imageUri}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            aspect={aspect}
            restrictPosition={false}
            objectFit="contain"
            zoomWithScroll
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div style={styles.zoomArea}>
          <div style={styles.zoomHeader}>
            <label style={styles.zoomLabel}>Zoom</label>
            <span style={styles.zoomValue}>{zoom.toFixed(1)}x</span>
          </div>

          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            style={styles.slider}
          />

          <div style={styles.zoomButtons}>
            <button
              type="button"
              style={styles.smallButton}
              onClick={() =>
                setZoom((currentZoom) =>
                  Math.max(MIN_ZOOM, Number((currentZoom - 0.1).toFixed(2)))
                )
              }
            >
              Zoom Out
            </button>

            <button
              type="button"
              style={styles.smallButton}
              onClick={() => setZoom(DEFAULT_ZOOM)}
            >
              Reset
            </button>

            <button
              type="button"
              style={styles.smallButton}
              onClick={() =>
                setZoom((currentZoom) =>
                  Math.min(MAX_ZOOM, Number((currentZoom + 0.1).toFixed(2)))
                )
              }
            >
              Zoom In
            </button>
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button type="button" style={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>

          <button
            type="button"
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.65 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Use Cropped Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modal: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 10px 35px rgba(0,0,0,0.35)',
  },

  title: {
    margin: 0,
    marginBottom: 6,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 700,
    color: '#222',
  },

  helperText: {
    margin: 0,
    marginBottom: 14,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },

  cropBox: {
    position: 'relative',
    width: '100%',
    height: 360,
    backgroundColor: '#111',
    borderRadius: 14,
    overflow: 'hidden',
  },

  zoomArea: {
    marginTop: 18,
  },

  zoomHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  zoomLabel: {
    display: 'block',
    fontWeight: 700,
    color: '#222',
  },

  zoomValue: {
    fontWeight: 700,
    color: '#666',
  },

  slider: {
    width: '100%',
  },

  zoomButtons: {
    display: 'flex',
    gap: 10,
    marginTop: 12,
  },

  smallButton: {
    flex: 1,
    border: 'none',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#f2f2f2',
    color: '#222',
    fontWeight: 700,
    cursor: 'pointer',
  },

  buttonRow: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    border: 'none',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#f5f5f5',
    color: '#222',
    fontWeight: 700,
    cursor: 'pointer',
  },

  saveButton: {
    flex: 1,
    border: 'none',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFB300',
    color: '#fff',
    fontWeight: 700,
    boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
  },
};