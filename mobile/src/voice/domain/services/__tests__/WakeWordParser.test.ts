import { WakeWordParser, ParsedCommand } from '../WakeWordParser';
import { IntentType } from '../../value-objects/CommandIntent';

describe('WakeWordParser', () => {
  let parser: WakeWordParser;

  beforeEach(() => {
    parser = new WakeWordParser();
  });

  describe('parse', () => {
    describe('with valid wake word and command', () => {
      it('should parse "iris describe" correctly', () => {
        const result = parser.parse('iris describe', 0.9);

        expect(result).not.toBeNull();
        expect(result!.intent.type).toBe(IntentType.DESCRIBE);
        expect(result!.command.text).toBe('iris describe');
        expect(result!.command.confidence).toBe(0.9);
      });

      it('should parse "Iris, qué hay frente a mí" correctly', () => {
        const result = parser.parse('Iris, qué hay frente a mí', 0.85);

        expect(result).not.toBeNull();
        expect(result!.intent.type).toBe(IntentType.DESCRIBE);
      });

      it('should parse "iris repite" correctly', () => {
        const result = parser.parse('iris repite', 0.9);

        expect(result).not.toBeNull();
        expect(result!.intent.type).toBe(IntentType.REPEAT);
      });

      it('should parse "iris ayuda" correctly', () => {
        const result = parser.parse('iris ayuda', 0.9);

        expect(result).not.toBeNull();
        expect(result!.intent.type).toBe(IntentType.HELP);
      });

      it('should parse "iris adiós" correctly', () => {
        const result = parser.parse('iris adiós', 0.9);

        expect(result).not.toBeNull();
        expect(result!.intent.type).toBe(IntentType.GOODBYE);
      });

      it('should parse "iris stop" correctly', () => {
        const result = parser.parse('iris stop', 0.9);

        expect(result).not.toBeNull();
        expect(result!.intent.type).toBe(IntentType.STOP);
      });
    });

    describe('without wake word', () => {
      it('should return null when wake word is missing', () => {
        const result = parser.parse('describe what you see', 0.9);

        expect(result).toBeNull();
      });

      it('should return null for empty text', () => {
        const result = parser.parse('', 0.9);

        expect(result).toBeNull();
      });
    });

    describe('with low confidence', () => {
      it('should return null when confidence is below threshold', () => {
        const result = parser.parse('iris describe', 0.3);

        expect(result).toBeNull();
      });

      it('should return result when confidence is at threshold', () => {
        const result = parser.parse('iris describe', 0.7);

        expect(result).not.toBeNull();
      });
    });

    describe('with wake word but unknown command', () => {
      it('should default to DESCRIBE intent', () => {
        const result = parser.parse('iris blah blah blah', 0.9);

        expect(result).not.toBeNull();
        expect(result!.intent.type).toBe(IntentType.DESCRIBE);
      });

      it('should have lower confidence for default intent', () => {
        const result = parser.parse('iris xyz', 0.9);

        expect(result).not.toBeNull();
        expect(result!.intent.confidence).toBeLessThan(0.9);
      });
    });

    describe('with custom wake word', () => {
      it('should support custom wake word via constructor', () => {
        const customParser = new WakeWordParser('jarvis');
        const result = customParser.parse('jarvis describe', 0.9);

        expect(result).not.toBeNull();
        expect(result!.intent.type).toBe(IntentType.DESCRIBE);
      });

      it('should not detect default wake word when using custom', () => {
        const customParser = new WakeWordParser('jarvis');
        const result = customParser.parse('iris describe', 0.9);

        expect(result).toBeNull();
      });
    });
  });

  describe('extractCommandText', () => {
    it('should extract text after wake word', () => {
      const result = parser.parse('iris describe what you see', 0.9);

      expect(result!.commandText).toBe('describe what you see');
    });

    it('should handle comma after wake word', () => {
      const result = parser.parse('iris, describe this', 0.9);

      expect(result!.commandText).toBe('describe this');
    });

    it('should handle multiple spaces', () => {
      const result = parser.parse('iris    describe', 0.9);

      expect(result!.commandText).toBe('describe');
    });
  });

  describe('timestamp', () => {
    it('should include timestamp in result', () => {
      const before = Date.now();
      const result = parser.parse('iris describe', 0.9);
      const after = Date.now();

      expect(result!.command.timestamp).toBeGreaterThanOrEqual(before);
      expect(result!.command.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
