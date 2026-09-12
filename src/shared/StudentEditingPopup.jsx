import React, { useRef, useState, useEffect } from 'react';
import Modal from 'react-modal';
import Cropper from 'react-easy-crop'; // ✅ NEW: Manual cropper
import { FaCamera, FaUpload, FaTrash, FaCheck, FaSpinner, FaTimes } from 'react-icons/fa';
import { removeBackground } from '@imgly/background-removal';
import { Eye, EyeOff } from 'lucide-react';

Modal.setAppElement('#root');

// ✅ NEW: Helper to load image for canvas
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

// ✅ NEW: Crop the image to exact passport dimensions (413x531)
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 413;
  canvas.height = 531;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    413,
    531
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], 'cropped-photo.png', { type: 'image/png' }));
    }, 'image/png', 0.95);
  });
};

const StudentEditingPopup = ({
  isOpen,
  editingId,
  userType,
  formData,
  schoolCode,
  onFieldChange,
  onClassChange,
  classOptions,
  getSectionsForClass,
  photoPreview,
  photoFile,
  onPhotoChange,
  onRemovePhoto,
  onCancel,
  onSubmit,
  isLoading,
}) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  // 'idle' | 'checking' | 'available' | 'taken'
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const originalUsernameRef = useRef('');

  // ✅ NEW: Cropper State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  // Handle numeric input: Prevent non-numeric keys
  const handleNumericInput = (e, field) => {
    if (field === 'phone_no') {
      const currentValue = formData.phone_no || '';
      if (currentValue.length === 0 && !/[6-9]/.test(e.key)) {
        e.preventDefault();
      } else if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (field === 'aadhar_no') {
      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  // Sanitize input: Remove non-numeric characters
  const handleNumericChange = (field, value) => {
    let sanitizedValue = value.replace(/[^0-9]/g, '');
    if (field === 'phone_no') {
      if (sanitizedValue.length > 0 && !/[6-9]/.test(sanitizedValue[0])) {
        sanitizedValue = sanitizedValue.slice(1);
      }
      sanitizedValue = sanitizedValue.slice(0, 10);
    } else if (field === 'aadhar_no') {
      sanitizedValue = sanitizedValue.slice(0, 12);
    }
    onFieldChange(field, sanitizedValue);
  };

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setUsernameStatus('idle');
      originalUsernameRef.current = formData.username || '';
      // Check the pre-filled username too — it may already be a duplicate in the DB
      if (formData.username && formData.username.trim()) {
        checkUsernameAvailability(formData.username);
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Check whether a username is already taken by another user in this school
  const checkUsernameAvailability = async (rawValue) => {
    const trimmed = (rawValue || '').trim();

    if (!trimmed) {
      setUsernameStatus('idle');
      setErrors((prev) => {
        const next = { ...prev };
        delete next.username;
        return next;
      });
      return;
    }

    setUsernameStatus('checking');
    try {
      const excludeParam = editingId != null ? `&excludeId=${encodeURIComponent(editingId)}` : '';
      const response = await fetch(
        `https://cleezoclass.com:4000/api/user-info/${encodeURIComponent(trimmed)}?schoolCode=${encodeURIComponent(schoolCode || '')}${excludeParam}`
      );

      if (response.status === 404) {
        setUsernameStatus('available');
        setErrors((prev) => {
          const next = { ...prev };
          delete next.username;
          return next;
        });
        return;
      }

      if (response.ok) {
        // With excludeId sent, any 200 here means a DIFFERENT record already owns this username
        setUsernameStatus('taken');
        setErrors((prev) => ({ ...prev, username: 'This username is already taken' }));
        return;
      }

      // Unexpected response — don't block the user, just stop showing a "checking" state
      setUsernameStatus('idle');
    } catch (err) {
      console.error('Username availability check failed:', err);
      setUsernameStatus('idle');
    }
  };

  // Validation handler
  // const validateForm = () => {
  //   let tempErrors = {};
  //   if (!formData.name || !formData.name.trim()) {
  //     tempErrors.name = 'Full Name is required';
  //   }
  //   const cleanPhone = formData.phone_no ? String(formData.phone_no).trim() : '';
  //   if (!cleanPhone) {
  //     tempErrors.phone_no = 'Phone Number is required';
  //   } else if (cleanPhone.length !== 10) {
  //     tempErrors.phone_no = 'Phone Number must be exactly 10 digits';
  //   } else if (/^[1-5]/.test(cleanPhone)) {
  //     tempErrors.phone_no = 'Phone Number cannot start with 1, 2, 3, 4, or 5';
  //   }
  //   const cleanAadhar = formData.aadhar_no ? String(formData.aadhar_no).trim() : '';
  //   if (!cleanAadhar) {
  //     tempErrors.aadhar_no = 'Aadhar Number is required';
  //   } else if (cleanAadhar.length !== 12) {
  //     tempErrors.aadhar_no = 'Aadhar Number must be exactly 12 digits';
  //   }
  //   if (formData.user_type === 'student' && (!formData.class_name || !formData.class_name.trim())) {
  //     tempErrors.class_name = 'Class is required for students';
  //   }
  //   setErrors(tempErrors);
  //   return Object.keys(tempErrors).length === 0;
  // };

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.name || !formData.name.trim()) {
      tempErrors.name = 'Full Name is required';
    }

    const cleanPhone = formData.phone_no ? String(formData.phone_no).trim() : '';
    if (cleanPhone) {
      if (cleanPhone.length !== 10) {
        tempErrors.phone_no = 'Phone Number must be exactly 10 digits';
      } else if (/^[1-5]/.test(cleanPhone)) {
        tempErrors.phone_no = 'Phone Number cannot start with 1, 2, 3, 4, or 5';
      }
    }

    const cleanAadhar = formData.aadhar_no ? String(formData.aadhar_no).trim() : '';
    if (cleanAadhar && cleanAadhar.length !== 12) {
      tempErrors.aadhar_no = 'Aadhar Number must be exactly 12 digits';
    }

    if (formData.user_type === 'student' && (!formData.class_name || !formData.class_name.trim())) {
      tempErrors.class_name = 'Class is required for students';
    }

    if (usernameStatus === 'taken') {
      tempErrors.username = 'This username is already taken';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
};

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (isValid) {
      onSubmit(e);
    } else {
      setTimeout(() => {
        const firstErrorKey = Object.keys(errors)[0];
        const errorElement = document.getElementsByName(firstErrorKey)[0];
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }, 0);
    }
  };

  const openCamera = async () => {
    setCameraError('');
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please check permissions or use Upload Photo instead.');
      setShowCameraModal(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const imageUrl = URL.createObjectURL(blob);
      closeCamera();
      setImageSrc(imageUrl);
      setShowCropper(true); // ✅ Open cropper instead of processing directly
    }, 'image/jpeg', 0.95);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const detectWhiteBackground = (imageBlob) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const sampleSize = 10;
        const corners = [
          { x: 0, y: 0 }, { x: img.width - sampleSize, y: 0 },
          { x: 0, y: img.height - sampleSize }, { x: img.width - sampleSize, y: img.height - sampleSize }
        ];
        let whiteCount = 0;
        const threshold = 240;
        corners.forEach(corner => {
          const imageData = ctx.getImageData(corner.x, corner.y, sampleSize, sampleSize);
          const data = imageData.data;
          let cornerWhitePixels = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] > threshold && data[i + 1] > threshold && data[i + 2] > threshold) {
              cornerWhitePixels++;
            }
          }
          if (cornerWhitePixels > (sampleSize * sampleSize * 0.8)) {
            whiteCount++;
          }
        });
        resolve(whiteCount >= 3);
      };
      img.src = URL.createObjectURL(imageBlob);
    });
  };

  const processImage = async (file) => {
    setProcessing(true);
    setProcessingStatus('🔍 Analyzing image...');
    try {
      const hasWhiteBackground = await detectWhiteBackground(file);
      let finalBlob;

      if (hasWhiteBackground) {
        setProcessingStatus('📐 Resizing image...');
        finalBlob = await resizeImage(file);
      } else {
        setProcessingStatus('🪄 Removing background...');
        const blobWithoutBg = await removeBackground(file, { output: { format: 'image/png', quality: 0.9 } });
        setProcessingStatus('🎨 Adding white background...');
        finalBlob = await addWhiteBackgroundAndResize(blobWithoutBg);
      }

      const processedFile = new File([finalBlob], 'photo.png', { type: 'image/png' });
      onPhotoChange({ target: { files: [processedFile] } });
      setProcessingStatus('✅ Photo processed!');
      setTimeout(() => setProcessingStatus(''), 3000);
    } catch (error) {
      console.error('Error processing image:', error);
      setProcessingStatus('❌ Error. Using original photo.');
      onPhotoChange({ target: { files: [file] } });
    } finally {
      setProcessing(false);
    }
  };

  const resizeImage = async (imageBlob) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const targetWidth = 413, targetHeight = 531;
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth; canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        const imgAspect = img.width / img.height;
        const canvasAspect = targetWidth / targetHeight;
        let drawWidth, drawHeight, drawX, drawY;
        if (imgAspect > canvasAspect) {
          drawWidth = targetWidth * 0.85; drawHeight = drawWidth / imgAspect;
          drawX = (targetWidth - drawWidth) / 2; drawY = (targetHeight - drawHeight) / 2;
        } else {
          drawHeight = targetHeight * 0.85; drawWidth = drawHeight * imgAspect;
          drawX = (targetWidth - drawWidth) / 2; drawY = (targetHeight - drawHeight) / 2;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
      };
      img.src = URL.createObjectURL(imageBlob);
    });
  };

  const addWhiteBackgroundAndResize = async (imageBlob) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const targetWidth = 413, targetHeight = 531;
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth; canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        const imgAspect = img.width / img.height;
        const canvasAspect = targetWidth / targetHeight;
        let drawWidth, drawHeight, drawX, drawY;
        if (imgAspect > canvasAspect) {
          drawWidth = targetWidth * 0.85; drawHeight = drawWidth / imgAspect;
          drawX = (targetWidth - drawWidth) / 2; drawY = (targetHeight - drawHeight) / 2;
        } else {
          drawHeight = targetHeight * 0.85; drawWidth = drawHeight * imgAspect;
          drawX = (targetWidth - drawWidth) / 2; drawY = (targetHeight - drawHeight) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
      };
      img.src = URL.createObjectURL(imageBlob);
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setImageSrc(imageUrl);
    setShowCropper(true); // ✅ Open cropper instead of processing directly
  };

  const handleRemovePhoto = () => {
    setProcessingStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (onRemovePhoto) onRemovePhoto();
  };

  // ✅ NEW: Cropper Handlers
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setProcessingStatus('✂️ Cropping image...');
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      setShowCropper(false);
      setImageSrc(null);
      
      // Pass the cropped image to your existing smart processing pipeline
      await processImage(croppedImage);
    } catch (e) {
      console.error('Error cropping image:', e);
      alert('Failed to crop image');
      setShowCropper(false);
      setImageSrc(null);
    }
  };

  const styles = {
    // ... (Keep all your existing styles exactly as they were) ...
    cameraModal: {
      overlay: { backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
      content: { position: 'relative', backgroundColor: '#000', padding: '20px', borderRadius: '12px', maxWidth: '90vw', maxHeight: '90vh', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
    },
    cameraVideo: { width: '100%', maxWidth: '640px', height: 'auto', borderRadius: '8px', backgroundColor: '#000' },
    cameraControls: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' },
    captureButton: { padding: '16px 32px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(39, 174, 96, 0.4)' },
    closeButton: { position: 'absolute', top: '10px', right: '10px', width: '40px', height: '40px', borderRadius: '50%', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', zIndex: 10 },
    photoOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', cursor: 'pointer' },
    previewIconBtn: { border: 'none', background: '#fff', color: '#333', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    imagePreviewModal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40%', height: '50%', background: 'rgba(0, 0, 0, 0.58)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, borderRadius: '12px' },
    largePreviewImage: { maxWidth: '90%', maxHeight: '90%', borderRadius: '10px' },
    editModal: { overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000 }, content: { backgroundColor: '#fff', padding: '18px 22px 22px', borderRadius: '14px', width: '80vw', height: '80vh', overflowY: 'auto', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } },
    editForm: { display: 'flex', flexDirection: 'column', gap: '20px' },
    editFormHeader: { color: '#2c3e50', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #3498db' },
    formSection: { backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    sectionHeader: { color: '#3498db', marginBottom: '15px', paddingBottom: '5px', borderBottom: '1px solid #ecf0f1' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' },
    formGroup: { marginBottom: '10px' },
    formLabel: { display: 'block', marginBottom: '5px', fontWeight: '500', color: '#34495e', fontSize: '14px' },
    formInput: { width: '93%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' },
    readOnlyValue: { width: '93%', minHeight: '35px', padding: '8px', border: '1px solid #dbe3ea', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#f8fafc', color: '#334155', display: 'flex', alignItems: 'center', wordBreak: 'break-word' },
    errorInput: { borderColor: '#e74c3c', backgroundColor: '#fdf2f2' },
    errorText: { color: '#e74c3c', fontSize: '12px', marginTop: '4px', display: 'block' },
    passwordWrapper: { position: "relative", width: "100%" },
    passwordToggleBtn: { position: "absolute", right: "22px", top: "10%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    saveButton: { padding: '8px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', opacity: isLoading ? 0.8 : 1 },
    cancelButton: { padding: '8px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
    photoContainer: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
    photoPreviewWrapper: { position: 'relative', width: 150, height: 150, borderRadius: '8px', overflow: 'hidden', border: '2px solid #ddd', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    photoPreview: { width: '100%', height: '100%', objectFit: 'cover' },
    photoPlaceholderLarge: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#f8fafc', color: '#94a3b8', fontSize: 13 },
    removePhotoBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', zIndex: 5 },
    processingOverlay: { position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    photoActions: { display: 'flex', flexDirection: 'column', gap: 10 },
    photoActionButton: { padding: '10px 16px', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, width: "140px", fontSize: 13, justifyContent: 'center', gap: 8, cursor: 'pointer' },
    statusMessage: { padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, alignItems: 'center', gap: 8, marginTop: 8 },
    photoHint: { fontSize: 12, color: '#666', marginTop: '5px' },
    
    // ✅ NEW: Cropper Styles
    cropperOverlay: {
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 10001, padding: '20px',
    },
    cropperContainer: {
      position: 'relative', width: '100%', maxWidth: '500px', height: '400px',
      background: '#222', borderRadius: '12px', overflow: 'hidden',
    },
    cropperControls: {
      marginTop: '20px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '15px', width: '100%', maxWidth: '500px',
    },
    zoomControl: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' },
    zoomSlider: { width: '100%', accentColor: '#3b82f6', cursor: 'pointer' },
    cropperButtons: { display: 'flex', gap: '15px' },
    cancelCropBtn: { padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#6c757d', color: '#fff', fontWeight: '600', cursor: 'pointer' },
    applyCropBtn: { padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#10b981', color: '#fff', fontWeight: '600', cursor: 'pointer' },
  };

  return (
    <>
      <Modal isOpen={isOpen} onRequestClose={onCancel} contentLabel="Edit User" style={{ overlay: styles.editModal.overlay, content: styles.editModal.content }}>
        <form onSubmit={handleFormSubmit} style={styles.editForm}>
          <h3 style={styles.editFormHeader}>
            {userType === 'teacher' ? 'Teacher' : userType === 'management' ? 'Management User' : 'Student'} Details (ID: {editingId || ''})
          </h3>

          <div style={styles.formSection}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Student ID</label>
                <input type="text" name="id" value={String(editingId || '')} readOnly style={styles.formInput} />
              </div>
            </div>
          </div>

          <div style={styles.formSection}>
            <h4 style={styles.sectionHeader}>Student Photo</h4>
            <div style={styles.photoContainer}>
              <div style={styles.photoPreviewWrapper}>
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Student" style={styles.photoPreview} />
                    <div style={styles.photoOverlay} onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}>
                      <button type="button" style={styles.previewIconBtn} onClick={() => setShowPhotoPreview(true)}><Eye size={20} /></button>
                    </div>
                    {processing && (
                      <div style={styles.processingOverlay}>
                        <FaSpinner size={24} className="spin-animation" color="#fff" />
                        <span style={{ color: '#fff', fontSize: 12, marginTop: 8 }}>Processing...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.photoPlaceholderLarge}><FaCamera size={32} color="#cbd5e1" /><span style={{ marginTop: 8 }}>No Photo</span></div>
                )}
                {photoPreview && !processing && (
                  <button type="button" onClick={handleRemovePhoto} style={styles.removePhotoBtn} title="Remove photo"><FaTrash size={12} /></button>
                )}
              </div>

              <div style={styles.photoActions}>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={processing} style={{ ...styles.photoActionButton, background: processing ? '#94a3b8' : 'linear-gradient(135deg, #3498db, #2980b9)', cursor: processing ? 'not-allowed' : 'pointer' }}>
                  <FaUpload size={14} /><span>{photoFile ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                <button type="button" onClick={openCamera} disabled={processing} style={{ ...styles.photoActionButton, background: processing ? '#94a3b8' : 'linear-gradient(135deg, #27ae60, #229954)', cursor: processing ? 'not-allowed' : 'pointer' }}>
                  <FaCamera size={14} /><span>Click Photo</span>
                </button>
                {processingStatus && (
                  <div style={{ ...styles.statusMessage, background: processingStatus.includes('✅') ? '#f0fdf4' : processingStatus.includes('❌') ? '#fef2f2' : '#eff6ff', color: processingStatus.includes('✅') ? '#166534' : processingStatus.includes('❌') ? '#991b1b' : '#1e40af', border: processingStatus.includes('✅') ? '1px solid #bbf7d0' : processingStatus.includes('❌') ? '1px solid #fecaca' : '1px solid #bfdbfe' }}>
                    {processingStatus.includes('✅') && <FaCheck size={12} />}
                    <span>{processingStatus}</span>
                  </div>
                )}
                <div style={styles.photoHint}>💡 Smart processing: Crop manually, then auto-remove background & resize to ID card</div>
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} accept="image/*" style={{ display: 'none' }} />
            </div>
          </div>

          <div style={styles.formSection}>
            <h4 style={styles.sectionHeader}>Personal Information</h4>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Full Name*</label>
                <input type="text" name="name" value={formData.name || ''} onChange={(e) => onFieldChange('name', e.target.value)} style={{ ...styles.formInput, textTransform: 'uppercase', ...(errors.name ? styles.errorInput : {}) }} />
                {errors.name && <span style={styles.errorText}>{errors.name}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ''}
                  onChange={(e) => {
                    onFieldChange('username', e.target.value);
                    if (usernameStatus !== 'idle') setUsernameStatus('idle');
                  }}
                  onBlur={(e) => checkUsernameAvailability(e.target.value)}
                  style={{ ...styles.formInput, ...(errors.username ? styles.errorInput : {}) }}
                />
                {usernameStatus === 'checking' && (
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Checking availability...</span>
                )}
                {/* {usernameStatus === 'available' && !errors.username && (
                  <span style={{ fontSize: '12px', color: '#166534' }}>Username is available</span>
                )} */}
                {errors.username && <span style={styles.errorText}>{errors.username}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Password</label>
                <div style={styles.passwordWrapper}>
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password || ''} onChange={(e) => onFieldChange('password', e.target.value)} style={styles.formInput} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.passwordToggleBtn} title={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Gender</label>
                <select name="gender" value={formData.gender || ''} onChange={(e) => onFieldChange('gender', e.target.value)} style={styles.formInput}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob || ''} onChange={(e) => onFieldChange('dob', e.target.value)} style={styles.formInput} />
              </div>
            </div>
          </div>

          <div style={styles.formSection}>
            <h4 style={styles.sectionHeader}>Contact Information</h4>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Phone Number*</label>
                <input type="text" name="phone_no" value={formData.phone_no || ''} onChange={(e) => handleNumericChange('phone_no', e.target.value)} onKeyDown={(e) => handleNumericInput(e, 'phone_no')} style={{ ...styles.formInput, ...(errors.phone_no ? styles.errorInput : {}) }} />
                {errors.phone_no && <span style={styles.errorText}>{errors.phone_no}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Aadhar Number*</label>
                <input type="text" name="aadhar_no" value={formData.aadhar_no || ''} onChange={(e) => handleNumericChange('aadhar_no', e.target.value)} onKeyDown={(e) => handleNumericInput(e, 'aadhar_no')} style={{ ...styles.formInput, ...(errors.aadhar_no ? styles.errorInput : {}) }} />
                {errors.aadhar_no && <span style={styles.errorText}>{errors.aadhar_no}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Father's Name</label>
                <input type="text" name="father_name" value={formData.father_name || ''} onChange={(e) => onFieldChange('father_name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))} style={{ ...styles.formInput, textTransform: 'uppercase' }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Address</label>
                <textarea name="address" value={formData.address || ''} onChange={(e) => onFieldChange('address', e.target.value)} style={{ ...styles.formInput, minHeight: '80px' }} />
              </div>
            </div>
          </div>

          {formData.user_type === 'student' && (
            <>
              <div style={styles.formSection}>
                <h4 style={styles.sectionHeader}>Enrollment Information</h4>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Class*</label>
                    <input type="text" name="class_name" value={formData.class_name || ''} onChange={(e) => onClassChange(e.target.value)} placeholder="Enter Class" style={{ ...styles.formInput, ...(errors.class_name ? styles.errorInput : {}) }} />
                    {errors.class_name && <span style={styles.errorText}>{errors.class_name}</span>}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Section</label>
                    <input type="text" name="section" value={formData.section || ''} onChange={(e) => onFieldChange('section', e.target.value)} placeholder="Enter Section" style={styles.formInput} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Class Teacher</label>
                    <input type="text" name="class_teacher" value={formData.class_teacher || ''} onChange={(e) => onFieldChange('class_teacher', e.target.value)} style={styles.formInput} />
                  </div>
                  <div style={styles.formGroup}>
  <label style={styles.formLabel}>School Name</label>
  <input
    type="text"
    name="school_name"
    value={formData.school_name || ''}
    disabled
    style={{
      ...styles.formInput,
      backgroundColor: "#f5f5f5",
      cursor: "not-allowed",
    }}
  />
</div>
                </div>
              </div>
              <div style={styles.formSection}>
                <h4 style={styles.sectionHeader}>Academic IDs</h4>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Admission No.</label>
                    <input type="text" name="admission_no" value={formData.admission_no || ''} onChange={(e) => onFieldChange('admission_no', e.target.value)} style={styles.formInput} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Curriculum</label>
                    <input type="text" name="curriculum" value={formData.curriculum || ''} onChange={(e) => onFieldChange('curriculum', e.target.value)} placeholder="e.g. CBSE / ICSE / State Board" style={styles.formInput} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>CBSE Reg No.</label>
                    <input type="text" name="cbse_reg_no" value={formData.cbse_reg_no || ''} onChange={(e) => onFieldChange('cbse_reg_no', e.target.value)} style={styles.formInput} />
                  </div>
                </div>
              </div>
            </>
          )}

          {(formData.user_type === 'teacher' || formData.user_type === 'management') && (
            <div style={styles.formSection}>
              <h4 style={styles.sectionHeader}>Staff Details</h4>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>{formData.user_type === 'teacher' ? 'Subject' : 'Designation'}</label>
                  <input type="text" name="designation" value={formData.designation || ''} onChange={(e) => onFieldChange('designation', e.target.value)} style={styles.formInput} />
                </div>
                {formData.user_type === 'teacher' && (
                  <>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <div style={styles.formGroup} key={num}>
                        <label style={styles.formLabel}>Teaches to Class {num}</label>
                        <input type="text" name={`teaches_to_${num}`} value={formData[`teaches_to_${num}`] || ''} onChange={(e) => onFieldChange(`teaches_to_${num}`, e.target.value)} style={styles.formInput} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          <div style={styles.formActions}>
            <button type="submit" style={styles.saveButton} disabled={isLoading || usernameStatus === 'checking'}>{isLoading ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" onClick={onCancel} style={styles.cancelButton} disabled={isLoading}>Cancel</button>
          </div>
        </form>

        {showPhotoPreview && (
          <div style={styles.imagePreviewModal} onClick={() => setShowPhotoPreview(false)}>
            <img src={photoPreview} alt="Student" style={styles.largePreviewImage} onClick={() => setShowPhotoPreview(false)} />
          </div>
        )}

        {/* ✅ NEW: Manual Cropper Modal */}
        {showCropper && imageSrc && (
          <div style={styles.cropperOverlay}>
            <div style={styles.cropperContainer}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={413 / 531} // ✅ Forces exact passport photo ratio
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={styles.cropperControls}>
              <div style={styles.zoomControl}>
                <label style={{ color: '#fff', fontSize: '14px' }}>Zoom & Adjust Frame</label>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={styles.zoomSlider} />
              </div>
              <div style={styles.cropperButtons}>
                <button type="button" onClick={() => { setShowCropper(false); setImageSrc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={styles.cancelCropBtn}>Cancel</button>
                <button type="button" onClick={handleApplyCrop} style={styles.applyCropBtn}>Apply Crop & Process</button>
              </div>
            </div>
          </div>
        )}

        {showCameraModal && (
          <Modal isOpen={showCameraModal} onRequestClose={closeCamera} contentLabel="Camera" style={styles.cameraModal}>
            <button type="button" onClick={closeCamera} style={styles.closeButton} title="Close camera"><FaTimes /></button>
            <video ref={videoRef} style={styles.cameraVideo} autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={styles.cameraControls}>
              <button type="button" onClick={capturePhoto} style={styles.captureButton}><FaCamera size={20} /> Capture Photo</button>
            </div>
            {cameraError && (
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '14px' }}>{cameraError}</div>
            )}
          </Modal>
        )}
      </Modal>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-animation { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
};

export default StudentEditingPopup;