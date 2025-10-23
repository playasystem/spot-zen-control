import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Car as CarIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  dni: string | null;
  tipo_cliente: 'mensual' | 'por_hora';
  activo: boolean;
  created_at: string;
}

interface Vehiculo {
  id: string;
  patente: string;
  tipo: 'auto' | 'moto' | 'camioneta';
  marca: string | null;
  color: string | null;
  cliente_id: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    dni: '',
    tipo_cliente: 'por_hora' as 'mensual' | 'por_hora',
  });

  useEffect(() => {
    fetchClientes();
    fetchVehiculos();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast.error('Error al cargar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiculos = async () => {
    try {
      const { data, error } = await supabase
        .from('vehiculos')
        .select('*');

      if (error) throw error;
      setVehiculos(data || []);
    } catch (error: any) {
      console.error('Error al cargar vehículos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre: formData.nombre,
            telefono: formData.telefono || null,
            dni: formData.dni || null,
            tipo_cliente: formData.tipo_cliente,
          })
          .eq('id', editingCliente.id);

        if (error) throw error;
        toast.success('Cliente actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert({
            nombre: formData.nombre,
            telefono: formData.telefono || null,
            dni: formData.dni || null,
            tipo_cliente: formData.tipo_cliente,
          });

        if (error) throw error;
        toast.success('Cliente creado correctamente');
      }

      setDialogOpen(false);
      resetForm();
      fetchClientes();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente? También se eliminarán sus vehículos asociados.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cliente eliminado correctamente');
      fetchClientes();
      fetchVehiculos();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const handleToggleActivo = async (cliente: Cliente) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ activo: !cliente.activo })
        .eq('id', cliente.id);

      if (error) throw error;
      toast.success(cliente.activo ? 'Cliente desactivado' : 'Cliente activado');
      fetchClientes();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      telefono: '',
      dni: '',
      tipo_cliente: 'por_hora',
    });
    setEditingCliente(null);
  };

  const openEditDialog = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      dni: cliente.dni || '',
      tipo_cliente: cliente.tipo_cliente,
    });
    setDialogOpen(true);
  };

  const getVehiculosDelCliente = (clienteId: string) => {
    return vehiculos.filter(v => v.cliente_id === clienteId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando clientes...</p>
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Gestión de Clientes</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto" size="sm">
                <Plus className="w-4 h-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_cliente">Tipo de Cliente *</Label>
                  <Select
                    value={formData.tipo_cliente}
                    onValueChange={(value: 'mensual' | 'por_hora') => 
                      setFormData({ ...formData, tipo_cliente: value })
                    }
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
                  {editingCliente ? 'Actualizar' : 'Crear'} Cliente
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes ({clientes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Vehículos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No hay clientes registrados. Cree el primer cliente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientes.map((cliente) => {
                      const vehiculosCliente = getVehiculosDelCliente(cliente.id);
                      return (
                        <TableRow key={cliente.id}>
                          <TableCell className="font-medium">{cliente.nombre}</TableCell>
                          <TableCell>{cliente.dni || '-'}</TableCell>
                          <TableCell>{cliente.telefono || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={cliente.tipo_cliente === 'mensual' ? 'default' : 'secondary'}>
                              {cliente.tipo_cliente === 'mensual' ? 'Mensual' : 'Por Hora'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CarIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{vehiculosCliente.length}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={cliente.activo ? 'default' : 'secondary'}
                              onClick={() => handleToggleActivo(cliente)}
                            >
                              {cliente.activo ? 'Activo' : 'Inactivo'}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(cliente)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(cliente.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
      </main>
    </div>
  );
}
