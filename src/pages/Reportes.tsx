import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { DollarSign, Users, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [reporteHoy, setReporteHoy] = useState({
    ingresosPorHora: 0,
    ingresosTotal: 0,
    vehiculosAtendidos: 0,
  });

  useEffect(() => {
    fetchReportes();
  }, []);

  const fetchReportes = async () => {
    try {
      const hoy = new Date();
      const inicio = startOfDay(hoy).toISOString();
      const fin = endOfDay(hoy).toISOString();

      const { data: ingresosHoy, error } = await supabase
        .from('ingresos')
        .select('*')
        .gte('hora_entrada', inicio)
        .lte('hora_entrada', fin);

      if (error) throw error;

      const ingresosPorHora = ingresosHoy?.filter(i => i.tipo_cliente === 'por_hora' && i.monto)
        .reduce((sum, i) => sum + Number(i.monto), 0) || 0;

      setReporteHoy({
        ingresosPorHora,
        ingresosTotal: ingresosPorHora,
        vehiculosAtendidos: ingresosHoy?.length || 0,
      });
    } catch (error: any) {
      toast.error('Error al cargar reportes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-6 space-y-6">
        <h1 className="text-4xl font-bold">Reportes e Ingresos</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ingresos Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${reporteHoy.ingresosTotal.toFixed(0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Vehículos Atendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {reporteHoy.vehiculosAtendidos}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Por Hora Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                ${reporteHoy.ingresosPorHora.toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reporte Diario - {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Los reportes detallados y exportación estarán disponibles próximamente.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
