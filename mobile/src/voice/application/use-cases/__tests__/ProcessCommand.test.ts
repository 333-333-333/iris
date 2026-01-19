import { ProcessCommandUseCase, ProcessCommandResult } from '../ProcessCommand';
import { ParsedCommand } from '../../../domain/services/WakeWordParser';
import { VoiceCommand } from '../../../domain/entities/VoiceCommand';
import { CommandIntent, IntentType } from '../../../domain/value-objects/CommandIntent';
import { SpeechSynthesizer } from '../../ports/SpeechSynthesizer';
import { VisionService, SceneAnalysis } from '../../ports/VisionService';
import { DescriptionRepository } from '../../ports/DescriptionRepository';

describe('ProcessCommandUseCase', () => {
  // Mocks
  let mockSpeechSynthesizer: jest.Mocked<SpeechSynthesizer>;
  let mockVisionService: jest.Mocked<VisionService>;
  let mockRepository: jest.Mocked<DescriptionRepository>;
  let useCase: ProcessCommandUseCase;

  // Helper to create ParsedCommand
  const createParsedCommand = (
    intentType: IntentType,
    text: string = 'iris test',
    confidence: number = 0.9
  ): ParsedCommand => ({
    command: new VoiceCommand({ text, confidence, timestamp: Date.now() }),
    intent: CommandIntent.create(intentType, 0.9, 'test'),
    commandText: text.replace('iris ', ''),
  });

  beforeEach(() => {
    mockSpeechSynthesizer = {
      speak: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      isSpeaking: jest.fn().mockResolvedValue(false),
    };

    mockVisionService = {
      analyzeScene: jest.fn(),
      isReady: jest.fn().mockReturnValue(true),
    };

    mockRepository = {
      saveLastDescription: jest.fn().mockResolvedValue(undefined),
      getLastDescription: jest.fn().mockResolvedValue(null),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ProcessCommandUseCase({
      speechSynthesizer: mockSpeechSynthesizer,
      visionService: mockVisionService,
      repository: mockRepository,
    });
  });

  describe('DESCRIBE intent', () => {
    it('should analyze scene and speak description', async () => {
      const sceneAnalysis: SceneAnalysis = {
        description: 'Veo una persona y una silla',
        objects: [
          { label: 'person', confidence: 0.95 },
          { label: 'chair', confidence: 0.87 },
        ],
      };
      mockVisionService.analyzeScene.mockResolvedValue(sceneAnalysis);

      const parsedCommand = createParsedCommand(IntentType.DESCRIBE, 'iris describe');

      const result = await useCase.execute(parsedCommand);

      expect(result.success).toBe(true);
      expect(result.description).toBe('Veo una persona y una silla');
      expect(mockVisionService.analyzeScene).toHaveBeenCalledTimes(1);
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith('Veo una persona y una silla');
      expect(mockRepository.saveLastDescription).toHaveBeenCalledWith('Veo una persona y una silla');
    });

    it('should handle vision service error', async () => {
      mockVisionService.analyzeScene.mockRejectedValue(new Error('Camera not available'));

      const parsedCommand = createParsedCommand(IntentType.DESCRIBE);

      const result = await useCase.execute(parsedCommand);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Camera not available');
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith(
        expect.stringContaining('error')
      );
    });

    it('should handle vision service not ready', async () => {
      mockVisionService.isReady.mockReturnValue(false);

      const parsedCommand = createParsedCommand(IntentType.DESCRIBE);

      const result = await useCase.execute(parsedCommand);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not ready');
      expect(mockVisionService.analyzeScene).not.toHaveBeenCalled();
    });
  });

  describe('REPEAT intent', () => {
    it('should repeat last description', async () => {
      mockRepository.getLastDescription.mockResolvedValue('Descripción anterior');

      const parsedCommand = createParsedCommand(IntentType.REPEAT, 'iris repite');

      const result = await useCase.execute(parsedCommand);

      expect(result.success).toBe(true);
      expect(result.description).toBe('Descripción anterior');
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith('Descripción anterior');
      expect(mockVisionService.analyzeScene).not.toHaveBeenCalled();
    });

    it('should handle no previous description', async () => {
      mockRepository.getLastDescription.mockResolvedValue(null);

      const parsedCommand = createParsedCommand(IntentType.REPEAT);

      const result = await useCase.execute(parsedCommand);

      expect(result.success).toBe(false);
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith(
        expect.stringContaining('No hay descripción')
      );
    });
  });

  describe('HELP intent', () => {
    it('should speak available commands', async () => {
      const parsedCommand = createParsedCommand(IntentType.HELP, 'iris ayuda');

      const result = await useCase.execute(parsedCommand);

      expect(result.success).toBe(true);
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith(
        expect.stringContaining('describe')
      );
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith(
        expect.stringContaining('repite')
      );
    });
  });

  describe('STOP intent', () => {
    it('should stop current speech', async () => {
      mockSpeechSynthesizer.isSpeaking.mockResolvedValue(true);

      const parsedCommand = createParsedCommand(IntentType.STOP, 'iris stop');

      const result = await useCase.execute(parsedCommand);

      expect(result.success).toBe(true);
      expect(mockSpeechSynthesizer.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('GOODBYE intent', () => {
    it('should say goodbye and signal shutdown', async () => {
      const parsedCommand = createParsedCommand(IntentType.GOODBYE, 'iris adiós');

      const result = await useCase.execute(parsedCommand);

      expect(result.success).toBe(true);
      expect(result.shouldShutdown).toBe(true);
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith(
        expect.stringContaining('Hasta')
      );
    });
  });

  describe('UNKNOWN intent', () => {
    it('should handle unknown intent gracefully', async () => {
      const parsedCommand = createParsedCommand(IntentType.UNKNOWN, 'iris xyz');

      const result = await useCase.execute(parsedCommand);

      expect(result.success).toBe(false);
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith(
        expect.stringContaining('No entendí')
      );
    });
  });
});
