/**
 * VisionDrive WebSocket Service
 * Connects to ws://127.0.0.1:8000/ws/monitor for live video frame processing
 */

import { getBaseUrl } from './api';

export class LiveMonitorSocket {
  constructor(options = {}) {
    this.options = options;
    this.ws = null;
    this.sessionId = null;
    this.isConnected = false;
    this.isStreaming = false;
    this.isAwaitingResponse = false;
    this.videoElement = null;
    this.canvasElement = document.createElement('canvas');
    this.canvasCtx = this.canvasElement.getContext('2d', { willReadFrequently: true });
    this.streamInterval = null;
    this.fps = options.fps || 10; // Target 10 frames per second for smooth AI inference
  }

  getWebSocketUrl() {
    const httpUrl = getBaseUrl();
    const wsProto = httpUrl.startsWith('https') ? 'wss:' : 'ws:';
    const host = httpUrl.replace(/^https?:\/\//, '');
    return `${wsProto}//${host}/ws/monitor`;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = this.getWebSocketUrl();

      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        return reject(err);
      }

      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.options.onOpen) this.options.onOpen();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Initial handshake message from backend
          if (data.session_id) {
            this.sessionId = data.session_id;
            if (this.options.onSessionCreated) {
              this.options.onSessionCreated(data.session_id);
            }
            resolve(this.sessionId);
            return;
          }

          // Frame inference data received
          this.isAwaitingResponse = false;

          if (this.options.onData) {
            this.options.onData(data);
          }

          if (data.alerts && data.alerts.length > 0 && this.options.onAlerts) {
            this.options.onAlerts(data.alerts);
          }
        } catch (err) {
          console.error('[VisionDrive WS] Parse error:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('[VisionDrive WS] Socket error:', error);
        if (this.options.onError) this.options.onError(error);
        if (!this.isConnected) {
          reject(new Error(`Failed to connect to ${url}. Make sure FastAPI is running.`));
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.isStreaming = false;
        this.stopStreaming();
        if (this.options.onClose) this.options.onClose(event);
      };
    });
  }

  startStreaming(videoElement) {
    if (!this.isConnected || !videoElement) {
      console.warn('[VisionDrive WS] Cannot stream: not connected or video unavailable');
      return;
    }

    this.videoElement = videoElement;
    this.isStreaming = true;
    this.isAwaitingResponse = false;

    // Use responsive resolution for MediaPipe/YOLO inference
    const targetWidth = 640;
    const targetHeight = 480;
    this.canvasElement.width = targetWidth;
    this.canvasElement.height = targetHeight;

    const intervalMs = Math.round(1000 / this.fps);

    this.streamInterval = setInterval(() => {
      this.sendCurrentFrame();
    }, intervalMs);
  }

  sendCurrentFrame() {
    if (!this.isStreaming || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Flow control: Avoid buffering frames if server is still processing previous one
    if (this.isAwaitingResponse) {
      return;
    }

    if (!this.videoElement || this.videoElement.readyState < 2) {
      return;
    }

    try {
      this.canvasCtx.drawImage(
        this.videoElement,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // Convert canvas to JPEG blob and send as binary buffer
      this.canvasElement.toBlob(
        async (blob) => {
          if (!blob || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
          try {
            const buffer = await blob.arrayBuffer();
            this.isAwaitingResponse = true;
            this.ws.send(buffer);
          } catch (err) {
            this.isAwaitingResponse = false;
            console.warn('[VisionDrive WS] Frame send error:', err);
          }
        },
        'image/jpeg',
        0.65 // Optimized JPEG quality for real-time vision processing
      );
    } catch (err) {
      console.error('[VisionDrive WS] Frame capture error:', err);
    }
  }

  stopStreaming() {
    this.isStreaming = false;
    this.isAwaitingResponse = false;
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
  }

  disconnect() {
    this.stopStreaming();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (err) {
        // Silent close
      }
      this.ws = null;
    }
    this.isConnected = false;
    this.sessionId = null;
  }
}

export default LiveMonitorSocket;
