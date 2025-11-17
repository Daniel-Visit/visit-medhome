import { GET as getToday } from '@/app/api/visits/today/route';
import { POST as checkin } from '@/app/api/visits/[id]/checkin/route';
import { NextRequest } from 'next/server';

// Mock de auth
jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn().mockResolvedValue({
    userId: 1,
    rut: '156362743',
    name: 'Test User',
  }),
}));

// Mock de Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    visit: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    visitCheckin: {
      create: jest.fn(),
    },
  },
}));

// Mock de haversine y time
jest.mock('@/lib/haversine', () => ({
  distanceInMeters: jest.fn().mockReturnValue(50),
}));

jest.mock('@/lib/time', () => ({
  getCheckinWindow: jest.fn().mockReturnValue({
    startAllowed: new Date(Date.now() - 600000), // 10 min antes
    endAllowed: new Date(Date.now() + 1200000), // 20 min después
  }),
}));

describe('API Visits Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/visits/today should return visits', async () => {
    const { prisma } = require('@/lib/db');
    const mockVisits = [
      {
        id: 1,
        patientName: 'Juan Pérez',
        address: 'Av. Providencia 1234',
        lat: -33.4265,
        lng: -70.6170,
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        status: 'PENDING',
      },
    ];
    
    prisma.visit.findMany.mockResolvedValue(mockVisits);

    const response = await getToday();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.visits).toBeDefined();
    expect(Array.isArray(data.visits)).toBe(true);
  });

  test('POST /api/visits/[id]/checkin should create checkin', async () => {
    const { prisma } = require('@/lib/db');
    
    prisma.visit.findFirst.mockResolvedValue({
      id: 1,
      professionalId: 1,
      lat: -33.4265,
      lng: -70.6170,
      scheduledStart: new Date(),
    });
    
    prisma.visitCheckin.create.mockResolvedValue({});
    prisma.visit.update.mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/visits/1/checkin', {
      method: 'POST',
      body: JSON.stringify({ lat: -33.4265, lng: -70.6170 }),
    });

    const response = await checkin(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.distanceMeters).toBeDefined();
  });
});




