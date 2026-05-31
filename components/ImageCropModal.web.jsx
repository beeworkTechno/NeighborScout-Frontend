import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImageFile } from '../utils/cropImage';

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

  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      if (!croppedPixels || !imageUri) return;

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

        <div style={styles.cropBox}>
          <Cropper
            image={imageUri}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div style={styles.zoomArea}>
          <label style={styles.zoomLabel}>Zoom</label>

          <input
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            style={styles.slider}
          />
        </div>

        <div style={styles.buttonRow}>
          <button type="button" style={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>

          <button type="button" style={styles.saveButton} onClick={handleSave}>
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
    marginBottom: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 700,
    color: '#222',
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

  zoomLabel: {
    display: 'block',
    fontWeight: 700,
    marginBottom: 8,
    color: '#222',
  },

  slider: {
    width: '100%',
  },

  buttonRow: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    border: 'none',
    borderRadius: 10,
    padding: 13,
    backgroundColor: '#eee',
    color: '#222',
    fontWeight: 700,
    cursor: 'pointer',
  },

  saveButton: {
    flex: 1,
    border: 'none',
    borderRadius: 10,
    padding: 13,
    backgroundColor: '#F9B208',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
};