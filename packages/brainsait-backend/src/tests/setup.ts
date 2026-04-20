import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Database setup for tests
  if (process.env.SKIP_TEST_DB === 'true') {
    return;
  }

  await prisma.$connect();
});

afterAll(async () => {
  // Database cleanup after tests
  if (process.env.SKIP_TEST_DB === 'true') {
    return;
  }

  await prisma.$disconnect();
});

// Mock Redis in test environment
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    quit: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}));

// Mock external services in test environment
if (process.env.NODE_ENV === 'test') {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.CLAUDE_API_KEY = 'test-claude-key';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/brainsait_test';
}