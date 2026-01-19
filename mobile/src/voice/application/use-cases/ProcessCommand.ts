import { ParsedCommand } from '../../domain/services/WakeWordParser';
import { IntentType } from '../../domain/value-objects/CommandIntent';
import { SpeechSynthesizer } from '../ports/SpeechSynthesizer';
import { VisionService } from '../ports/VisionService';
import { DescriptionRepository } from '../ports/DescriptionRepository';

export interface ProcessCommandResult {
  success: boolean;
  description?: string;
  error?: string;
  shouldShutdown?: boolean;
}

interface ProcessCommandDependencies {
  speechSynthesizer: SpeechSynthesizer;
  visionService: VisionService;
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

export class ProcessCommandUseCase {
  private readonly speechSynthesizer: SpeechSynthesizer;
  private readonly visionService: VisionService;
  private readonly repository: DescriptionRepository;

  constructor(dependencies: ProcessCommandDependencies) {
    this.speechSynthesizer = dependencies.speechSynthesizer;
    this.visionService = dependencies.visionService;
    this.repository = dependencies.repository;
  }

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

  private async handleHelp(): Promise<ProcessCommandResult> {
    await this.speechSynthesizer.speak(HELP_MESSAGE);

    return {
      success: true,
      description: HELP_MESSAGE,
    };
  }

  private async handleStop(): Promise<ProcessCommandResult> {
    await this.speechSynthesizer.stop();

    return {
      success: true,
    };
  }

  private async handleGoodbye(): Promise<ProcessCommandResult> {
    await this.speechSynthesizer.speak(GOODBYE_MESSAGE);

    return {
      success: true,
      shouldShutdown: true,
    };
  }

  private async handleUnknown(): Promise<ProcessCommandResult> {
    await this.speechSynthesizer.speak(ERROR_MESSAGES.unknownCommand);

    return {
      success: false,
      error: ERROR_MESSAGES.unknownCommand,
    };
  }
}
