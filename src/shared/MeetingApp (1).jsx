import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Share } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
// import Video from './Video';

const CreateMeeting = ({ onCreated }) => {
  const [email, setEmail] = React.useState('');
  const [note, setNote] = React.useState('');
  const [meetingId, setMeetingId] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  // Get current school data (case-insensitive match)
 
  const handleCreate = async () => {
    if (!email.trim()) return alert('Please enter an email.');
    if (!validateEmail(email)) return alert('Invalid email format.');

    try {
      setLoading(true);
      const res = await axios.post('https://cleezoclass.com:4000/create-meeting', {
        recipientEmail: email,
        counselorName: 'School Counselor',
        note, // sending note too, if backend supports
      });

      if (res.data && res.data.success) {
        const meetingId = res.data.meetingId;
        setMeetingId(meetingId);

        onCreated?.(meetingId);
        alert('Meeting invite sent!');
      } else {
        alert(res.data.error || 'Failed to create meeting.');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#f0f2f5',
        maxWidth: '400px',
        margin: '40px auto',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        border: '3px solid #ccc',
      }}
    >
      <h3 style={{ marginBottom: '20px', color: '#333' }}>Create & Invite</h3>

      <div style={{ marginBottom: '15px' }}>
        <input
          type="email"
          placeholder="Recipient Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <textarea
          placeholder="Write a note or invitation message (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={loading}
          rows={4}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <button
        onClick={handleCreate}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          backgroundColor: loading ? '#999' : '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s ease',
        }}
      >
        {loading ? 'Sending...' : 'Send Invite'}
      </button>

      {meetingId && (
        <div
          style={{
            marginTop: '25px',
            textAlign: 'left',
            wordBreak: 'break-word',
            fontSize: '14px',
            color: '#333',
          }}
        >
          <p>
            <strong>Generated ID:</strong> <code>{meetingId}</code>
          </p>
          <p>
            <strong>Meeting Link:</strong>{' '}
            <a
              href={`https://cleezoclass.com:4000/meeting/${meetingId}/video`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007bff', textDecoration: 'none' }}
            >
              {`https://cleezoclass.com:4000/meeting/${meetingId}/video`}
            </a>
          </p>
        </div>
      )}
    </div>
  );
};


