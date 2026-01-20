/**
 * React hook for Iris voice assistant state machine
 * 
 * Provides a clean interface to the irisMachine, handling:
 * - Service injection (vision, camera)
 * - State derivation for UI
 * - Callbacks for state changes
 * 
 * @example
 * ```typescript
 * const { 
 *   state, 
 *   isListening, 
 *   isProcessing,
 *   transcript,
 *   lastDescription,
 *   error 
 * } = useIrisMachine({
 *   visionService,
 *   cameraService,
 * });
 * ```
 * 
 * @public
 */

import React from 'react';
import { useMachine } from '@xstate/react';
import { irisMachine, IrisMachineInput } from '../../machines/irisMachine';
import { VisionService } from '../../application/ports/VisionService';
import { ICameraService } from '../../../vision/application/ports/ICameraService';

/**
 * Configuration for useIrisMachine
 */
export interface UseIrisMachineOptions {
  /** Vision service for scene analysis */
  visionService: VisionService;
  /** Camera service for photo capture */
  cameraService: ICameraService;
  /** Callback when state changes */
  onStateChange?: (state: string) => void;
  /** Callback when description is generated */
  onDescription?: (description: string) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

/**
 * Possible UI states derived from machine state
 */
export type IrisUIState = 
  | 'initializing'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'stopped';

/**
 * Return value from useIrisMachine
 */
export interface UseIrisMachineReturn {
  /** Current high-level UI state */
  state: IrisUIState;
  /** Raw machine state value (for debugging) */
  rawState: string;
  /** True when listening for wake word */
  isListening: boolean;
  /** True when processing command (analyzing) */
  isProcessing: boolean;
  /** True when speaking response */
  isSpeaking: boolean;
  /** True when in error state */
  hasError: boolean;
  /** True when all services are ready */
  isReady: boolean;
  /** Current transcript (partial or final) */
  transcript: string;
  /** Last generated description */
  lastDescription: string | null;
  /** Error message if any */
  error: string | null;
  /** Retry from error state */
  retry: () => void;
  /** Stop the assistant */
  stop: () => void;
}

/**
 * Derive UI state from machine state value
 */
function deriveUIState(stateValue: string): IrisUIState {
  switch (stateValue) {
    case 'initializing':
    case 'checkingReadiness':
      return 'initializing';
    case 'listening':
      return 'listening';
    case 'processing':
    case 'analyzing':
      return 'processing';
    case 'speaking':
    case 'speakingHelp':
    case 'speakingError':
    case 'repeating':
      return 'speaking';
    case 'error':
      return 'error';
    case 'stopped':
      return 'stopped';
    default:
      return 'initializing';
  }
}

/**
 * Hook for using the Iris voice assistant state machine
 */
export function useIrisMachine(options: UseIrisMachineOptions): UseIrisMachineReturn {
  const { visionService, cameraService, onStateChange, onDescription, onError } = options;

  // Create machine input
  const machineInput: IrisMachineInput = React.useMemo(() => ({
    visionService,
    cameraService,
  }), [visionService, cameraService]);

  // Use the machine
  const [snapshot, send] = useMachine(irisMachine, {
    input: machineInput,
  });

  // Derive state values
  const rawState = snapshot.value as string;
  const state = deriveUIState(rawState);
  const context = snapshot.context;

  // Track previous state for change detection
  const prevStateRef = React.useRef(state);
  const prevDescriptionRef = React.useRef(context.lastDescription);
  const prevErrorRef = React.useRef(context.error);

  // Notify callbacks on changes
  React.useEffect(() => {
    // State change
    if (state !== prevStateRef.current) {
      console.log('[useIrisMachine] State changed:', prevStateRef.current, '->', state);
      onStateChange?.(state);
      prevStateRef.current = state;
    }

    // Description generated
    if (context.lastDescription && context.lastDescription !== prevDescriptionRef.current) {
      console.log('[useIrisMachine] New description:', context.lastDescription.substring(0, 50));
      onDescription?.(context.lastDescription);
      prevDescriptionRef.current = context.lastDescription;
    }

    // Error occurred
    if (context.error && context.error !== prevErrorRef.current) {
      console.log('[useIrisMachine] Error:', context.error);
      onError?.(context.error);
      prevErrorRef.current = context.error;
    }
  }, [state, context.lastDescription, context.error, onStateChange, onDescription, onError]);

  // Actions
  const retry = React.useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  const stop = React.useCallback(() => {
    send({ type: 'STOP' });
  }, [send]);

  return {
    // State
    state,
    rawState,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    isSpeaking: state === 'speaking',
    hasError: state === 'error',
    isReady: context.visionReady && context.cameraReady && context.permissionsGranted,

    // Context
    transcript: context.transcript,
    lastDescription: context.lastDescription,
    error: context.error,

    // Actions
    retry,
    stop,
  };
}
