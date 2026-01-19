import { createActor } from 'xstate';
import { voiceMachine } from '../voiceMachine';

describe('voiceMachine', () => {
  describe('initial state', () => {
    it('should start in idle state', () => {
      const actor = createActor(voiceMachine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should have empty context initially', () => {
      const actor = createActor(voiceMachine);
      actor.start();

      const { context } = actor.getSnapshot();
      expect(context.transcript).toBe('');
      expect(context.error).toBeNull();
      expect(context.lastDescription).toBeNull();
      expect(context.retryCount).toBe(0);
    });
  });

  describe('idle state', () => {
    it('should transition to listening on START event', () => {
      const actor = createActor(voiceMachine);
      actor.start();

      actor.send({ type: 'START' });

      expect(actor.getSnapshot().value).toBe('listening');
    });

    it('should ignore STOP event in idle state', () => {
      const actor = createActor(voiceMachine);
      actor.start();

      actor.send({ type: 'STOP' });

      expect(actor.getSnapshot().value).toBe('idle');
    });
  });

  describe('listening state', () => {
    it('should update transcript on VOICE_DETECTED event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.9,
      });

      expect(actor.getSnapshot().context.transcript).toBe('iris describe');
    });

    it('should ignore low confidence transcripts', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.3,
      });

      // Should stay in listening, transcript not updated meaningfully
      expect(actor.getSnapshot().value).toBe('listening');
    });

    it('should transition to processing when wake word detected', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe what you see',
        confidence: 0.9,
      });

      expect(actor.getSnapshot().value).toBe('processing');
    });

    it('should stay in listening when no wake word', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'describe what you see',
        confidence: 0.9,
      });

      expect(actor.getSnapshot().value).toBe('listening');
    });

    it('should transition to idle on STOP event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      actor.send({ type: 'STOP' });

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should transition to error on ERROR event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      actor.send({ type: 'ERROR', error: 'Microphone access denied' });

      expect(actor.getSnapshot().value).toBe('error');
      expect(actor.getSnapshot().context.error).toBe('Microphone access denied');
    });
  });

  describe('processing state', () => {
    it('should transition to speaking on COMMAND_PROCESSED event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.9,
      });

      actor.send({
        type: 'COMMAND_PROCESSED',
        description: 'Veo una persona',
        success: true,
      });

      expect(actor.getSnapshot().value).toBe('speaking');
      expect(actor.getSnapshot().context.lastDescription).toBe('Veo una persona');
    });

    it('should transition to error on processing failure', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.9,
      });

      actor.send({
        type: 'COMMAND_PROCESSED',
        success: false,
        error: 'Vision failed',
      });

      expect(actor.getSnapshot().value).toBe('error');
    });
  });

  describe('speaking state', () => {
    it('should transition to listening on SPEECH_DONE event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.9,
      });
      actor.send({
        type: 'COMMAND_PROCESSED',
        description: 'Veo una persona',
        success: true,
      });

      expect(actor.getSnapshot().value).toBe('speaking');

      actor.send({ type: 'SPEECH_DONE' });

      expect(actor.getSnapshot().value).toBe('listening');
    });

    it('should transition to idle on STOP event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.9,
      });
      actor.send({
        type: 'COMMAND_PROCESSED',
        description: 'test',
        success: true,
      });

      actor.send({ type: 'STOP' });

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should transition to idle on SHUTDOWN event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris adios',
        confidence: 0.9,
      });
      actor.send({
        type: 'COMMAND_PROCESSED',
        description: 'Hasta luego',
        success: true,
        shouldShutdown: true,
      });

      actor.send({ type: 'SHUTDOWN' });

      expect(actor.getSnapshot().value).toBe('idle');
    });
  });

  describe('error state', () => {
    it('should transition to listening on RETRY event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({ type: 'ERROR', error: 'Temporary error' });

      expect(actor.getSnapshot().value).toBe('error');

      actor.send({ type: 'RETRY' });

      expect(actor.getSnapshot().value).toBe('listening');
      expect(actor.getSnapshot().context.retryCount).toBe(1);
    });

    it('should transition to idle on STOP event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({ type: 'ERROR', error: 'Error' });

      actor.send({ type: 'STOP' });

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should increment retry count on each RETRY', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      // First error and retry
      actor.send({ type: 'ERROR', error: 'Error 1' });
      actor.send({ type: 'RETRY' });
      expect(actor.getSnapshot().context.retryCount).toBe(1);

      // Second error and retry
      actor.send({ type: 'ERROR', error: 'Error 2' });
      actor.send({ type: 'RETRY' });
      expect(actor.getSnapshot().context.retryCount).toBe(2);
    });

    it('should clear error on RETRY', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({ type: 'ERROR', error: 'Some error' });

      expect(actor.getSnapshot().context.error).toBe('Some error');

      actor.send({ type: 'RETRY' });

      expect(actor.getSnapshot().context.error).toBeNull();
    });
  });

  describe('context management', () => {
    it('should clear transcript when returning to listening', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.9,
      });
      actor.send({
        type: 'COMMAND_PROCESSED',
        description: 'Test',
        success: true,
      });
      actor.send({ type: 'SPEECH_DONE' });

      expect(actor.getSnapshot().context.transcript).toBe('');
    });

    it('should reset retry count when successfully processing command', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      // Create some retries
      actor.send({ type: 'ERROR', error: 'Error' });
      actor.send({ type: 'RETRY' });
      expect(actor.getSnapshot().context.retryCount).toBe(1);

      // Successful processing
      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.9,
      });
      actor.send({
        type: 'COMMAND_PROCESSED',
        description: 'Test',
        success: true,
      });

      expect(actor.getSnapshot().context.retryCount).toBe(0);
    });
  });
});