const SlotPicker = ({ onSlotConfirmed, roomId }) => {
  const [slotTime, setSlotTime] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        const res = await axios.get(`https://cleezoclass.com:4000/available-slots?meetingId=${roomId}`);
        const available = Array.isArray(res.data.availableSlots) ? res.data.availableSlots : [];

        // Convert to full slot object { value, label } using 12hr format
        const slotObjects = available.map((slotValue) => {
          const [hour, minute] = slotValue.split(':');
          const date = new Date();
          date.setHours(parseInt(hour));
          date.setMinutes(parseInt(minute));
          const label = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          return { value: slotValue, label };
        });

        setAvailableSlots(slotObjects);
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setAvailableSlots([]);
      }
    };

    if (roomId) {
      fetchAvailableSlots();
    }
  }, [roomId]);

  const handleConfirmSlot = async (e) => {
    e.preventDefault();
    if (!slotTime) {
      setNotification({ type: 'error', message: 'Please select a slot time' });
      return;
    }

    setLoading(true);
    try {
      await axios.post('https://cleezoclass.com:4000/select-slot', {
        meetingId: roomId,
        slotTime,
      });
      setSubmitted(true);
      setNotification({ type: 'success', message: 'Slot confirmed successfully!' });
      onSlotConfirmed(slotTime);
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error saving slot. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const perRow = Math.ceil(availableSlots.length / 3);
  const rows = [
    availableSlots.slice(0, perRow),
    availableSlots.slice(perRow, perRow * 2),
    availableSlots.slice(perRow * 2),
  ];

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <>
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: notification.type === 'error' ? '#ff4d4f' : '#4BB543',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 10000,
            fontWeight: '600',
          }}
        >
          {notification.message}
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          fontFamily: 'Segoe UI, sans-serif',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div
        className="slot-picker-content"
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: '28px',
              color: '#1f2d3d',
              fontWeight: '600',
            }}
          >
            Select a 30-Minute Slot
          </h2>

          {availableSlots.length === 0 && (
            <p style={{ fontSize: '18px', color: '#888', marginBottom: '20px' }}>
              No available slots for this meeting.
            </p>
          )}

          <form onSubmit={handleConfirmSlot} style={{ flex: '1 1 auto' }}>
            {rows.map((rowSlots, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: idx === 2 ? 0 : '16px',
                }}
              >
                {rowSlots.map(({ value, label }) => {
                  const isSelected = slotTime === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={submitted}
                      onClick={() => !submitted && setSlotTime(value)}
                      style={{
                        flex: '1 0 10%',
                        minWidth: '70px',
                        padding: '12px 8px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #764ba2' : '1px solid #ccc',
                        backgroundColor: isSelected ? '#764ba2' : '#f7faff',
                        color: isSelected ? '#fff' : '#1f2d3d',
                        cursor: submitted ? 'not-allowed' : 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        boxShadow: isSelected ? '0 4px 12px rgba(118, 75, 162, 0.5)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitted || loading || !slotTime}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '14px',
                fontSize: '17px',
                fontWeight: '600',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: submitted || loading || !slotTime ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transform: loading ? 'scale(0.98)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.5)',
              }}
            >
              {loading
                ? 'Submitting...'
                : submitted
                ? 'Slot Confirmed'
                : 'Submit Slot'}
            </button>

            {submitted && (
              <p
                style={{
                  marginTop: '24px',
                  color: '#38b000',
                  fontWeight: '600',
                  fontSize: '16px',
                  animation: 'fadeIn 0.6s ease-in',
                }}
              >
                ✅ Slot confirmed. Please wait for Join button to appear.
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
};






const MeetingApp = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [slotConfirmed, setSlotConfirmed] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [retry, setRetry] = useState(false);
 
const [waitingForConfirmation, setWaitingForConfirmation] = useState(false); // Add this line
  // Determine effective meeting ID
  const effectiveRoomId = roomId || searchParams.get('meetingId');

useEffect(() => {
  if (!effectiveRoomId) return;

  const checkMeetingStatus = async () => {
 

    try {
      const res = await axios.get(`https://cleezoclass.com:4000/validate-meeting/${effectiveRoomId}`);
     

      const meeting = res.data;

      if (meeting.valid) {
        if (meeting.slotTime) {
          console.log('[Client] Meeting slot confirmed at:', meeting.slotTime);
          setConfirmedSlot(meeting.slotTime);
          setSlotConfirmed(true);
          enableJoinButton(meeting.slotTime);
        } else {
         
          setShowSlotPicker(true);
        }
      } else {
        console.warn('[Client] Invalid meeting ID:', meeting.message);
        setError(meeting.message || 'Invalid meeting ID');
      }
    } catch (err) {
      console.error('[Client] Error validating meeting:', err);
      setError('Failed to validate meeting.');
    }
  };

  checkMeetingStatus();
}, [effectiveRoomId]);


  const enableJoinButton = (slotTime) => {
    const [hours, minutes] = slotTime.split(':').map(Number);
    const now = new Date();
    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    const joinTime = slotDate.getTime() - 3 * 60 * 1000; // 3 minutes before slot

    const interval = setInterval(() => {
      const diff = joinTime - Date.now();
      if (diff <= 0) {
        setCanJoin(true);
        clearInterval(interval);
      } else {
        setCountdown(Math.ceil(diff / 1000));
      }
    }, 1000);
  };
const errorStyle = 'background: white; color: red; font-size: 18px; padding: 4px 8px; border-radius: 4px; font-weight: bold;';
const warnStyle = 'background: white; color: orange; font-size: 18px; padding: 4px 8px; border-radius: 4px; font-weight: bold;';

const handleJoin = async () => {
  console.log('[handleJoin] Join button clicked');

  try {
    // Check if mediaDevices exists, fallback alert if not
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera and microphone API not supported by your browser. Please update your browser or try a different one.');
      setError('Media devices API not supported.');
      return;
    }

    // Attempt permissions query if supported (may fail on some browsers)
    let camPermState = 'prompt';
    let micPermState = 'prompt';

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const camPerm = await navigator.permissions.query({ name: 'camera' });
        camPermState = camPerm.state;
        const micPerm = await navigator.permissions.query({ name: 'microphone' });
        micPermState = micPerm.state;
        console.log('[handleJoin] Camera permission:', camPermState);
        console.log('[handleJoin] Microphone permission:', micPermState);

        if (camPermState === 'denied' || micPermState === 'denied') {
          alert('Please enable camera and microphone permissions in your browser settings.');
          setRetry(true);
          return;
        }
      }
    } catch (permErr) {
      // Permissions API failed or unsupported — proceed anyway
      console.warn('[handleJoin] Permissions API query failed, proceeding to request getUserMedia directly.', permErr);
    }

    // Request camera + mic access - force getUserMedia regardless of permission query result
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    // Assign stream to video element to display webcam feed
    const videoElement = document.getElementById('my-video');
    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.play().catch(() => {}); // Play video, ignore play promise errors
      console.log('[handleJoin] Video stream assigned to element and playing.');
    } else {
      console.warn('[handleJoin] Video element #my-video not found');
    }

    // Validate meeting before joining
    console.log(`[handleJoin] Validating meeting: ${effectiveRoomId}`);
    const res = await axios.get(`https://cleezoclass.com:4000/validate-meeting/${effectiveRoomId}`);
    if (res.data.valid) {
      console.log('[handleJoin] Meeting is valid, joining...');
      setJoined(true);
    } else {
      console.warn('[handleJoin] Invalid meeting: ' + (res.data.message || ''));
      setError(res.data.message || 'Invalid meeting ID');
    }
  } catch (error) {
    console.error('[handleJoin] Meeting join error:', error);

    if (
      error.name === 'NotFoundError' || // No device found
      error.name === 'DevicesNotFoundError' || // Older Firefox error name
      error.name === 'PermissionDeniedError' ||
      error.name === 'NotAllowedError'
    ) {
      alert('Please enable camera and microphone permissions to continue.');
      setRetry(true);
    } else {
      alert('Error accessing camera/microphone: ' + (error.message || error.toString()));
      setError(error.response?.data?.message || error.message || 'Failed to join meeting');
    }
  }
};



// Updated handleSlotConfirmed to initialize camera access as soon as slot confirmed
const handleSlotConfirmed = (selectedSlot) => {
  setConfirmedSlot(selectedSlot);
  setSlotConfirmed(true);
  setWaitingForConfirmation(true);

  // Async camera initialization function with robust fallback
  const initCamera = async () => {
    console.log('Requesting camera and microphone permission...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera and microphone access.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoElement = document.getElementById('my-video');
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play().catch(() => {});
        console.log('Camera initialized and video stream set.');
      } else {
        console.warn('Video element not found');
      }
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Camera and microphone permission denied. Please allow access to continue.');
        console.error('User denied camera/mic permissions');
      } else {
        console.error('Error accessing media devices:', err);
        alert('Could not access camera/microphone: ' + err.message);
      }
    }
  };

  initCamera();

  // Start polling backend until confirmed slot is fully accepted
  const pollInterval = setInterval(async () => {
    try {
      const res = await axios.get(`https://cleezoclass.com:4000/validate-meeting/${effectiveRoomId}`);
      const meeting = res.data;

      if (meeting.valid && meeting.slotTime === selectedSlot) {
        clearInterval(pollInterval);
        setCanJoin(true);
        setWaitingForConfirmation(false);
        console.log('[Poll] Slot fully confirmed by backend.');
      } else {
        console.log('[Poll] Waiting for backend to confirm slot...');
      }
    } catch (err) {
      console.error('[Poll] Error checking slot confirmation:', err);
    }
  }, 3000);
};



  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!effectiveRoomId) {
return (
  <div className="create-meeting-container" style={{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
    background: '#f0f2f5',
    animation: 'gradientAnimation 10s ease infinite',
    padding: '2rem',
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: 'Segoe UI, sans-serif',
    flexWrap: 'wrap',
  }}>
   
    {/* Left Side - Create Meeting Box */}
    <div className="create-meeting-form-box" style={{
      flex: '1',
      minWidth: '300px',
      maxWidth: '420px',
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '20px',
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
      marginRight: '2rem',
      marginLeft: '5rem',
      animation: 'fadeInUp 0.5s ease-in-out',
    }}>
      <h2 style={{ color: '#1e3c72', fontSize: '2rem', marginBottom: '1.2rem' }}>
        Create a Meeting
      </h2>
      <CreateMeeting
        onCreated={(newMeetingId) => {
          navigate(`/meeting/${newMeetingId}/video`);
        }}
      />
    </div>

    {/* Right Side - Image */}
 <div className="create-meeting-image-box" style={{
  flex: '1',
  minWidth: '300px', // More flexible for smaller screens
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: '1rem',
  padding: '1rem',
  boxSizing: 'border-box',
}}>
  <img
    src="https://media.licdn.com/dms/image/v2/C5612AQH1UIShdmli9w/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1587404714905?e=2147483647&v=beta&t=t3E9vEsk7eDDsf6v4EnLUzzLVYbLDKspjb2Gb7lQMFM"
    alt="Meeting Illustration"
    style={{
      width: '100%',
      maxWidth: '720px',        // Increased from 650px
      minHeight: '280px',       // Ensures good vertical space
      height: 'auto',
      borderRadius: '20px',
      objectFit: 'cover',
      boxShadow: '0 10px 25px rgba(149, 149, 149, 0.3)',
      animation: 'fadeInRight 0.8s ease-in-out',
    }}
  />
</div>


    {/* Animations & Responsive Styles */}
<style>
    {`
      @keyframes gradientAnimation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes fadeInRight {
        from { opacity: 0; transform: translateX(40px); }
        to { opacity: 1; transform: translateX(0); }
      }

      /* --- NEW RESPONSIVE STYLES --- */
      @media (max-width: 900px) {
        .create-meeting-container {
          flex-direction: column !important; /* Stack form and image vertically */
          height: auto !important;
          padding: 1rem !important;
        }

        .create-meeting-form-box {
          margin: 0 0 2rem 0 !important; /* Remove side margin, add bottom margin */
          width: 100%;
          max-width: none;
        }

        .create-meeting-image-box {
          margin-top: 1rem !important;
        }

        /* Adjustments for Slot Picker Modal on smaller screens */
        .slot-picker-content {
            padding: 20px 15px !important;
        }
        .slot-picker-content h2 {
            font-size: 22px !important;
        }
      }
    `}
</style>
  </div>
);


  }

  if (joined) {
    // return <Video roomId={effectiveRoomId} />;
  }

 return (
  <div
    style={{
      maxWidth: 400,
      margin: '40px auto',
      padding: 20,
      borderRadius: 12,
      background: 'linear-gradient(135deg, #4a90e2, #50e3c2)',
      color: '#fff',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      textAlign: 'center',
    }}
  >
    <h2 style={{ marginBottom: 24, fontWeight: '700', fontSize: 26 }}>
      Meeting: {effectiveRoomId}
    </h2>

    {showSlotPicker && !slotConfirmed && (
      <SlotPicker
        onSlotConfirmed={handleSlotConfirmed}
        roomId={effectiveRoomId}
        style={{ marginBottom: 20 }}
      />
    )}

    {slotConfirmed && (
   <>
  <div
    style={{
       position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90vw',
    maxWidth: 900,
    maxHeight: '80vh',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: 20,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    padding: 40,
    boxSizing: 'border-box',
    zIndex: 9999,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#222',
    textAlign: 'center',
    animation: 'fadeInScale 0.5s ease-in-out',
    overflowY: 'auto',
    }}
  >
    <p style={{ fontSize: 28, fontWeight: '700', marginBottom: 24 }}>
      Slot Confirmed: <strong>{confirmedSlot}</strong>
    </p>

    {waitingForConfirmation && (
      <p style={{ fontSize: 18, fontWeight: '500', marginBottom: 32, color: '#666' }}>
        ⏳ Waiting for backend to confirm your slot...
      </p>
    )}

    {!waitingForConfirmation && canJoin ? (
      <button
        onClick={handleJoin} onclick="initCamera()"
        style={{
          cursor: 'pointer',
          backgroundColor: '#222',
          border: 'none',
          borderRadius: 8,
          padding: '14px 32px',
          fontSize: 18,
          fontWeight: '600',
          color: '#fff',
          transition: 'all 0.3s ease',
          marginBottom: 24,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#444';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#222';
        }}
      >
        ▶️ Join Video Call
      </button>
    ) : (
      !waitingForConfirmation && (
        <p style={{ fontSize: 18, fontWeight: '500', marginBottom: 32 }}>
          Join available in: <strong>{countdown}</strong> seconds
        </p>
      )
    )}

    {retry && (
      <button
        onClick={handleJoin}
        style={{
          cursor: 'pointer',
          backgroundColor: '#222',
          border: 'none',
          borderRadius: 8,
          padding: '14px 32px',
          fontSize: 18,
          fontWeight: '600',
          color: '#fff',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#444';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#222';
        }}
      >
        🔄 Retry Join
      </button>
    )}
  </div>

  {/* Popup animation keyframes */}
  <style>
    {`
      @keyframes fadeInScale {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
    `}
  </style>
</>

    )}
  </div>
);

};

export default MeetingApp;