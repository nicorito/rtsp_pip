export interface CameraConfig {
  username: string;
  password: string;
  ipAddress: string;
  port?: number;
  streamPath?: string;
  protocol?: 'rtsp' | 'http';
}

export interface RTSPUrlOptions {
  useSubStream?: boolean; // Use lower quality stream
  useTCP?: boolean; // Force TCP transport
}

/**
 * Build RTSP URL for Tapo cameras
 */
export function buildTapoRTSPUrl(
  config: CameraConfig,
  options: RTSPUrlOptions = {}
): string {
  const { username, password, ipAddress, port = 554 } = config;
  const { useSubStream = false } = options;

  const streamPath = useSubStream ? 'stream2' : 'stream1';

  return `rtsp://${username}:${password}@${ipAddress}:${port}/${streamPath}`;
}

/**
 * Build generic RTSP URL
 */
export function buildRTSPUrl(
  config: CameraConfig,
  options: RTSPUrlOptions = {}
): string {
  const {
    username,
    password,
    ipAddress,
    port = 554,
    streamPath = 'stream1'
  } = config;

  return `rtsp://${username}:${password}@${ipAddress}:${port}/${streamPath}`;
}

/**
 * Validate RTSP URL format
 */
export function validateRTSPUrl(url: string): boolean {
  const rtspPattern = /^rtsp:\/\/.+/i;
  return rtspPattern.test(url);
}

/**
 * Parse RTSP URL to extract components
 */
export function parseRTSPUrl(url: string): Partial<CameraConfig> | null {
  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== 'rtsp:') {
      return null;
    }

    return {
      username: urlObj.username || undefined,
      password: urlObj.password || undefined,
      ipAddress: urlObj.hostname,
      port: urlObj.port ? parseInt(urlObj.port) : 554,
      streamPath: urlObj.pathname.slice(1), // Remove leading /
    };
  } catch (error) {
    return null;
  }
}

/**
 * Common RTSP URL templates for different camera brands
 */
export const CAMERA_TEMPLATES = {
  tapo: {
    main: 'rtsp://{username}:{password}@{ip}:554/stream1',
    sub: 'rtsp://{username}:{password}@{ip}:554/stream2',
  },
  hikvision: {
    main: 'rtsp://{username}:{password}@{ip}:554/Streaming/Channels/101',
    sub: 'rtsp://{username}:{password}@{ip}:554/Streaming/Channels/102',
  },
  dahua: {
    main: 'rtsp://{username}:{password}@{ip}:554/cam/realmonitor?channel=1&subtype=0',
    sub: 'rtsp://{username}:{password}@{ip}:554/cam/realmonitor?channel=1&subtype=1',
  },
  onvif: {
    main: 'rtsp://{username}:{password}@{ip}:554/onvif1',
  },
};
