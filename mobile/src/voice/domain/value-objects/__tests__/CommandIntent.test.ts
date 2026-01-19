import { CommandIntent, IntentType } from '../CommandIntent';

describe('CommandIntent', () => {
  describe('fromText', () => {
    describe('DESCRIBE intent', () => {
      it('should detect "describe" command', () => {
        const intent = CommandIntent.fromText('describe what you see');

        expect(intent.type).toBe(IntentType.DESCRIBE);
      });

      it('should detect "qué hay" command', () => {
        const intent = CommandIntent.fromText('qué hay frente a mí');

        expect(intent.type).toBe(IntentType.DESCRIBE);
      });

      it('should detect "qué ves" command', () => {
        const intent = CommandIntent.fromText('qué ves');

        expect(intent.type).toBe(IntentType.DESCRIBE);
      });

      it('should detect "que tienes" command (without accent)', () => {
        const intent = CommandIntent.fromText('que tienes enfrente');

        expect(intent.type).toBe(IntentType.DESCRIBE);
      });

      it('should be case-insensitive', () => {
        const intent = CommandIntent.fromText('DESCRIBE THIS');

        expect(intent.type).toBe(IntentType.DESCRIBE);
      });
    });

    describe('REPEAT intent', () => {
      it('should detect "repite" command', () => {
        const intent = CommandIntent.fromText('repite');

        expect(intent.type).toBe(IntentType.REPEAT);
      });

      it('should detect "repetir" command', () => {
        const intent = CommandIntent.fromText('repetir por favor');

        expect(intent.type).toBe(IntentType.REPEAT);
      });

      it('should detect "repeat" command in English', () => {
        const intent = CommandIntent.fromText('repeat that');

        expect(intent.type).toBe(IntentType.REPEAT);
      });

      it('should detect "otra vez" command', () => {
        const intent = CommandIntent.fromText('dilo otra vez');

        expect(intent.type).toBe(IntentType.REPEAT);
      });
    });

    describe('HELP intent', () => {
      it('should detect "ayuda" command', () => {
        const intent = CommandIntent.fromText('ayuda');

        expect(intent.type).toBe(IntentType.HELP);
      });

      it('should detect "help" command', () => {
        const intent = CommandIntent.fromText('help me');

        expect(intent.type).toBe(IntentType.HELP);
      });

      it('should detect "qué puedes hacer" command', () => {
        const intent = CommandIntent.fromText('qué puedes hacer');

        expect(intent.type).toBe(IntentType.HELP);
      });

      it('should detect "comandos" command', () => {
        const intent = CommandIntent.fromText('lista de comandos');

        expect(intent.type).toBe(IntentType.HELP);
      });
    });

    describe('STOP intent', () => {
      it('should detect "detente" command', () => {
        const intent = CommandIntent.fromText('detente');

        expect(intent.type).toBe(IntentType.STOP);
      });

      it('should detect "para" command', () => {
        const intent = CommandIntent.fromText('para por favor');

        expect(intent.type).toBe(IntentType.STOP);
      });

      it('should detect "stop" command', () => {
        const intent = CommandIntent.fromText('stop');

        expect(intent.type).toBe(IntentType.STOP);
      });

      it('should detect "silencio" command', () => {
        const intent = CommandIntent.fromText('silencio');

        expect(intent.type).toBe(IntentType.STOP);
      });

      it('should detect "cállate" command', () => {
        const intent = CommandIntent.fromText('cállate');

        expect(intent.type).toBe(IntentType.STOP);
      });
    });

    describe('GOODBYE intent', () => {
      it('should detect "adiós" command', () => {
        const intent = CommandIntent.fromText('adiós');

        expect(intent.type).toBe(IntentType.GOODBYE);
      });

      it('should detect "adios" command (without accent)', () => {
        const intent = CommandIntent.fromText('adios iris');

        expect(intent.type).toBe(IntentType.GOODBYE);
      });

      it('should detect "chao" command', () => {
        const intent = CommandIntent.fromText('chao');

        expect(intent.type).toBe(IntentType.GOODBYE);
      });

      it('should detect "hasta luego" command', () => {
        const intent = CommandIntent.fromText('hasta luego');

        expect(intent.type).toBe(IntentType.GOODBYE);
      });

      it('should detect "goodbye" command', () => {
        const intent = CommandIntent.fromText('goodbye');

        expect(intent.type).toBe(IntentType.GOODBYE);
      });
    });

    describe('UNKNOWN intent', () => {
      it('should return UNKNOWN for unrecognized text', () => {
        const intent = CommandIntent.fromText('random gibberish');

        expect(intent.type).toBe(IntentType.UNKNOWN);
      });

      it('should return UNKNOWN for empty text', () => {
        const intent = CommandIntent.fromText('');

        expect(intent.type).toBe(IntentType.UNKNOWN);
      });
    });
  });

  describe('isActionable', () => {
    it('should return true for DESCRIBE intent', () => {
      const intent = CommandIntent.fromText('describe');

      expect(intent.isActionable()).toBe(true);
    });

    it('should return true for REPEAT intent', () => {
      const intent = CommandIntent.fromText('repite');

      expect(intent.isActionable()).toBe(true);
    });

    it('should return true for HELP intent', () => {
      const intent = CommandIntent.fromText('ayuda');

      expect(intent.isActionable()).toBe(true);
    });

    it('should return true for STOP intent', () => {
      const intent = CommandIntent.fromText('stop');

      expect(intent.isActionable()).toBe(true);
    });

    it('should return true for GOODBYE intent', () => {
      const intent = CommandIntent.fromText('adios');

      expect(intent.isActionable()).toBe(true);
    });

    it('should return false for UNKNOWN intent', () => {
      const intent = CommandIntent.fromText('blah blah');

      expect(intent.isActionable()).toBe(false);
    });
  });

  describe('confidence', () => {
    it('should have high confidence for exact matches', () => {
      const intent = CommandIntent.fromText('describe');

      expect(intent.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should have lower confidence for partial matches', () => {
      const intent = CommandIntent.fromText('qué hay por ahí');

      expect(intent.confidence).toBeLessThan(1.0);
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should have zero confidence for UNKNOWN', () => {
      const intent = CommandIntent.fromText('xyz');

      expect(intent.confidence).toBe(0);
    });
  });
});
