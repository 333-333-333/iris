// Speech Synthesis
export { ExpoSpeechSynthesizer, InMemoryDescriptionRepository } from './simple/SimpleSpeechAdapter';

// Speech Recognition - Expo (Recommended)
export { ExpoSpeechRecognitionAdapter } from './expo/ExpoSpeechRecognitionAdapter';

// Speech Recognition - Cloud-based
export { ReactNativeVoiceAdapter } from './cloud/ReactNativeVoiceAdapter';

// Speech Recognition - On-device
export { WhisperAdapter } from './whisper/WhisperAdapter';

// Speech Recognition - Mock (for testing)
export { MockVoiceAdapter } from './mock/MockVoiceAdapter';

// Types
export type { SpeechRecognitionResult, SpeechRecognizerOptions } from './expo/ExpoSpeechRecognitionAdapter';
