import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Car, ParkingSquare, Truck, Save, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Tarifa {
  id: string;
  tipo_vehiculo: 'auto' | 'moto' | 'camioneta';
  precio_hora: number;
  fraccion_minutos: number;
  es_por_turno: boolean | null;
  duracion_turno_horas: number | null;
}

interface Turno {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  orden: number;
  activo: boolean | null;
}

export default function Tarifas() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tarifasRes, turnosRes] = await Promise.all([
        supabase.from('tarifas').select('*').order('tipo_vehiculo'),
        supabase.from('turnos').select('*').order('orden'),
      ]);

      if (tarifasRes.error) throw tarifasRes.error;
      if (turnosRes.error) throw turnosRes.error;

      setTarifas(tarifasRes.data || []);
      setTurnos(turnosRes.data || []);
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarifa = async (tarifa: Tarifa) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tarifas')
        .update({
          precio_hora: tarifa.precio_hora,
          fraccion_minutos: tarifa.fraccion_minutos,
          es_por_turno: tarifa.es_por_turno,
          duracion_turno_horas: tarifa.duracion_turno_horas,
        })
        .eq('id', tarifa.id);

      if (error) throw error;

      toast.success(`Tarifa de ${tarifa.tipo_vehiculo} actualizada correctamente`);
      fetchData();
    } catch (error: any) {
      toast.error('Error al actualizar tarifa: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateTarifaLocal = (id: string, field: keyof Tarifa, value: any) => {
    setTarifas(tarifas.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'auto': return <Car className="w-5 h-5" />;
      case 'camioneta': return <Truck className="w-5 h-5" />;
      case 'moto': return <ParkingSquare className="w-5 h-5" />;
      default: return <Car className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando tarifas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Gestión de Tarifas</h1>
            <p className="text-muted-foreground mt-1">
              Configura los precios y fracciones para cada tipo de vehículo
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <DollarSign className="w-4 h-4 mr-2" />
            Tarifario
          </Badge>
        </div>

        {/* Tarifas por Vehículo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tarifas.map((tarifa) => (
            <Card key={tarifa.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTipoIcon(tarifa.tipo_vehiculo)}
                  <span className="capitalize">{tarifa.tipo_vehiculo}</span>
                </CardTitle>
                <CardDescription>
                  {tarifa.es_por_turno 
                    ? `Tarifa por turno de ${tarifa.duracion_turno_horas || 8} horas`
                    : `Tarifa por hora con fracciones de ${tarifa.fraccion_minutos} minutos`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`precio-${tarifa.id}`}>
                    {tarifa.es_por_turno ? 'Precio por Turno' : 'Precio por Hora'}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id={`precio-${tarifa.id}`}
                      type="number"
                      value={tarifa.precio_hora}
                      onChange={(e) => updateTarifaLocal(tarifa.id, 'precio_hora', Number(e.target.value))}
                      className="pl-7"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>

                {!tarifa.es_por_turno && (
                  <div className="space-y-2">
                    <Label htmlFor={`fraccion-${tarifa.id}`}>
                      Fracción (minutos)
                    </Label>
                    <Input
                      id={`fraccion-${tarifa.id}`}
                      type="number"
                      value={tarifa.fraccion_minutos}
                      onChange={(e) => updateTarifaLocal(tarifa.id, 'fraccion_minutos', Number(e.target.value))}
                      min="1"
                      step="5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se cobrará cada {tarifa.fraccion_minutos} minutos
                    </p>
                  </div>
                )}

                {tarifa.es_por_turno && (
                  <div className="space-y-2">
                    <Label htmlFor={`duracion-${tarifa.id}`}>
                      Duración del Turno (horas)
                    </Label>
                    <Input
                      id={`duracion-${tarifa.id}`}
                      type="number"
                      value={tarifa.duracion_turno_horas || 8}
                      onChange={(e) => updateTarifaLocal(tarifa.id, 'duracion_turno_horas', Number(e.target.value))}
                      min="1"
                      max="24"
                    />
                  </div>
                )}

                <Button 
                  onClick={() => handleUpdateTarifa(tarifa)} 
                  className="w-full gap-2"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </Button>

                {/* Preview de cálculo */}
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-semibold mb-1">Ejemplo de cobro:</p>
                  {tarifa.es_por_turno ? (
                    <>
                      <p>• 1 turno: ${tarifa.precio_hora}</p>
                      <p>• 2 turnos: ${tarifa.precio_hora * 2}</p>
                    </>
                  ) : (
                    <>
                      <p>• 30 min: ${(tarifa.precio_hora / 60 * Math.ceil(30 / tarifa.fraccion_minutos) * tarifa.fraccion_minutos).toFixed(0)}</p>
                      <p>• 1 hora: ${tarifa.precio_hora}</p>
                      <p>• 2 horas: ${tarifa.precio_hora * 2}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Información de Turnos */}
        {turnos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Turnos Configurados
              </CardTitle>
              <CardDescription>
                Turnos aplicables para el cálculo de tarifas de motos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {turnos.map((turno) => (
                  <div 
                    key={turno.id}
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{turno.nombre}</h3>
                      <Badge variant={turno.activo ? 'default' : 'secondary'}>
                        {turno.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {turno.hora_inicio.slice(0, 5)} - {turno.hora_fin.slice(0, 5)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información Adicional */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">
              ℹ️ Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Autos y Camionetas:</strong> Se cobra por hora, con fracciones configurables. 
              Por ejemplo, si configuraste fracciones de 30 minutos, se cobrará cada media hora.
            </p>
            <p>
              <strong>Motos:</strong> Se cobra por turno completo. Un turno tiene una duración fija 
              (configurado en {tarifas.find(t => t.tipo_vehiculo === 'moto')?.duracion_turno_horas || 8} horas). 
              Si una moto permanece más de un turno, se cobrarán múltiples turnos.
            </p>
            <p className="mt-4 text-muted-foreground">
              <strong>Nota:</strong> Los cambios en las tarifas se aplicarán inmediatamente a los nuevos ingresos.
              Los ingresos ya registrados mantendrán su cálculo original.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

