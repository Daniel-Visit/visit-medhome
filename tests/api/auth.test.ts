import { POST as requestCode } from '@/app/api/auth/request-code/route';
import { POST as verifyCode } from '@/app/api/auth/verify-code/route';
import { GET as getMe } from '@/app/api/auth/me/route';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

// Mock de cookies de Next.js
const mockCookies = new Map<string, string>();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: (name: string) => {
      const value = mockCookies.get(name);
      return value ? { name, value } : undefined;
    },
    set: (name: string, value: string, options?: any) => {
      mockCookies.set(name, value);
    },
    delete: (name: string) => {
      mockCookies.delete(name);
    },
  })),
}));

// Mock de Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    loginCode: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock de Gmail
jest.mock('@/lib/gmail', () => ({
  sendLoginCodeEmail: jest.fn().mockResolvedValue(true),
}));

describe('API Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.clear();
  });

  test('POST /api/auth/request-code should return success message', async () => {
    const { prisma } = require('@/lib/db');
    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      rut: '156362743',
      name: 'Test User',
      email: 'test@example.com',
    });

    const request = new NextRequest('http://localhost/api/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ rut: '15636274-3' }),
    });

    const response = await requestCode(request);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.message).toContain('código');
  });

  test('POST /api/auth/verify-code should return error for invalid code', async () => {
    const { prisma } = require('@/lib/db');
    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      rut: '156362743',
      name: 'Test User',
      email: 'test@example.com',
    });
    prisma.loginCode.findFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ rut: '15636274-3', code: '123456' }),
    });

    const response = await verifyCode(request);
    const data = await response.json();

    expect(data.ok).toBe(false);
    expect(data.message).toContain('inválido');
  });

  test('POST /api/auth/verify-code should return success with valid code', async () => {
    const { prisma } = require('@/lib/db');
    const codeHash = await bcrypt.hash('123456', 10);
    
    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      rut: '156362743',
      name: 'Test User',
      email: 'test@example.com',
    });
    
    prisma.loginCode.findFirst.mockResolvedValue({
      id: 1,
      codeHash,
      userId: 1,
    });
    
    prisma.loginCode.update.mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ rut: '15636274-3', code: '123456' }),
    });

    const response = await verifyCode(request);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.user).toBeDefined();
  });
});

