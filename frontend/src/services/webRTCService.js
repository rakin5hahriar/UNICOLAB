import socketService from './socketService';

class WebRTCService {
  constructor() {
    this.peerConnections = new Map(); // Map of userId -> RTCPeerConnection
    this.localStream = null;
    this.remoteStreams = new Map(); // Map of userId -> MediaStream
    this.onRemoteStreamHandler = null;
    this.onRemoteStreamRemovedHandler = null;
    this.onLocalStreamHandler = null;
    this.onConnectionStateChangeHandler = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Set up socket event listeners for WebRTC signaling
    socketService.on('webrtc-offer', this.handleOffer.bind(this));
    socketService.on('webrtc-answer', this.handleAnswer.bind(this));
    socketService.on('webrtc-ice-candidate', this.handleIceCandidate.bind(this));
    socketService.on('user-left', this.handleUserLeft.bind(this));

    this.initialized = true;
  }

  // Set event handlers
  setOnRemoteStream(handler) {
    this.onRemoteStreamHandler = handler;
  }

  setOnRemoteStreamRemoved(handler) {
    this.onRemoteStreamRemovedHandler = handler;
  }

  setOnLocalStream(handler) {
    this.onLocalStreamHandler = handler;
  }

  setOnConnectionStateChange(handler) {
    this.onConnectionStateChangeHandler = handler;
  }

  // Start local media stream
  async startLocalStream(videoEnabled = true, audioEnabled = true) {
    try {
      const constraints = {
        video: videoEnabled,
        audio: audioEnabled
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.onLocalStreamHandler) {
        this.onLocalStreamHandler(this.localStream);
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Stop local media stream
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // Create a peer connection for a specific user
  async createPeerConnection(userId) {
    if (this.peerConnections.has(userId)) {
      return this.peerConnections.get(userId);
    }

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendWebRTCIceCandidate(userId, event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChangeHandler) {
        this.onConnectionStateChangeHandler(userId, peerConnection.connectionState);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (!this.remoteStreams.has(userId)) {
        this.remoteStreams.set(userId, new MediaStream());
      }
      
      const remoteStream = this.remoteStreams.get(userId);
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });

      if (this.onRemoteStreamHandler) {
        this.onRemoteStreamHandler(userId, remoteStream);
      }
    };

    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
  }

  // Initiate a call to another user
  async callUser(userId) {
    try {
      const peerConnection = await this.createPeerConnection(userId);
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socketService.sendWebRTCOffer(userId, offer);
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  // Handle an incoming offer
  async handleOffer({ offer, fromUserId }) {
    try {
      const peerConnection = await this.createPeerConnection(fromUserId);
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socketService.sendWebRTCAnswer(fromUserId, answer);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  // Handle an incoming answer
  async handleAnswer({ answer, fromUserId }) {
    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  // Handle an incoming ICE candidate
  async handleIceCandidate({ candidate, fromUserId }) {
    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Handle a user leaving
  handleUserLeft({ userId }) {
    if (this.peerConnections.has(userId)) {
      const peerConnection = this.peerConnections.get(userId);
      peerConnection.close();
      this.peerConnections.delete(userId);
    }

    if (this.remoteStreams.has(userId)) {
      const remoteStream = this.remoteStreams.get(userId);
      remoteStream.getTracks().forEach(track => track.stop());
      
      if (this.onRemoteStreamRemovedHandler) {
        this.onRemoteStreamRemovedHandler(userId);
      }
      
      this.remoteStreams.delete(userId);
    }
  }

  // End a call with a specific user
  endCall(userId) {
    if (this.peerConnections.has(userId)) {
      const peerConnection = this.peerConnections.get(userId);
      peerConnection.close();
      this.peerConnections.delete(userId);
    }

    if (this.remoteStreams.has(userId)) {
      const remoteStream = this.remoteStreams.get(userId);
      remoteStream.getTracks().forEach(track => track.stop());
      
      if (this.onRemoteStreamRemovedHandler) {
        this.onRemoteStreamRemovedHandler(userId);
      }
      
      this.remoteStreams.delete(userId);
    }
  }

  // End all calls
  endAllCalls() {
    for (const userId of this.peerConnections.keys()) {
      this.endCall(userId);
    }
  }

  // Clean up resources
  cleanup() {
    this.endAllCalls();
    this.stopLocalStream();
    this.initialized = false;
  }
}

// Create a singleton instance
const webRTCService = new WebRTCService();

export default webRTCService; 