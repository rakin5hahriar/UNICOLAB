import React, { useState, useEffect, useRef } from 'react';
import './VideoCall.css';

const VideoCall = ({ sessionId, userId, userName }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  
  const localVideoRef = useRef(null);

  // Initialize local media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        setIsConnecting(true);
        setError(null);
        
        // Request user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        
        // Set local stream
        setLocalStream(stream);
        
        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setIsConnecting(false);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Could not access camera or microphone. Please check permissions.');
        setIsConnecting(false);
      }
    };
    
    initializeMedia();
    
    // Clean up on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="video-call">
      <div className="video-grid">
        <div className="local-video-container">
          {isConnecting ? (
            <div className="connecting-message">
              <p>Connecting to camera...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`local-video ${isVideoOff ? 'video-off' : ''}`}
              />
              {isVideoOff && (
                <div className="video-off-indicator">
                  <span>{userName || 'You'}</span>
                </div>
              )}
              <div className="user-label">
                {userName || 'You'} (You)
              </div>
            </>
          )}
        </div>
        
        {/* Remote videos would be rendered here */}
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <div key={peerId} className="remote-video-container">
            <video
              autoPlay
              playsInline
              className="remote-video"
              srcObject={stream}
            />
            <div className="user-label">
              {peerId}
            </div>
          </div>
        ))}
      </div>
      
      <div className="video-controls">
        <button
          className={`control-button ${isMuted ? 'active' : ''}`}
          onClick={toggleAudio}
          disabled={!localStream}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button
          className={`control-button ${isVideoOff ? 'active' : ''}`}
          onClick={toggleVideo}
          disabled={!localStream}
        >
          {isVideoOff ? 'Show Video' : 'Hide Video'}
        </button>
      </div>
    </div>
  );
};

export default VideoCall; 