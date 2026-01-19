import 'react-native-gesture-handler/jestSetup';

// Mock expo modules
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

jest.mock('expo-camera', () => ({
  Camera: {
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  },
  CameraView: 'CameraView',
}));

// Mock @react-native-voice/voice
jest.mock('@react-native-voice/voice', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  destroy: jest.fn(),
  cancel: jest.fn(),
  isAvailable: jest.fn(),
  isRecognizing: jest.fn(),
  onSpeechStart: jest.fn(),
  onSpeechEnd: jest.fn(),
  onSpeechResults: jest.fn(),
  onSpeechError: jest.fn(),
  onSpeechPartialResults: jest.fn(),
  onSpeechVolumeChanged: jest.fn(),
  removeAllListeners: jest.fn(),
  getSpeechRecognitionServices: jest.fn(),
}));

// Mock whisper.rn
jest.mock('whisper.rn', () => ({
  initWhisper: jest.fn(),
  initWhisperVad: jest.fn(),
  RealtimeTranscriber: jest.fn(),
}));

// Mock react-native-audio-pcm-stream
jest.mock('@fugood/react-native-audio-pcm-stream', () => ({
  AudioPcmStreamAdapter: jest.fn(),
}));

// Mock XState
jest.mock('xstate', () => ({
  setup: jest.fn(),
  createActor: jest.fn(),
}));

jest.mock('@xstate/react', () => ({
  useMachine: jest.fn(),
  useActor: jest.fn(),
}));