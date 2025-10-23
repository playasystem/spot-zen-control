import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

interface Ingreso {
  id: string;
  vehiculo_id: string;
  lugar_id: string;
  hora_entrada: string;
  hora_salida: string | null;
  monto: number | null;
  tipo_cliente: 'mensual' | 'por_hora';
  vehiculos?: {
    patente: string;
    tipo: 'auto' | 'moto' | 'camioneta';
  };
  lugares?: {
    numero: number;
    tipo: string;
  };
}

interface Lugar {
  id: string;
  numero: number;
  tipo: 'auto' | 'moto' | 'camioneta';
  estado: string;
}

interface Vehiculo {
  id: string;
  patente: string;
  tipo: 'auto' | 'moto' | 'camioneta';
}

interface Tarifa {
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
}

export default function Ingresos() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogType, setDialogType] = useState<'entrada' | 'salida' | null>(null);
  const [selectedIngreso, setSelectedIngreso] = useState<Ingreso | null>(null);

  const [entradaForm, setEntradaForm] = useState({
    patente: '',
    tipoVehiculo: 'auto' as 'auto' | 'moto' | 'camioneta',
    tipoCliente: 'por_hora' as 'mensual' | 'por_hora',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ingresosRes, lugaresRes, vehiculosRes, tarifasRes] = await Promise.all([
        supabase
          .from('ingresos')
          .select(`
            *,
            vehiculos(patente, tipo),
            lugares(numero, tipo)
          `)
          .order('hora_entrada', { ascending: false })
          .limit(50),
        supabase.from('lugares').select('*').order('numero'),
        supabase.from('vehiculos').select('*'),
        supabase.from('tarifas').select('*'),
      ]);

      if (ingresosRes.error) throw ingresosRes.error;
      if (lugaresRes.error) throw lugaresRes.error;
      if (vehiculosRes.error) throw vehiculosRes.error;
      if (tarifasRes.error) throw tarifasRes.error;

      setIngresos(ingresosRes.data || []);
      setLugares(lugaresRes.data || []);
      setVehiculos(vehiculosRes.data || []);
      setTarifas(tarifasRes.data || []);
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTurnoActual = (fecha: Date): string => {
    const hora = fecha.getHours();
    
    // Turno Mañana: 6am - 14pm (6-13)
    if (hora >= 6 && hora < 14) return 'Mañana';
    // Turno Tarde: 14pm - 22pm (14-21)
    if (hora >= 14 && hora < 22) return 'Tarde';
    // Turno Noche: 22pm - 6am (22-23, 0-5)
    return 'Noche';
  };

  const calcularMonto = (horaEntrada: string, horaSalida: string, tipoVehiculo: string) => {
    const tarifa = tarifas.find(t => t.tipo_vehiculo === tipoVehiculo);
    if (!tarifa) return 0;

    const fechaEntrada = new Date(horaEntrada);
    const fechaSalida = new Date(horaSalida);
    const minutos = differenceInMinutes(fechaSalida, fechaEntrada);

    // Para motos: cobrar por turno
    if (tipoVehiculo === 'moto' && tarifa.es_por_turno) {
      const turnoEntrada = getTurnoActual(fechaEntrada);
      const turnoSalida = getTurnoActual(fechaSalida);
      
      // Si es el mismo día y mismo turno: 1 turno
      if (fechaEntrada.toDateString() === fechaSalida.toDateString() && turnoEntrada === turnoSalida) {
        return tarifa.precio_hora; // precio_hora contiene el precio del turno ($1000)
      }
      
      // Si cambió de turno, calcular cuántos turnos pasaron
      const horas = minutos / 60;
      const turnosCompletos = Math.ceil(horas / (tarifa.duracion_turno_horas || 8));
      return turnosCompletos * tarifa.precio_hora;
    }

    // Para autos y camionetas: cobrar por hora con fracciones
    const fracciones = Math.ceil(minutos / tarifa.fraccion_minutos);
    const horas = fracciones * (tarifa.fraccion_minutos / 60);
    return horas * tarifa.precio_hora;
  };

  const handleEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Buscar o crear vehículo
      let vehiculoId = '';
      const vehiculoExistente = vehiculos.find(
        v => v.patente.toLowerCase() === entradaForm.patente.toLowerCase()
      );

      if (vehiculoExistente) {
        vehiculoId = vehiculoExistente.id;
      } else {
        const { data: nuevoVehiculo, error: errorVehiculo } = await supabase
          .from('vehiculos')
          .insert({
            patente: entradaForm.patente.toUpperCase(),
            tipo: entradaForm.tipoVehiculo,
          })
          .select()
          .single();

        if (errorVehiculo) throw errorVehiculo;
        vehiculoId = nuevoVehiculo.id;
      }

      // Buscar lugar disponible
      const lugarDisponible = lugares.find(
        l => l.tipo === entradaForm.tipoVehiculo && l.estado === 'disponible'
      );

      if (!lugarDisponible) {
        toast.error(`No hay lugares disponibles para ${entradaForm.tipoVehiculo}`);
        return;
      }

      // Registrar ingreso
      const { error: errorIngreso } = await supabase
        .from('ingresos')
        .insert({
          vehiculo_id: vehiculoId,
          lugar_id: lugarDisponible.id,
          hora_entrada: new Date().toISOString(),
          tipo_cliente: entradaForm.tipoCliente,
        });

      if (errorIngreso) throw errorIngreso;

      // Actualizar lugar
      const { error: errorLugar } = await supabase
        .from('lugares')
        .update({ 
          estado: 'ocupado',
          vehiculo_actual_id: vehiculoId
        })
        .eq('id', lugarDisponible.id);

      if (errorLugar) throw errorLugar;

      toast.success(`Entrada registrada en lugar ${lugarDisponible.numero}`);
      setDialogType(null);
      setEntradaForm({
        patente: '',
        tipoVehiculo: 'auto',
        tipoCliente: 'por_hora',
      });
      fetchData();
    } catch (error: any) {
      toast.error('Error al registrar entrada: ' + error.message);
    }
  };

  const handleSalida = async () => {
    if (!selectedIngreso) return;

    try {
      const horaSalida = new Date().toISOString();
      const monto = selectedIngreso.tipo_cliente === 'por_hora' 
        ? calcularMonto(
            selectedIngreso.hora_entrada, 
            horaSalida, 
            selectedIngreso.vehiculos?.tipo || 'auto'
          )
        : 0;

      // Actualizar ingreso
      const { error: errorIngreso } = await supabase
        .from('ingresos')
        .update({
          hora_salida: horaSalida,
          monto: monto,
        })
        .eq('id', selectedIngreso.id);

      if (errorIngreso) throw errorIngreso;

      // Liberar lugar
      const { error: errorLugar } = await supabase
        .from('lugares')
        .update({ 
          estado: 'disponible',
          vehiculo_actual_id: null
        })
        .eq('id', selectedIngreso.lugar_id);

      if (errorLugar) throw errorLugar;

      toast.success(`Salida registrada. ${selectedIngreso.tipo_cliente === 'por_hora' ? `Monto: $${monto.toFixed(0)}` : 'Cliente mensual'}`);
      setDialogType(null);
      setSelectedIngreso(null);
      fetchData();
    } catch (error: any) {
      toast.error('Error al registrar salida: ' + error.message);
    }
  };

  const ingresosActivos = ingresos.filter(i => !i.hora_salida);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Entrada y Salida</h1>
          <div className="flex gap-2">
            <Button onClick={() => setDialogType('entrada')} className="gap-2 w-full sm:w-auto" size="sm">
              <LogIn className="w-4 h-4" />
              <span className="hidden xs:inline">Registrar</span> Entrada
            </Button>
          </div>
        </div>

        {/* Vehículos activos */}
        <Card className="border-l-4 border-l-success">
          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              Vehículos Activos ({ingresosActivos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            {/* Vista móvil - Cards */}
            <div className="block md:hidden space-y-3">
              {ingresosActivos.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No hay vehículos activos
                </div>
              ) : (
                ingresosActivos.map((ingreso) => {
                  const minutos = differenceInMinutes(new Date(), new Date(ingreso.hora_entrada));
                  const horas = Math.floor(minutos / 60);
                  const mins = minutos % 60;
                  
                  return (
                    <Card key={ingreso.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-mono font-bold text-lg mb-1">
                              {ingreso.vehiculos?.patente}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {ingreso.vehiculos?.tipo}
                              </Badge>
                              <Badge variant={ingreso.tipo_cliente === 'mensual' ? 'default' : 'secondary'} className="text-xs">
                                {ingreso.tipo_cliente === 'mensual' ? 'Mensual' : 'Por Hora'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground text-xs">Lugar</p>
                            <p className="font-medium">{ingreso.lugares?.numero}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Entrada</p>
                            <p className="font-medium">
                              {format(new Date(ingreso.hora_entrada), 'HH:mm', { locale: es })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Tiempo</p>
                            <p className="font-medium">{horas}h {mins}m</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedIngreso(ingreso);
                            setDialogType('salida');
                          }}
                          className="w-full gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Registrar Salida
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Vista desktop - Tabla */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Lugar</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingresosActivos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No hay vehículos activos
                      </TableCell>
                    </TableRow>
                  ) : (
                    ingresosActivos.map((ingreso) => {
                      const minutos = differenceInMinutes(new Date(), new Date(ingreso.hora_entrada));
                      const horas = Math.floor(minutos / 60);
                      const mins = minutos % 60;
                      
                      return (
                        <TableRow key={ingreso.id}>
                          <TableCell className="font-mono font-bold">
                            {ingreso.vehiculos?.patente}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ingreso.vehiculos?.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            Lugar {ingreso.lugares?.numero}
                          </TableCell>
                          <TableCell>
                            {format(new Date(ingreso.hora_entrada), 'HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {horas}h {mins}m
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ingreso.tipo_cliente === 'mensual' ? 'default' : 'secondary'}>
                              {ingreso.tipo_cliente === 'mensual' ? 'Mensual' : 'Por Hora'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedIngreso(ingreso);
                                setDialogType('salida');
                              }}
                              className="gap-2"
                            >
                              <LogOut className="w-4 h-4" />
                              Salida
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Historial reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Historial Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patente</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingresos.slice(0, 10).map((ingreso) => {
                    const tiempoTotal = ingreso.hora_salida
                      ? differenceInMinutes(new Date(ingreso.hora_salida), new Date(ingreso.hora_entrada))
                      : 0;
                    const horas = Math.floor(tiempoTotal / 60);
                    const mins = tiempoTotal % 60;

                    return (
                      <TableRow key={ingreso.id}>
                        <TableCell className="font-mono">
                          {ingreso.vehiculos?.patente}
                        </TableCell>
                        <TableCell>
                          {format(new Date(ingreso.hora_entrada), 'dd/MM HH:mm', { locale: es })}
                        </TableCell>
                        <TableCell>
                          {ingreso.hora_salida 
                            ? format(new Date(ingreso.hora_salida), 'dd/MM HH:mm', { locale: es })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {ingreso.hora_salida ? `${horas}h ${mins}m` : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {ingreso.monto ? `$${ingreso.monto.toFixed(0)}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ingreso.hora_salida ? 'secondary' : 'default'}>
                            {ingreso.hora_salida ? 'Finalizado' : 'Activo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Entrada */}
        <Dialog open={dialogType === 'entrada'} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Registrar Entrada</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEntrada} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patente">Patente *</Label>
                <Input
                  id="patente"
                  value={entradaForm.patente}
                  onChange={(e) => setEntradaForm({ ...entradaForm, patente: e.target.value.toUpperCase() })}
                  placeholder="ABC123"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoVehiculo">Tipo de Vehículo *</Label>
                <Select
                  value={entradaForm.tipoVehiculo}
                  onValueChange={(value: any) => setEntradaForm({ ...entradaForm, tipoVehiculo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Auto - $2,000/hora (cada 30 min)
                    </SelectItem>
                    <SelectItem value="camioneta">
                      Camioneta - $2,400/hora (cada 30 min)
                    </SelectItem>
                    <SelectItem value="moto">
                      Moto - $1,000/turno (8 horas)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Info de tarifas */}
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-semibold mb-1">Tarifas:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Auto: $2,000/hora (se cobra cada 30 minutos)</li>
                  <li>• Camioneta: $2,400/hora (se cobra cada 30 minutos)</li>
                  <li>• Moto: $1,000 por turno de 8 horas</li>
                </ul>
                <p className="mt-2 text-xs">
                  <strong>Turnos de motos:</strong> 6-14hs / 14-22hs / 22-6hs
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoCliente">Tipo de Cliente *</Label>
                <Select
                  value={entradaForm.tipoCliente}
                  onValueChange={(value: any) => setEntradaForm({ ...entradaForm, tipoCliente: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="por_hora">Por Hora</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Registrar Entrada
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Salida */}
        <Dialog open={dialogType === 'salida'} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Registrar Salida</DialogTitle>
            </DialogHeader>
            {selectedIngreso && (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg text-sm sm:text-base">
                  <div>
                    <p className="text-sm text-muted-foreground">Patente</p>
                    <p className="font-mono font-bold text-lg">{selectedIngreso.vehiculos?.patente}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium capitalize">{selectedIngreso.vehiculos?.tipo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entrada</p>
                    <p className="font-medium">
                      {format(new Date(selectedIngreso.hora_entrada), 'dd/MM HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tiempo</p>
                    <p className="font-medium">
                      {(() => {
                        const minutos = differenceInMinutes(new Date(), new Date(selectedIngreso.hora_entrada));
                        const horas = Math.floor(minutos / 60);
                        const mins = minutos % 60;
                        return `${horas}h ${mins}m`;
                      })()}
                    </p>
                  </div>
                  {selectedIngreso.vehiculos?.tipo === 'moto' && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Turno Entrada</p>
                        <p className="font-medium">{getTurnoActual(new Date(selectedIngreso.hora_entrada))}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Turno Actual</p>
                        <p className="font-medium">{getTurnoActual(new Date())}</p>
                      </div>
                    </>
                  )}
                </div>
                {selectedIngreso.tipo_cliente === 'por_hora' && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Monto a Cobrar</p>
                    <p className="text-3xl font-bold text-primary">
                      ${calcularMonto(
                        selectedIngreso.hora_entrada,
                        new Date().toISOString(),
                        selectedIngreso.vehiculos?.tipo || 'auto'
                      ).toFixed(0)}
                    </p>
                    {selectedIngreso.vehiculos?.tipo === 'moto' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Tarifa por turno de 8 horas
                      </p>
                    )}
                    {selectedIngreso.vehiculos?.tipo !== 'moto' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Tarifa: ${selectedIngreso.vehiculos?.tipo === 'camioneta' ? '2,400' : '2,000'}/hora (fracciones de 30 min)
                      </p>
                    )}
                  </div>
                )}
                {selectedIngreso.tipo_cliente === 'mensual' && (
                  <div className="p-4 bg-success/10 rounded-lg">
                    <p className="text-sm text-success font-medium">Cliente Mensual</p>
                    <p className="text-xs text-muted-foreground mt-1">Sin cargo adicional</p>
                  </div>
                )}
                <Button onClick={handleSalida} className="w-full" size="lg">
                  Confirmar Salida
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
