# Contributing to Signal Recorder v2

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain professional communication

## Getting Started

### Prerequisites
- Node.js 18+
- Git
- Basic understanding of TypeScript, React, Next.js
- Familiarity with Chrome extensions

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/yourusername/signal-recorder-v2.git
cd signal-recorder-v2
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

5. Run development server:
```bash
npm run dev
```

6. Build extension:
```bash
npm run build:extension
```

## Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/changes

### Commit Messages
Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(workflow): add loop step type
fix(extension): resolve selector generation bug
docs(readme): update installation instructions
```

### Pull Request Process

1. Create a feature branch:
```bash
git checkout -b feature/your-feature
```

2. Make your changes
3. Write or update tests
4. Ensure code passes linting:
```bash
npm run lint
```

5. Commit changes:
```bash
git add .
git commit -m "feat(scope): description"
```

6. Push to your fork:
```bash
git push origin feature/your-feature
```

7. Create pull request on GitHub
8. Wait for review

### Code Review Guidelines

Reviewers will check for:
- Code quality and style
- Test coverage
- Documentation updates
- Breaking changes
- Performance impact
- Security considerations

## Project Structure

```
signal-recorder-v2/
├── app/              # Next.js pages
├── components/       # React components
├── extension/        # Chrome extension
├── lib/             # Utilities and core logic
├── supabase/        # Database migrations
└── public/          # Static assets
```

## Coding Standards

### TypeScript
- Use strict mode
- Define explicit types
- Avoid `any` when possible
- Use interfaces for object shapes

### React
- Use functional components
- Use hooks appropriately
- Keep components small and focused
- Extract reusable logic to custom hooks

### Styling
- Use TailwindCSS utility classes
- Follow mobile-first approach
- Maintain consistent spacing
- Use design system colors

### Naming Conventions
- Components: PascalCase (`WorkflowEditor`)
- Functions: camelCase (`generateSelector`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- Files: kebab-case (`workflow-editor.tsx`)

## Testing

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Writing Tests
- Unit tests for utilities and pure functions
- Integration tests for API routes
- E2E tests for critical user flows

Example:
```typescript
import { generateSelector } from '@/lib/utils/selector-generator';

describe('generateSelector', () => {
  it('should generate ID selector for elements with ID', () => {
    const element = document.createElement('div');
    element.id = 'unique-id';
    
    const selector = generateSelector(element);
    
    expect(selector.value).toBe('#unique-id');
  });
});
```

## Documentation

### Code Documentation
- Add JSDoc comments for functions
- Explain complex logic
- Document edge cases
- Include usage examples

Example:
```typescript
/**
 * Generates a robust CSS selector for an element
 * @param element - The DOM element to generate a selector for
 * @returns Selector strategy with fallbacks
 * @example
 * const selector = generateSelector(buttonElement);
 * // Returns: { type: 'css', value: 'button.submit', fallbacks: [...] }
 */
export function generateSelector(element: Element): SelectorStrategy {
  // Implementation
}
```

### README Updates
Update README.md when:
- Adding new features
- Changing setup process
- Modifying API
- Adding dependencies

## Areas for Contribution

### High Priority
- [ ] Comprehensive test coverage
- [ ] Error handling improvements
- [ ] Performance optimizations
- [ ] Accessibility enhancements
- [ ] Mobile responsiveness

### Features
- [ ] Visual workflow builder
- [ ] Workflow templates marketplace
- [ ] Multi-tab coordination
- [ ] Advanced selector strategies
- [ ] Workflow versioning
- [ ] Collaboration features
- [ ] Analytics dashboard

### Documentation
- [ ] Video tutorials
- [ ] Interactive examples
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Troubleshooting guide

### Extension
- [ ] Better selector generation
- [ ] Screenshot capture
- [ ] Video recording
- [ ] Element picker
- [ ] Keyboard shortcuts

### Web App
- [ ] Workflow import/export
- [ ] Workflow scheduling
- [ ] Team management
- [ ] Usage analytics
- [ ] Cost tracking

### Agent
- [ ] More tools
- [ ] Better error recovery
- [ ] Multi-step planning
- [ ] Learning from failures
- [ ] Custom tool creation

## Questions?

- Open an issue for bugs
- Start a discussion for feature ideas
- Join our community chat (if available)
- Email maintainers (if provided)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in the project

Thank you for contributing! 🎉

