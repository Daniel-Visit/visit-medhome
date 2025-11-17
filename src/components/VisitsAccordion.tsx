"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, ArrowBigRightDash, RefreshCw, CalendarX, Calendar } from "lucide-react";
import { distanceInMeters } from "@/lib/haversine";

type Visit = {
  id: number;
  patientName: string;
  address: string;
  lat: number;
  lng: number;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
};

type Props = {
  visits?: Visit[];
  userName?: string;
  initialDate?: string; // ISO date string (YYYY-MM-DD)
};

export default function VisitsAccordion({ visits: initialVisits, userName, initialDate }: Props) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDate) {
      return new Date(initialDate);
    }
    return new Date();
  });
  const [visits, setVisits] = useState<Visit[]>(initialVisits || []);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState<Set<number>>(new Set());
  const [checkinStatus, setCheckinStatus] = useState<Record<
    number,
    {
      ok?: boolean;
      loading?: boolean;
      message?: string;
      isValidTime?: boolean;
      isValidRadius?: boolean;
      distanceMeters?: number;
      userLat?: number;
      userLng?: number;
    }
  >>({});
  
  const hasLoadedInitial = useRef(false);

  // Función para manejar errores de autenticación
  const handleAuthError = () => {
    router.push("/login");
  };

  // Cargar visitas cuando cambia la fecha
  useEffect(() => {
    const loadVisits = async () => {
      setLoadingVisits(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch(`/api/visits/by-date?date=${dateStr}`, {
          credentials: "include",
        });

        if (response.status === 401) {
          handleAuthError();
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.ok) {
            setVisits(data.visits || []);
          }
        }
      } catch (error) {
        console.error("Error al cargar visitas:", error);
      } finally {
        setLoadingVisits(false);
      }
    };

    // Si hay visitas iniciales y es el primer render, no cargar
    // De lo contrario, siempre cargar cuando cambia la fecha
    if (!hasLoadedInitial.current && initialVisits && initialVisits.length > 0) {
      hasLoadedInitial.current = true;
      return;
    }

    loadVisits();
    hasLoadedInitial.current = true;
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setOpenItems(new Set()); // Cerrar todos los acordeones al cambiar de día
    setUserLocation(null); // Limpiar ubicación al cambiar de día
    setLocationError(null);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setOpenItems(new Set());
    setUserLocation(null);
    setLocationError(null);
  };

  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const requestUserLocation = async (visitId: number) => {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización.");
      return;
    }

    setRequestingLocation(prev => new Set(prev).add(visitId));
    setLocationError(null);

    // En iOS Safari, la solicitud debe hacerse directamente sin verificar permisos primero
    // La verificación previa puede bloquear el diálogo nativo
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
        setRequestingLocation(prev => {
          const newSet = new Set(prev);
          newSet.delete(visitId);
          return newSet;
        });
      },
      (error) => {
        let errorMessage = "No se pudo obtener tu ubicación.";
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            if (isIOS) {
              errorMessage = "Permiso de geolocalización denegado.\n\nPara habilitarlo en iOS:\n1. Toca el botón 'aA' en la barra de direcciones de Safari\n2. Selecciona 'Configuración del sitio web'\n3. Toca 'Ubicación' y selecciona 'Permitir'\n\nO ve a:\nConfiguración > Safari > Configuración avanzada > Datos del sitio web > Ubicación";
            } else if (isMobile) {
              errorMessage = "Permiso de geolocalización denegado.\n\nPara habilitarlo:\n1. Toca el ícono de ubicación en la barra de direcciones\n2. O ve a Configuración > Privacidad > Ubicación y habilita el acceso para este sitio";
            } else {
              errorMessage = "Permiso de geolocalización denegado. Por favor, haz clic en el ícono de candado en la barra de direcciones y permite el acceso a la ubicación.";
            }
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Información de ubicación no disponible. Verifica que el GPS esté activado.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado al obtener la ubicación. Por favor, intenta nuevamente.";
            break;
        }
        setLocationError(errorMessage);
        setRequestingLocation(prev => {
          const newSet = new Set(prev);
          newSet.delete(visitId);
          return newSet;
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Aumentar timeout para móviles
        maximumAge: 0,
      }
    );
  };

  const toggleItem = (visitId: number) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(visitId)) {
      newOpen.delete(visitId);
    } else {
      newOpen.clear();
      newOpen.add(visitId);
    }
    setOpenItems(newOpen);
  };

  const handleCheckin = async (visit: Visit) => {
    if (!userLocation) {
      setCheckinStatus({
        [visit.id]: {
          ok: false,
          message: "Por favor, comparte tu ubicación primero.",
        },
      });
      return;
    }

    setCheckinStatus({
      [visit.id]: { loading: true },
    });

    try {
      const response = await fetch(`/api/visits/${visit.id}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ lat: userLocation.lat, lng: userLocation.lng }),
      });

      if (response.status === 401) {
        handleAuthError();
        return;
      }

      const data = await response.json();
      setCheckinStatus({
        [visit.id]: {
          ...data,
          userLat: userLocation.lat,
          userLng: userLocation.lng,
        },
      });
    } catch (error) {
      setCheckinStatus({
        [visit.id]: {
          ok: false,
          message: "Error de conexión al registrar la asistencia.",
        },
      });
    }
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Pendiente",
      IN_PROGRESS: "En progreso",
      DONE: "Completada",
    };
    return statusMap[status] || status;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Formatear distancia en metros o kilómetros
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Calcular posiciones relativas en el mapa basadas en coordenadas reales
  const calculateMapPosition = (
    patientLat: number,
    patientLng: number,
    userLat?: number,
    userLng?: number,
    distanceMeters?: number
  ) => {
    if (!userLat || !userLng) {
      // Si no hay coordenadas del usuario, centrar en el paciente
      return {
        patientTop: "50%",
        patientLeft: "50%",
        userTop: "50%",
        userLeft: "50%",
        userTopPercent: 50,
        userLeftPercent: 50,
        centerLat: patientLat,
        centerLng: patientLng,
        zoom: 0.0015, // Zoom aproximado para 150m de radio
      };
    }

    // Calcular el centro entre ambos puntos
    const centerLat = (patientLat + userLat) / 2;
    const centerLng = (patientLng + userLng) / 2;

    // Calcular la diferencia máxima para determinar el zoom
    const latDiff = Math.abs(patientLat - userLat);
    const lngDiff = Math.abs(patientLng - userLng);
    const maxDiff = Math.max(latDiff, lngDiff);

    // Si tenemos la distancia en metros, usarla para calcular un zoom más preciso
    // Aproximadamente 0.001 grados = 111 metros
    // Para que ambos puntos sean claramente visibles, necesitamos un zoom que muestre al menos 3-4x la distancia
    let zoom: number;
    if (distanceMeters !== undefined) {
      // Convertir metros a grados: 1 grado ≈ 111,000 metros
      // Queremos mostrar aproximadamente 3-4 veces la distancia para que ambos puntos sean claramente visibles
      // Si la distancia es muy pequeña (< 200m), usar un zoom basado en la diferencia real de coordenadas
      if (distanceMeters < 200) {
        // Para distancias pequeñas, usar la diferencia real de coordenadas multiplicada por un factor
        // Esto asegura que ambos puntos sean visibles sin importar qué tan cerca estén
        zoom = Math.max(maxDiff * 6, 0.002); // Multiplicar por 6 para asegurar visibilidad
      } else {
        const zoomInDegrees = (distanceMeters * 3.5) / 111000;
        zoom = Math.max(zoomInDegrees, 0.002); // Mínimo zoom para ver bien los puntos
      }
    } else {
      // Fallback: usar la diferencia de coordenadas
      zoom = Math.max(maxDiff * 5, 0.002); // Multiplicar por 5 para asegurar que ambos puntos sean visibles
    }

    // Calcular posiciones relativas (0-100%)
    // Asumiendo que el mapa muestra un área de aproximadamente zoom * 2
    const mapLatRange = zoom * 2;
    const mapLngRange = zoom * 2;

    // Calcular diferencias en grados
    const patientLatDiff = patientLat - centerLat;
    const patientLngDiff = patientLng - centerLng;
    const userLatDiff = userLat - centerLat;
    const userLngDiff = userLng - centerLng;

    // Convertir a porcentajes relativos al centro (50%)
    const patientTopPercent = 50 + (patientLatDiff / mapLatRange) * 100;
    const patientLeftPercent = 50 + (patientLngDiff / mapLngRange) * 100;
    const userTopPercent = 50 + (userLatDiff / mapLatRange) * 100;
    const userLeftPercent = 50 + (userLngDiff / mapLngRange) * 100;

    // Asegurar que los valores estén dentro del rango visible (5% a 95%)
    // Esto evita que los pins aparezcan fuera del mapa
    return {
      patientTop: `${Math.max(5, Math.min(95, patientTopPercent))}%`,
      patientLeft: `${Math.max(5, Math.min(95, patientLeftPercent))}%`,
      userTop: `${Math.max(5, Math.min(95, userTopPercent))}%`,
      userLeft: `${Math.max(5, Math.min(95, userLeftPercent))}%`,
      userTopPercent, // Sin clamp para detectar si está fuera
      userLeftPercent, // Sin clamp para detectar si está fuera
      centerLat,
      centerLng,
      zoom,
    };
  };

  // Detectar si el punto del usuario está fuera del área visible y calcular posición/ángulo de la flecha
  const calculateArrowPosition = (
    userTopPercent: number,
    userLeftPercent: number,
    patientLat: number,
    patientLng: number,
    userLat: number,
    userLng: number
  ) => {
    const isOutOfBounds = userTopPercent < 0 || userTopPercent > 100 || userLeftPercent < 0 || userLeftPercent > 100;
    
    if (!isOutOfBounds) {
      return null;
    }

    // Calcular posición en el borde del mapa
    let edgeTop = Math.max(10, Math.min(90, userTopPercent));
    let edgeLeft = Math.max(10, Math.min(90, userLeftPercent));
    let rotation = 0;

    // Determinar en qué borde está y ajustar posición y rotación
    if (userTopPercent < 0) {
      // Arriba
      edgeTop = 10;
      edgeLeft = Math.max(10, Math.min(90, userLeftPercent));
      // Calcular ángulo hacia abajo
      const latDiff = userLat - patientLat;
      const lngDiff = userLng - patientLng;
      rotation = (Math.atan2(latDiff, lngDiff) * 180) / Math.PI + 90;
    } else if (userTopPercent > 100) {
      // Abajo
      edgeTop = 90;
      edgeLeft = Math.max(10, Math.min(90, userLeftPercent));
      // Calcular ángulo hacia arriba
      const latDiff = patientLat - userLat;
      const lngDiff = patientLng - userLng;
      rotation = (Math.atan2(latDiff, lngDiff) * 180) / Math.PI + 90;
    } else if (userLeftPercent < 0) {
      // Izquierda
      edgeTop = Math.max(10, Math.min(90, userTopPercent));
      edgeLeft = 10;
      // Calcular ángulo hacia la derecha
      const latDiff = userLat - patientLat;
      const lngDiff = userLng - patientLng;
      rotation = (Math.atan2(lngDiff, latDiff) * 180) / Math.PI;
    } else if (userLeftPercent > 100) {
      // Derecha
      edgeTop = Math.max(10, Math.min(90, userTopPercent));
      edgeLeft = 90;
      // Calcular ángulo hacia la izquierda
      const latDiff = patientLat - userLat;
      const lngDiff = patientLng - userLng;
      rotation = (Math.atan2(lngDiff, latDiff) * 180) / Math.PI;
    }

    return {
      top: `${edgeTop}%`,
      left: `${edgeLeft}%`,
      rotation: rotation,
    };
  };

  const displayDate = formatDate(selectedDate);
  const today = new Date();
  const isTodayDate = isToday();

  return (
    <div className="w-full max-w-[430px] min-h-screen p-[16px_14px_20px] flex flex-col gap-[14px] mx-auto bg-[#f4f4f5]">
      {/* Header */}
      <header className="flex flex-col gap-3 mb-1">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="text-lg font-semibold text-[#111827]">
              Visitas domiciliarias
            </div>
            {userName && (
              <div className="text-[11px] px-[10px] py-1 rounded-full border border-[#e5e7eb] bg-white inline-flex items-center gap-[6px] text-[#374151] w-fit">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
                <span>{userName}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between gap-2 bg-white rounded-xl border border-[#e5e7eb] p-3 shadow-sm">
          <button
            onClick={() => changeDate(-1)}
            disabled={loadingVisits}
            className="p-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Día anterior"
          >
            <ChevronLeft className="w-5 h-5 text-[#6b7280]" />
          </button>
          
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6b7280]" />
              <div className="text-sm font-semibold text-[#111827]">
                {displayDate}
              </div>
            </div>
            <div className="text-[11px] text-[#6b7280]">
              {visits.length}{" "}
              {visits.length === 1 ? "visita agendada" : "visitas agendadas"}
            </div>
            {isTodayDate && (
              <div className="text-[10px] px-2 py-0.5 rounded-full bg-[#ecfdf3] text-[#166534] border border-[#bbf7d0]">
                Hoy
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => changeDate(1)}
              disabled={loadingVisits}
              className="p-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Día siguiente"
            >
              <ChevronRight className="w-5 h-5 text-[#6b7280]" />
            </button>
            {!isTodayDate && (
              <button
                onClick={goToToday}
                disabled={loadingVisits}
                className="px-3 py-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] text-[11px] font-medium hover:bg-[#dbeafe] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Ir a hoy"
              >
                Hoy
              </button>
            )}
          </div>
        </div>
        
        {loadingVisits && (
          <div className="text-[11px] text-[#6b7280] text-center py-1">
            Cargando visitas...
          </div>
        )}
      </header>

      {/* Accordion */}
      <section className="flex flex-col gap-2">
        {visits.length === 0 ? (
          <div className="mt-8 p-12 rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)] flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f3f4f6] to-[#e5e7eb] flex items-center justify-center shadow-inner">
                <CalendarX className="w-10 h-10 text-[#9ca3af]" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#fef3c2] border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="text-lg font-semibold text-[#111827]">
                No hay visitas agendadas
              </div>
              <div className="text-sm text-[#6b7280] max-w-[280px] leading-relaxed">
                No tienes visitas programadas para hoy. Tus visitas aparecerán aquí cuando estén agendadas.
              </div>
            </div>
            <div className="mt-2 px-4 py-2 rounded-lg bg-[#f9fafb] border border-[#e5e7eb]">
              <div className="text-[11px] text-[#6b7280] text-center">
                {displayDate}
              </div>
            </div>
          </div>
        ) : (
          visits.map((visit) => {
            const isOpen = openItems.has(visit.id);
            const status = checkinStatus[visit.id];
            const isDone = visit.status === "DONE";

            return (
              <article
                key={visit.id}
                className={`rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden shadow-[0_4px_16px_rgba(15,23,42,0.04)] ${
                  isOpen ? "" : ""
                }`}
              >
                <div
                  className="p-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleItem(visit.id)}
                >
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#111827]">
                      {visit.patientName}
                    </div>
                    <div className="text-[11px] text-[#6b7280] truncate">
                      {visit.address}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    <div className="text-[11px] text-[#4b5563] whitespace-nowrap">
                      {formatTime(visit.scheduledStart)} –{" "}
                      {formatTime(visit.scheduledEnd)}
                    </div>
                    <div
                      className={`text-[10px] px-2 py-[3px] rounded-full whitespace-nowrap ${
                        isDone
                          ? "bg-[#ecfdf3] text-[#166534] border border-[#bbf7d0]"
                          : "bg-[#eef2ff] text-[#4338ca] border border-[#e0e7ff]"
                      }`}
                    >
                      {getStatusText(visit.status)}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-[#9ca3af] transition-transform duration-150 ml-2 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </div>
                {isOpen && (
                  <div className="border-t border-[#f3f4f6] p-[10px_14px_14px]">
                    {/* Patient Card */}
                    <div className="bg-[#f9fafb] rounded-[14px] border border-[#e5e7eb] p-3 mb-[10px] flex gap-[10px]">
                      <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-[#f9fafb] font-bold text-lg flex-shrink-0">
                        {getInitials(visit.patientName)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm font-semibold text-[#111827]">
                            {visit.patientName}
                          </div>
                          <div className="text-[10px] px-2 py-0.5 rounded-full bg-[#ecfeff] text-[#0e7490] border border-[#bae6fd]">
                            Visita domiciliaria
                          </div>
                        </div>
                        <div className="text-xs text-[#4b5563] mb-1">
                          {visit.address}
                        </div>
                        <div className="text-[11px] text-[#6b7280]">
                          Rango permitido de registro: desde 10 minutos antes
                          hasta 20 minutos después del inicio.
                        </div>
                      </div>
                    </div>

                    {/* Map Card */}
                    <div className="mt-1 bg-white rounded-[14px] border border-[#e5e7eb] p-[10px_10px_12px] flex flex-col gap-2">
                      {/* Header con título y badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-[#111827]">
                          Validación de ubicación
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-[10px] px-2 py-[3px] rounded-full border border-[#bfdbfe] text-[#1d4ed8] bg-[#eff6ff] whitespace-nowrap">
                            Radio 150 m
                          </div>
                          {userLocation && (
                            <button
                              onClick={() => requestUserLocation(visit.id)}
                              disabled={requestingLocation.has(visit.id)}
                              className="p-1.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Actualizar ubicación"
                            >
                              <RefreshCw 
                                className={`w-3.5 h-3.5 ${requestingLocation.has(visit.id) ? 'animate-spin' : ''}`} 
                              />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Mensajes de solicitud de ubicación */}
                      {!userLocation && !locationError && !requestingLocation.has(visit.id) && (
                        <div className="p-2.5 rounded-lg bg-[#eff6ff] border border-[#bfdbfe]">
                          <div className="text-[11px] text-[#1e40af] mb-2">
                            Para validar tu asistencia, necesitamos conocer tu ubicación actual.
                          </div>
                          <button
                            onClick={() => requestUserLocation(visit.id)}
                            className="w-full py-1.5 px-3 rounded-lg bg-[#3b82f6] text-white text-[11px] font-medium hover:bg-[#2563eb] transition-colors"
                          >
                            Compartir mi ubicación
                          </button>
                        </div>
                      )}
                      {requestingLocation.has(visit.id) && (
                        <div className="text-[10px] text-[#6b7280] text-center py-2">
                          Solicitando ubicación...
                        </div>
                      )}
                      {locationError && (
                        <div className="p-2.5 rounded-lg bg-[#fef2f2] border border-[#fecaca]">
                          <div className="text-[11px] text-[#991b1b] mb-2 whitespace-pre-line">
                            {locationError}
                          </div>
                          <button
                            onClick={() => requestUserLocation(visit.id)}
                            className="w-full py-1.5 px-3 rounded-lg bg-[#dc2626] text-white text-[11px] font-medium hover:bg-[#b91c1c] transition-colors"
                          >
                            Intentar nuevamente
                          </button>
                        </div>
                      )}

                      {/* Leyenda */}
                      <div className="flex gap-[10px] items-center text-[10px] text-[#6b7280]">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
                          <span>Dirección del paciente</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
                          <span>Tu posición estimada</span>
                        </div>
                      </div>

                      <div className="mt-0.5 relative rounded-xl overflow-hidden h-[280px] bg-[#f9fafb] bg-[length:20px_20px] bg-[linear-gradient(to_right,rgba(148,163,184,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.25)_1px,transparent_1px)]">
                        {(() => {
                          const visitLat = typeof visit.lat === 'object' ? Number(visit.lat) : visit.lat;
                          const visitLng = typeof visit.lng === 'object' ? Number(visit.lng) : visit.lng;
                          const userStatus = status;
                          // Usar coordenadas del check-in si existen, sino usar userLocation
                          const userLat = userStatus?.userLat ?? userLocation?.lat;
                          const userLng = userStatus?.userLng ?? userLocation?.lng;
                          
                          // Calcular distancia si tenemos ambas coordenadas
                          let distance: number | undefined;
                          if (userLat && userLng) {
                            distance = Math.round(distanceInMeters(visitLat, visitLng, userLat, userLng));
                          }
                          
                          // Determinar si la distancia es demasiado grande para mostrar ambos puntos
                          // Si la distancia es mayor a 500m, solo mostrar el paciente y la flecha en la esquina
                          const MAX_DISTANCE_TO_SHOW_BOTH = 500; // metros
                          const shouldShowUserPoint = distance !== undefined && distance <= MAX_DISTANCE_TO_SHOW_BOTH;
                          
                          // Si la distancia es muy grande, centrar solo en el paciente con zoom fijo
                          const mapPos = shouldShowUserPoint && userLat && userLng
                            ? calculateMapPosition(visitLat, visitLng, userLat, userLng, distance)
                            : calculateMapPosition(visitLat, visitLng, undefined, undefined, undefined);
                          
                          return (
                            <>
                              {/* Map Gradient - centrado en el paciente */}
                              <div 
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  background: `radial-gradient(circle at ${mapPos.patientLeft} ${mapPos.patientTop}, rgba(34,197,94,0.16), transparent 60%)`
                                }}
                              ></div>
                              {/* Radius Circle - centrado en el paciente */}
                              {(() => {
                                const mapHeightPx = 280;
                                const radiusMeters = 150;
                                // Usar un tamaño fijo para el círculo de 150m (aproximadamente 43% del ancho)
                                const radiusPx = 120;
                                
                                return (
                                  <div 
                                    className="absolute rounded-full border-2 border-dashed border-[#3b82f6] pointer-events-none bg-[rgba(59,130,246,0.1)]"
                                    style={{
                                      top: `calc(${mapPos.patientTop} - ${radiusPx / 2}px)`,
                                      left: `calc(${mapPos.patientLeft} - ${radiusPx / 2}px)`,
                                      width: `${radiusPx}px`,
                                      height: `${radiusPx}px`,
                                      boxShadow: '0 0 0 2px rgba(59,130,246,0.15), inset 0 0 0 1px rgba(59,130,246,0.1)',
                                    }}
                                  ></div>
                                );
                              })()}
                              {/* Patient Pin */}
                              <div 
                                className="absolute flex flex-col items-center gap-0.5 text-[10px] text-[#111827] [text-shadow:0_1px_3px_rgba(255,255,255,0.9)]"
                                style={{
                                  top: mapPos.patientTop,
                                  left: mapPos.patientLeft,
                                  transform: 'translate(-50%, -50%)',
                                }}
                              >
                                <div className="w-[14px] h-[14px] rounded-full border-2 border-[rgba(243,244,246,0.9)] shadow-[0_0_10px_rgba(148,163,184,0.6)] bg-[#22c55e] animate-pulse-pin"></div>
                                <div>Paciente</div>
                              </div>
                              {/* User Pin - mostrar solo si la distancia es razonable */}
                              {shouldShowUserPoint && userLat && userLng && (
                                <div 
                                  className="absolute flex flex-col items-center gap-0.5 text-[10px] text-[#111827] [text-shadow:0_1px_3px_rgba(255,255,255,0.9)]"
                                  style={{
                                    top: mapPos.userTop,
                                    left: mapPos.userLeft,
                                    transform: 'translate(-50%, -50%)',
                                  }}
                                >
                                  <div className="w-[14px] h-[14px] rounded-full border-2 border-[rgba(243,244,246,0.9)] shadow-[0_0_10px_rgba(148,163,184,0.6)] bg-[#3b82f6] animate-pulse-pin"></div>
                                  <div>Tú</div>
                                </div>
                              )}
                              {/* Arrow Indicator en esquina - mostrar cuando la distancia es muy grande */}
                              {userLat && userLng && distance !== undefined && !shouldShowUserPoint && (
                                <div
                                  className="absolute top-4 right-4 pointer-events-none"
                                >
                                  <div className="flex flex-col items-end gap-1.5">
                                    <ArrowBigRightDash 
                                      className="w-6 h-6 text-[#3b82f6] drop-shadow-lg animate-pulse-arrow" 
                                      strokeWidth={2.5}
                                    />
                                    <div className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.95)] text-[10px] font-medium text-[#111827] border border-[#e5e7eb] shadow-md whitespace-nowrap">
                                      {formatDistance(distance)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        {/* Distance Pill */}
                        <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 text-[11px] px-[10px] py-1.5 rounded-full bg-[rgba(255,255,255,0.96)] text-[#111827] border border-[#e5e7eb] inline-flex items-center gap-1.5">
                          {(() => {
                            const visitLat = typeof visit.lat === 'object' ? Number(visit.lat) : visit.lat;
                            const visitLng = typeof visit.lng === 'object' ? Number(visit.lng) : visit.lng;
                            const userStatus = status;
                            const userLat = userStatus?.userLat ?? userLocation?.lat;
                            const userLng = userStatus?.userLng ?? userLocation?.lng;
                            
                            if (userLat && userLng) {
                              const distance = Math.round(
                                distanceInMeters(visitLat, visitLng, userLat, userLng)
                              );
                              return `Distancia estimada: ${formatDistance(distance)}`;
                            }
                            return "Distancia estimada: -- m";
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Info Card */}
                    <div className="mt-1.5 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-2 text-[11px] text-[#4b5563] flex gap-2 items-start">
                      <div className="w-4 h-4 rounded-full border border-[#cbd5f5] flex items-center justify-center text-[11px] text-[#4f46e5] bg-[#eef2ff] flex-shrink-0">
                        i
                      </div>
                      <div>
                        Al confirmar la asistencia, la aplicación validará tu
                        ubicación actual y el horario respecto a la visita
                        agendada. Si estás fuera del radio permitido o del rango
                        horario, se mostrará una alerta.
                      </div>
                    </div>

                    {/* Main Button */}
                    <button
                      className="mt-2 w-full py-[11px] rounded-xl border-none bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-[#064e3b] text-sm font-bold cursor-pointer flex items-center justify-center gap-2 transition-all duration-75 active:translate-y-[1px] active:scale-[0.99] active:brightness-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleCheckin(visit)}
                      disabled={status?.loading || isDone}
                    >
                      <span className="tracking-[0.02em]">
                        {status?.loading
                          ? "Registrando..."
                          : isDone
                          ? "Asistencia ya registrada"
                          : "Confirmar asistencia a esta visita"}
                      </span>
                    </button>

                    {/* Example Status Message - shown before check-in */}
                    {!status && !isDone && (
                      <div className="mt-1.5 px-2.5 py-[7px] rounded-[10px] text-[11px] bg-[#ecfdf3] text-[#166534] border border-[#bbf7d0]">
                        Ejemplo de estado: la asistencia puede registrarse. Dentro del radio permitido y en el rango de horario.
                      </div>
                    )}

                    {/* Status Message */}
                    {status && !status.loading && (
                      <div
                        className={`mt-1.5 px-2.5 py-[7px] rounded-[10px] text-[11px] ${
                          status.ok
                            ? "bg-[#ecfdf3] text-[#166534] border border-[#bbf7d0]"
                            : status.isValidTime === false ||
                              status.isValidRadius === false
                            ? "bg-[#fef3c2] text-[#92400e] border border-[#fde68a]"
                            : "bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]"
                        }`}
                      >
                        {status.message}
                        {status.distanceMeters !== undefined && status.isValidTime && status.isValidRadius && (
                          <div className="mt-1 text-[10px]">
                            Distancia: {status.distanceMeters}m · Tiempo: ✓ · Radio: ✓
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

