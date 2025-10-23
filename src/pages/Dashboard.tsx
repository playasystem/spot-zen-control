import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Car, Users, DollarSign, AlertCircle, ParkingSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Lugar {
  id: string;
  numero: number;
  tipo: 'auto' | 'moto' | 'camioneta';
  estado: 'disponible' | 'ocupado' | 'reservado';
  vehiculo_actual_id: string | null;
  cliente_asignado_id: string | null;
}

interface Stats {
  lugaresDisponiblesAutos: number;
  lugaresDisponiblesMotos: number;
  lugaresOcupadosAutos: number;
  lugaresOcupadosMotos: number;
  totalClientes: number;
  clientesMensuales: number;
  ingresosHoy: number;
  vencimientosCercanos: number;
}

export default function Dashboard() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [stats, setStats] = useState<Stats>({
    lugaresDisponiblesAutos: 0,
    lugaresDisponiblesMotos: 0,
    lugaresOcupadosAutos: 0,
    lugaresOcupadosMotos: 0,
    totalClientes: 0,
    clientesMensuales: 0,
    ingresosHoy: 0,
    vencimientosCercanos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lugares' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch lugares
      const { data: lugaresData, error: lugaresError } = await supabase
        .from('lugares')
        .select('*')
        .order('numero');

      if (lugaresError) throw lugaresError;

      // Fetch clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*');

      if (clientesError) throw clientesError;

      // Fetch ingresos de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const { data: ingresosData, error: ingresosError } = await supabase
        .from('ingresos')
        .select('monto')
        .gte('hora_entrada', `${hoy}T00:00:00`)
        .not('monto', 'is', null);

      if (ingresosError) throw ingresosError;

      // Fetch pagos próximos a vencer
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 7);
      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select('*')
        .lte('periodo_hasta', fechaLimite.toISOString().split('T')[0])
        .gte('periodo_hasta', new Date().toISOString().split('T')[0]);

      if (pagosError) throw pagosError;

      setLugares(lugaresData || []);

      const autos = lugaresData?.filter(l => l.tipo === 'auto') || [];
      const motos = lugaresData?.filter(l => l.tipo === 'moto') || [];

      const ingresosTotal = ingresosData?.reduce((sum, ing) => sum + Number(ing.monto || 0), 0) || 0;
      const clientesMensuales = clientesData?.filter(c => c.tipo_cliente === 'mensual' && c.activo).length || 0;

      setStats({
        lugaresDisponiblesAutos: autos.filter(l => l.estado === 'disponible').length,
        lugaresDisponiblesMotos: motos.filter(l => l.estado === 'disponible').length,
        lugaresOcupadosAutos: autos.filter(l => l.estado === 'ocupado').length,
        lugaresOcupadosMotos: motos.filter(l => l.estado === 'ocupado').length,
        totalClientes: clientesData?.length || 0,
        clientesMensuales,
        ingresosHoy: ingresosTotal,
        vencimientosCercanos: pagosData?.length || 0,
      });
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'bg-success';
      case 'ocupado': return 'bg-destructive';
      case 'reservado': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Dashboard</h1>
          <Badge variant="outline" className="text-xs sm:text-sm lg:text-base px-3 py-1.5 sm:px-4 sm:py-2 w-fit">
            {new Date().toLocaleDateString('es-AR', { 
              weekday: window.innerWidth < 640 ? 'short' : 'long', 
              year: 'numeric', 
              month: window.innerWidth < 640 ? 'short' : 'long', 
              day: 'numeric' 
            })}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Car className="w-3 h-3 sm:w-4 sm:h-4" />
                Autos Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {stats.lugaresDisponiblesAutos}/{stats.lugaresDisponiblesAutos + stats.lugaresOcupadosAutos}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.lugaresOcupadosAutos} ocupados
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ParkingSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                Motos Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold text-success">
                {stats.lugaresDisponiblesMotos}/{stats.lugaresDisponiblesMotos + stats.lugaresOcupadosMotos}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.lugaresOcupadosMotos} ocupadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Clientes Activos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold text-accent">
                {stats.totalClientes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.clientesMensuales} mensuales
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                Ingresos Hoy
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold text-warning">
                ${stats.ingresosHoy.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.vencimientosCercanos} vencimientos próximos
              </p>
            </CardContent>
          </Card>
        </div>

        {stats.vencimientosCercanos > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-warning" />
              <p className="text-sm font-medium">
                Hay {stats.vencimientosCercanos} cliente(s) con vencimiento en los próximos 7 días
              </p>
            </CardContent>
          </Card>
        )}

        {/* Mapa de lugares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ParkingSquare className="w-5 h-5" />
              Mapa de Lugares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {lugares.length === 0 ? (
              <div className="text-center py-12">
                <ParkingSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay lugares configurados</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Parece que la base de datos no tiene lugares de estacionamiento creados.
                </p>
                <p className="text-xs text-muted-foreground">
                  Verifica que las migraciones de Supabase se hayan ejecutado correctamente.
                </p>
              </div>
            ) : (
              <>
                {/* Autos */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Car className="w-4 h-4 shrink-0" />
                    Autos ({lugares.filter(l => l.tipo === 'auto').length} lugares)
                  </h3>
                  {lugares.filter(l => l.tipo === 'auto').length > 0 ? (
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5 sm:gap-2">
                      {lugares
                        .filter(l => l.tipo === 'auto')
                        .sort((a, b) => a.numero - b.numero)
                        .map(lugar => (
                          <div
                            key={lugar.id}
                            className={`aspect-square rounded-md sm:rounded-lg ${getEstadoColor(lugar.estado)} flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all cursor-pointer touch-manipulation`}
                            title={`Lugar ${lugar.numero} - ${lugar.estado}`}
                          >
                            {lugar.numero}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay lugares para autos configurados</p>
                  )}
                </div>

                {/* Motos */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <ParkingSquare className="w-4 h-4 shrink-0" />
                    Motos ({lugares.filter(l => l.tipo === 'moto').length} lugares)
                  </h3>
                  {lugares.filter(l => l.tipo === 'moto').length > 0 ? (
                    <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-1.5 sm:gap-2">
                      {lugares
                        .filter(l => l.tipo === 'moto')
                        .sort((a, b) => a.numero - b.numero)
                        .map(lugar => (
                          <div
                            key={lugar.id}
                            className={`aspect-square rounded-md sm:rounded-lg ${getEstadoColor(lugar.estado)} flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shadow-sm active:scale-95 transition-all cursor-pointer touch-manipulation`}
                            title={`Lugar ${lugar.numero} - ${lugar.estado}`}
                          >
                            {lugar.numero}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay lugares para motos configurados</p>
                  )}
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-success shrink-0"></div>
                    <span className="text-xs sm:text-sm">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-destructive shrink-0"></div>
                    <span className="text-xs sm:text-sm">Ocupado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-warning shrink-0"></div>
                    <span className="text-xs sm:text-sm">Reservado</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
