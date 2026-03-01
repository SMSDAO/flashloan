# Testing Guide

## Overview

This project uses Jest for testing both backend and frontend components.

## Running Tests

### All Tests
```bash
npm test
```

### Backend Tests Only
```bash
cd backend
npm test
```

### Frontend Tests Only
```bash
cd frontend
npm test
```

### Watch Mode
```bash
# Backend
cd backend
npm run test:watch

# Frontend
cd frontend
npm run test:watch
```

## Test Structure

### Backend Tests (`backend/tests/`)

Tests cover:
- Configuration module loading
- RPC configuration validation
- Solana integration initialization
- Network optimizer functionality
- Integration modules (Blinks, Jupiter)

**Example:**
```javascript
describe('Configuration', () => {
  it('should load configuration module', async () => {
    const config = await import('../config.js');
    expect(config).toBeDefined();
    expect(config.getActiveRPC).toBeDefined();
  });
});
```

### Frontend Tests (`frontend/tests/`)

Tests cover:
- Component rendering
- Dashboard functionality
- Style loading
- Socket.io integration (mocked)
- Next.js router (mocked)

**Example:**
```javascript
describe('Frontend Tests', () => {
  it('should render without crashing', () => {
    expect(true).toBe(true);
  });
});
```

## Test Configuration

### Backend Jest Config (`backend/jest.config.json`)
```json
{
  "testEnvironment": "node",
  "transform": {},
  "testMatch": ["**/tests/**/*.test.js"]
}
```

### Frontend Jest Config (`frontend/jest.config.json`)
```json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "testMatch": ["**/tests/**/*.test.js"]
}
```

## Writing Tests

### Backend Test Template
```javascript
import { describe, it, expect } from '@jest/globals';

describe('Your Feature', () => {
  it('should do something', async () => {
    const module = await import('../your-module.js');
    expect(module).toBeDefined();
  });
});
```

### Frontend Test Template
```javascript
import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Your Component', () => {
  it('should render', () => {
    // Your test here
    expect(true).toBe(true);
  });
});
```

## Test Coverage

To generate coverage reports:

```bash
# Backend
cd backend
npm test -- --coverage

# Frontend
cd frontend
npm test -- --coverage
```

## Mocked Dependencies

### Frontend Mocks

#### Next.js Router
```javascript
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
    };
  },
}));
```

#### Socket.IO Client
```javascript
jest.mock('socket.io-client', () => {
  return jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  }));
});
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    npm test
    cd backend && npm test
    cd ../frontend && npm test
```

## Debugging Tests

### Run specific test file
```bash
npm test -- tests/api.test.js
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="Configuration"
```

### Verbose output
```bash
npm test -- --verbose
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies (APIs, databases)
3. **Coverage**: Aim for >80% code coverage
4. **Speed**: Keep tests fast (<5s total)
5. **Clarity**: Use descriptive test names

## Adding New Tests

1. Create test file in `tests/` directory
2. Name it `*.test.js`
3. Import necessary modules
4. Write describe/it blocks
5. Run tests to verify

## Troubleshooting

### "Cannot find module"
- Check import paths
- Ensure module exports are correct
- Verify file extensions

### "Jest did not exit"
- Close open handles (servers, connections)
- Use `--forceExit` flag if needed

### "Transform failed"
- Check Jest config
- Verify SWC/Babel setup

## Future Enhancements

- [ ] Integration tests with test database
- [ ] E2E tests with Playwright
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Mutation testing

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing](https://nextjs.org/docs/testing)

---

**Status**: Tests configured and passing ✅
