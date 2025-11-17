import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear o actualizar usuarios
  const user1 = await prisma.user.upsert({
    where: { rut: '156362743' },
    update: {},
    create: {
      rut: '156362743',
      name: 'Daniel Hernández',
      email: 'dlhernan@uc.cl',
      isActive: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { rut: '12345678' },
    update: {},
    create: {
      rut: '12345678',
      name: 'Dr. Juan Medina',
      email: 'dr.medina@example.com',
      isActive: true,
    },
  });

  // Crear visitas de prueba para hoy a las 12:00
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Crear fecha para las 12:00 de hoy
  const noon = new Date(today);
  noon.setHours(12, 0, 0, 0);

  await prisma.visit.upsert({
    where: { id: 1 },
    update: {
      address: 'Av. Alejandro Fleming 9840, Las Condes, Región Metropolitana',
      lat: -33.424034,
      lng: -70.5260594,
      scheduledStart: new Date(noon.getTime()),
      scheduledEnd: new Date(noon.getTime() + 45 * 60 * 1000), // 45 minutos después
      status: 'PENDING',
    },
    create: {
      professionalId: user1.id,
      patientName: 'Juan Pérez',
      address: 'Av. Alejandro Fleming 9840, Las Condes, Región Metropolitana',
      lat: -33.424034,
      lng: -70.5260594,
      scheduledStart: new Date(noon.getTime()),
      scheduledEnd: new Date(noon.getTime() + 45 * 60 * 1000), // 45 minutos después
      status: 'PENDING',
    },
  });

  await prisma.visit.upsert({
    where: { id: 2 },
    update: {
      scheduledStart: new Date(noon.getTime() + 30 * 60 * 1000), // 12:30
      scheduledEnd: new Date(noon.getTime() + 75 * 60 * 1000), // 13:15
      status: 'PENDING',
    },
    create: {
      professionalId: user1.id,
      patientName: 'María López',
      address: 'Los Leones 765, Santiago',
      lat: -33.4280,
      lng: -70.6180,
      scheduledStart: new Date(noon.getTime() + 30 * 60 * 1000), // 12:30
      scheduledEnd: new Date(noon.getTime() + 75 * 60 * 1000), // 13:15
      status: 'PENDING',
    },
  });

  await prisma.visit.upsert({
    where: { id: 3 },
    update: {
      scheduledStart: new Date(noon.getTime() + 60 * 60 * 1000), // 13:00
      scheduledEnd: new Date(noon.getTime() + 105 * 60 * 1000), // 13:45
      status: 'PENDING',
    },
    create: {
      professionalId: user1.id,
      patientName: 'Carlos Núñez',
      address: 'Av. Irarrázaval 2300, Ñuñoa',
      lat: -33.4295,
      lng: -70.6195,
      scheduledStart: new Date(noon.getTime() + 60 * 60 * 1000), // 13:00
      scheduledEnd: new Date(noon.getTime() + 105 * 60 * 1000), // 13:45
      status: 'PENDING',
    },
  });

  console.log('✅ Seed ejecutado exitosamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

