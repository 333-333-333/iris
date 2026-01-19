# New Feature Checklist

Use this checklist when adding new features to Iris.

## General Feature Addition

- [ ] Determine which module (voice, vision, or shared)
- [ ] Identify affected layers (domain, application, infrastructure, presentation)
- [ ] Create feature branch: `feature/<feature-name>`
- [ ] Add tests before implementation (TDD)
- [ ] Update AGENTS.md if adding new patterns

## Domain Layer

- [ ] Create entities in `domain/entities/`
  - [ ] Add validation methods
  - [ ] Add helper methods
  - [ ] Write unit tests

- [ ] Create value objects in `domain/value-objects/`
  - [ ] Make immutable
  - [ ] Add validation
  - [ ] Write unit tests

- [ ] Create domain services in `domain/services/`
  - [ ] Keep pure (no external dependencies)
  - [ ] Add business logic
  - [ ] Write unit tests

## Application Layer

- [ ] Create use case in `application/use-cases/`
  - [ ] Name: `<Verb><Noun>UseCase.ts`
  - [ ] Add `execute()` method
  - [ ] Handle errors gracefully
  - [ ] Write tests with mocked ports

- [ ] Create ports (interfaces) in `application/ports/`
  - [ ] Define clear interface
  - [ ] Document expected behavior
  - [ ] Add TypeScript types

## Infrastructure Layer

- [ ] Create adapter in `infrastructure/adapters/<technology>/`
  - [ ] Implement port interface
  - [ ] Handle external dependencies
  - [ ] Add error handling
  - [ ] Add logging

- [ ] Export adapter from `infrastructure/adapters/index.ts`

- [ ] Add configuration if needed in `shared/infrastructure/config/`

## Presentation Layer

- [ ] Create hook in `presentation/hooks/`
  - [ ] Name: `use<FeatureName>.ts`
  - [ ] Use use case internally
  - [ ] Return state + actions
  - [ ] Handle loading/error states
  - [ ] Write tests

- [ ] Create component if needed in `shared/presentation/components/`
  - [ ] Determine atomic level (atom/molecule/organism/page)
  - [ ] Follow naming conventions
  - [ ] Add accessibility props
  - [ ] Write tests

- [ ] Update XState machine if needed in `machines/`
  - [ ] Add new states
  - [ ] Add guards/actions
  - [ ] Update transitions
  - [ ] Write machine tests

## Voice Feature Specific

- [ ] Add command pattern to `CommandIntent.ts`
  - [ ] Add English pattern
  - [ ] Add Spanish pattern
  - [ ] Add to intent enum

- [ ] Handle intent in `ProcessCommandUseCase`
  - [ ] Add case to switch statement
  - [ ] Call appropriate service
  - [ ] Return result

- [ ] Update `voiceMachine.ts` if new states needed

## Vision Feature Specific

- [ ] Add labels to `LabelTranslations.ts` if needed
  - [ ] Add English label
  - [ ] Add Spanish translation
  - [ ] Add plural form

- [ ] Update `SceneDescriptionGenerator.ts` if new description logic

- [ ] Update TFLite model if needed in `TFLiteVisionAdapter`

## Cross-Module Features

- [ ] Use bridge pattern for module communication
- [ ] Define port in consuming module
- [ ] Implement bridge in infrastructure
- [ ] Keep modules independent

## Testing Checklist

- [ ] Domain layer tests (unit)
  - [ ] Entities
  - [ ] Value objects
  - [ ] Services

- [ ] Application layer tests
  - [ ] Use cases with mocked ports
  - [ ] Edge cases
  - [ ] Error handling

- [ ] Presentation layer tests
  - [ ] Components with Testing Library
  - [ ] Hooks with renderHook
  - [ ] XState machines

- [ ] Integration tests
  - [ ] Hook + use case
  - [ ] Component + hook

- [ ] Run all tests: `npm test`
- [ ] Check coverage: `npm run test:coverage`

## Documentation

- [ ] Add JSDoc comments to public APIs
- [ ] Update README if user-facing feature
- [ ] Add examples to SKILL.md if new pattern
- [ ] Document breaking changes

## Code Quality

- [ ] Follow naming conventions
- [ ] No circular dependencies
- [ ] Follow dependency rule (outer → inner)
- [ ] Use TypeScript strict mode
- [ ] Add proper error handling
- [ ] Add logging for debugging

## Accessibility

- [ ] Add VoiceOver labels (iOS)
- [ ] Add TalkBack labels (Android)
- [ ] Test with screen reader
- [ ] Add haptic feedback if needed
- [ ] Ensure keyboard navigation

## Performance

- [ ] Memoize expensive computations
- [ ] Use React.memo for pure components
- [ ] Lazy load heavy dependencies
- [ ] Test on low-end devices
- [ ] Profile with React DevTools

## Before Merge

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Lint passes: `npm run lint`
- [ ] Format code: `npm run format`
- [ ] Update version in package.json
- [ ] Create pull request
- [ ] Get code review
- [ ] Squash commits if needed

## Example: Adding "Count Objects" Command

**Goal**: Add voice command "count" to count detected objects.

### Domain Layer
- [x] Update `CommandIntent.ts` - add COUNT intent
  ```typescript
  COUNT = 'COUNT',  // "count", "how many", "cuántos"
  ```

### Application Layer
- [x] Update `ProcessCommandUseCase.ts` - handle COUNT
  ```typescript
  case CommandIntent.COUNT:
    const scene = await this.visionService.analyzeScene();
    const count = scene.objects.length;
    await this.speechSynthesizer.speak(`Hay ${count} objetos`);
  ```

### Presentation Layer
- [x] No changes needed - hook handles new intent automatically

### Testing
- [x] Add test to `CommandIntent.test.ts`
- [x] Add test to `ProcessCommand.test.ts`

Total time: ~30 minutes ✅
