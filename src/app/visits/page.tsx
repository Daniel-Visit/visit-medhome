import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import VisitsAccordion from "@/components/VisitsAccordion";

export default async function VisitsPage() {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/login");
  }

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const visits = await prisma.visit.findMany({
    where: {
      professionalId: auth.userId,
      scheduledStart: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      scheduledStart: "asc",
    },
  });

  // Convertir Decimal a number para el componente
  const visitsWithNumbers = visits.map((visit) => ({
    ...visit,
    lat: typeof visit.lat === 'object' ? Number(visit.lat) : visit.lat,
    lng: typeof visit.lng === 'object' ? Number(visit.lng) : visit.lng,
  }));

  return <VisitsAccordion visits={visitsWithNumbers} userName={auth.name} />;
}

