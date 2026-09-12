// ----------------------------------------------
// 🔥 FIX SIMPLE-PEER ERRORS IN BROWSER
// ----------------------------------------------
window.global = window;
window.process = { env: { DEBUG: undefined } };
import { Buffer } from "buffer";
window.Buffer = Buffer;

// ----------------------------------------------
// IMPORTS
// ----------------------------------------------
import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

// Your signaling server
const socket = io('http://192.168.0.110:5000');

const VideoCall = ({ roomId, userId, isInitiator }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // ------------------------------------------
  // 📌 SETUP WEBCAM + JOIN ROOM + SIGNALING
  // ------------------------------------------
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        // Join room
        socket.emit('join-room', roomId, userId);

        // IF INITIATOR (CALLER)
        if (isInitiator) {
          socket.on('user-joined', (otherUserId) => {
            const peer = createPeer(otherUserId, userId, mediaStream);
            peerRef.current = peer;
          });
        }

        // IF RECEIVER
        socket.on('receive-call', ({ signal, from }) => {
          const peer = addPeer(signal, from, mediaStream);
          peerRef.current = peer;
        });

        // CALL ACCEPTED
        socket.on('call-accepted', ({ signal }) => {
          peerRef.current?.signal(signal);
        });

      });

    return () => {
      socket.disconnect();
      if (peerRef.current) peerRef.current.destroy();
    };

  }, [roomId, userId, isInitiator]);


  // ------------------------------------------
  // 📌 INITIATOR CREATES PEER
  // ------------------------------------------
  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('send-call', { userToSignal, callerId, signal });
    });

    peer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    return peer;
  };


  // ------------------------------------------
  // 📌 RECEIVER ANSWERS PEER
  // ------------------------------------------
  const addPeer = (incomingSignal, from, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('accept-call', { signal, to: from });
    });

    peer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    peer.signal(incomingSignal);
    return peer;
  };


  // ------------------------------------------
  // 🎤 TOGGLE AUDIO
  // ------------------------------------------
  const toggleAudio = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    });
  };

  // ------------------------------------------
  // 🎥 TOGGLE VIDEO
  // ------------------------------------------
  const toggleVideo = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    });
  };

  return (
    <div
      style={{
        border: '2px solid #ccc',
        padding: '20px',
        borderRadius: '12px',
        width: '650px',
        backgroundColor: '#ffffff',
        margin: '30px auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <h3
        style={{
          textAlign: 'center',
          marginBottom: '15px',
          fontSize: '20px',
          color: '#333'
        }}
      >
        {userId} {isInitiator ? '(Caller)' : '(Receiver)'}
      </h3>

      {/* Local Video */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '260px',
          background: '#000',
          borderRadius: '10px',
          objectFit: 'cover',
        }}
      />

      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '260px',
          background: '#000',
          marginTop: '10px',
          borderRadius: '10px',
          objectFit: 'cover',
        }}
      />

      {/* Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '15px',
        }}
      >
        <button
          onClick={toggleAudio}
          style={{
            padding: '10px 18px',
            background: audioEnabled ? '#ff4d4d' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '10px',
          }}
        >
          {audioEnabled ? 'Mute Mic 🔇' : 'Unmute Mic 🎤'}
        </button>

        <button
          onClick={toggleVideo}
          style={{
            padding: '10px 18px',
            background: videoEnabled ? '#ff9933' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          {videoEnabled ? 'Turn Off Camera 📷' : 'Turn On Camera 📹'}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
