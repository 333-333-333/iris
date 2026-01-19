import { ParsedCommand } from '../../domain/services/WakeWordParser';
import { IntentType } from '../../domain/value-objects/CommandIntent';
import { SpeechSynthesizer } from '../ports/SpeechSynthesizer';
import { VisionService } from '../ports/VisionService';
import { DescriptionRepository } from '../ports/DescriptionRepository';

/**
 * Result of processing a voice command
 * 
 * @public
 */
export interface ProcessCommandResult {
  /** Whether the command executed successfully */
  success: boolean;
  /** Optional description result from command execution */
  description?: string;
  /** Error message if command execution failed */
  error?: string;
  /** Flag to indicate the application should shutdown (e.g., on goodbye command) */
  shouldShutdown?: boolean;
}

/**
 * Dependencies required to process voice commands
 * 
 * @internal
 */
interface ProcessCommandDependencies {
  /** Service for synthesizing speech responses */
  speechSynthesizer: SpeechSynthesizer;
  /** Service for analyzing the visual scene */
  visionService: VisionService;
  /** Repository for persisting scene descriptions */
  repository: DescriptionRepository;
}

const HELP_MESSAGE = `
Puedes decir: 
describe, para ver lo que hay frente a ti.
repite, para escuchar la última descripción.
ayuda, para escuchar estos comandos.
adiós, para cerrar.
`.trim();

const ERROR_MESSAGES = {
  visionNotReady: 'La cámara no está lista. Por favor, intenta de nuevo.',
  noDescription: 'No hay descripción anterior para repetir.',
  unknownCommand: 'No entendí el comando. Di ayuda para ver los comandos disponibles.',
  genericError: 'Ocurrió un error. Por favor, intenta de nuevo.',
};

const GOODBYE_MESSAGE = 'Hasta luego. Fue un placer ayudarte.';

/**
 * Processes parsed voice commands and executes appropriate actions
 * 
 * This use case implements the core business logic for handling different voice intents
 * (describe, repeat, help, stop, goodbye) and coordinating with vision and speech services.
 * Supports caching of descriptions for replay functionality.
 * 
 * @public
 */
export class ProcessCommandUseCase {
  private readonly speechSynthesizer: SpeechSynthesizer;
  private readonly visionService: VisionService;
  private readonly repository: DescriptionRepository;

  /**
   * Creates an instance of ProcessCommandUseCase
   * 
   * @param dependencies - The required services for command processing
   */
  constructor(dependencies: ProcessCommandDependencies) {
    this.speechSynthesizer = dependencies.speechSynthesizer;
    this.visionService = dependencies.visionService;
    this.repository = dependencies.repository;
  }

  /**
   * Executes a parsed voice command and returns the result
   * 
   * Routes the command to the appropriate handler based on intent type
   * and coordinates with vision and speech services to fulfill the request.
   * 
   * @param parsedCommand - The parsed command containing the detected intent
   * @returns Promise resolving to the result of command execution
   * @throws {Error} When speech synthesis or vision analysis fails
   * 
   * @example
   * ```typescript
   * const useCase = new ProcessCommandUseCase(dependencies);
   * const result = await useCase.execute(parsedCommand);
   * if (result.success) {
   *   console.log('Command executed:', result.description);
   * }
   * ```
   */
  async execute(parsedCommand: ParsedCommand): Promise<ProcessCommandResult> {
    const { intent } = parsedCommand;

    switch (intent.type) {
      case IntentType.DESCRIBE:
        return this.handleDescribe();

      case IntentType.REPEAT:
        return this.handleRepeat();

      case IntentType.HELP:
        return this.handleHelp();

      case IntentType.STOP:
        return this.handleStop();

      case IntentType.GOODBYE:
        return this.handleGoodbye();

      case IntentType.UNKNOWN:
      default:
        return this.handleUnknown();
    }
  }

  /**
   * Handles the describe intent to analyze and describe the current scene
   * 
   * Verifies vision service readiness, analyzes the scene, synthesizes speech response,
   * and persists description for future replay.
   * 
   * @returns Promise resolving to the result with description or error
   * @internal
   */
  private async handleDescribe(): Promise<ProcessCommandResult> {
    // Check if vision service is ready
    if (!this.visionService.isReady()) {
      await this.speechSynthesizer.speak(ERROR_MESSAGES.visionNotReady);
      return {
        success: false,
        error: 'Vision service not ready',
      };
    }

    try {
      // Analyze scene
      const analysis = await this.visionService.analyzeScene();
      const { description } = analysis;

      // Speak description
      await this.speechSynthesizer.speak(description);

      // Save for later repeat
      await this.repository.saveLastDescription(description);

      return {
        success: true,
        description,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.genericError;
      await this.speechSynthesizer.speak(`Hubo un error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Handles the repeat intent to replay the last scene description
   * 
   * Retrieves the previously stored description and synthesizes it as speech.
   * Returns error if no previous description exists.
   * 
   * @returns Promise resolving to the result with replayed description or error
   * @internal
   */
  private async handleRepeat(): Promise<ProcessCommandResult> {
    const lastDescription = await this.repository.getLastDescription();

    if (!lastDescription) {
      await this.speechSynthesizer.speak(ERROR_MESSAGES.noDescription);
      return {
        success: false,
        error: ERROR_MESSAGES.noDescription,
      };
    }

    await this.speechSynthesizer.speak(lastDescription);

    return {
      success: true,
      description: lastDescription,
    };
  }

  /**
   * Handles the help intent to list available commands
   * 
   * Synthesizes a help message describing available voice commands.
   * 
   * @returns Promise resolving to a successful result with help message
   * @internal
   */
  private async handleHelp(): Promise<ProcessCommandResult> {
    await this.speechSynthesizer.speak(HELP_MESSAGE);

    return {
      success: true,
      description: HELP_MESSAGE,
    };
  }

  /**
   * Handles the stop intent to interrupt current speech synthesis
   * 
   * Immediately stops any ongoing speech output without terminating the app.
   * 
   * @returns Promise resolving to a successful result
   * @internal
   */
  private async handleStop(): Promise<ProcessCommandResult> {
    await this.speechSynthesizer.stop();

    return {
      success: true,
    };
  }

  /**
   * Handles the goodbye intent to gracefully shutdown the application
   * 
   * Synthesizes a goodbye message and signals application shutdown.
   * 
   * @returns Promise resolving to a successful result with shutdown flag
   * @internal
   */
  private async handleGoodbye(): Promise<ProcessCommandResult> {
    await this.speechSynthesizer.speak(GOODBYE_MESSAGE);

    return {
      success: true,
      shouldShutdown: true,
    };
  }

  /**
   * Handles unrecognized or invalid commands
   * 
   * Synthesizes an error message prompting the user to say "help" for available commands.
   * 
   * @returns Promise resolving to a failed result with error message
   * @internal
   */
  private async handleUnknown(): Promise<ProcessCommandResult> {
    await this.speechSynthesizer.speak(ERROR_MESSAGES.unknownCommand);

    return {
      success: false,
      error: ERROR_MESSAGES.unknownCommand,
    };
  }
}
