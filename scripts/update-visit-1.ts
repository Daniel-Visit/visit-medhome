import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.visit.update({
    where: { id: 1 },
    data: {
      address: 'Av. Alejandro Fleming 9840, Las Condes, Región Metropolitana',
      lat: -33.424034,
      lng: -70.5260594,
    },
  });
  console.log('✅ Visita 1 actualizada');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
