import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import type { Room, TimeSlot, ServerLog } from '../types/reservation';
import { LogViewer } from './LogViewer';
import { 
  createRoom, updateRoom, deleteRoom, 
  createTimeSlot, updateTimeSlot, deleteTimeSlot,
  getServerLogs 
} from '../services/api';

interface AdminPanelProps {
  rooms: Room[];
  timeSlots: TimeSlot[];
  onRoomsChange: (rooms: Room[]) => void;
  onTimeSlotsChange: (timeSlots: TimeSlot[]) => void;
}

export function AdminPanel({ rooms, timeSlots, onRoomsChange, onTimeSlotsChange }: AdminPanelProps) {
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', building: '' });
  const [newTimeSlot, setNewTimeSlot] = useState({ 
    start: '', 
    end: '', 
    selectedDays: ['L', 'M', 'X', 'J', 'V'] 
  });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingTimeSlot, setEditingTimeSlot] = useState<(TimeSlot & { selectedDays: string[] }) | null>(null);
  const buildings = ['Edificio 1', 'Edificio 2', 'Edificio 3'];
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<ServerLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const serverLogs = await getServerLogs();
        setLogs(serverLogs);
      } catch (error) {
        console.error('Error al obtener logs:', error);
      }
    };

    if (showLogs) {
      fetchLogs();
      // Actualizar logs cada 5 segundos mientras estén visibles
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [showLogs]);

  const handleAddRoom = async () => {
    try {
      if (!newRoom.name || !newRoom.capacity || !newRoom.building) {
        throw new Error('El nombre, la capacidad y el edificio son requeridos');
      }
      const room = await createRoom(newRoom.name, parseInt(newRoom.capacity), newRoom.building);
      onRoomsChange([...rooms, room]);
      setNewRoom({ name: '', capacity: '', building: '' });
    } catch (error) {
      console.error('Error al crear sala:', error);
      alert(error instanceof Error ? error.message : 'Error al crear la sala');
    }
  };

  const handleUpdateRoom = async (room: Room) => {
    try {
      if (!room.name || !room.capacity || !room.building) {
        alert('El nombre, la capacidad y el edificio son requeridos');
        return;
      }

      const updatedRoom = await updateRoom(room.id, room.name, room.capacity, room.building);
      onRoomsChange(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
      setEditingRoom(null);
    } catch (error) {
      console.error('Error al actualizar sala:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar la sala. Por favor, inténtelo de nuevo.');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      await deleteRoom(id);
      onRoomsChange(rooms.filter(room => room.id !== id));
    } catch (error) {
      console.error('Error al eliminar sala:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la sala');
    }
  };

  const weekDays = [
    { id: 'L', label: 'Lunes' },
    { id: 'M', label: 'Martes' },
    { id: 'X', label: 'Miércoles' },
    { id: 'J', label: 'Jueves' },
    { id: 'V', label: 'Viernes' }
  ];

  const toggleDay = (day: string) => {
    setNewTimeSlot(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const handleAddTimeSlot = async () => {
    try {
      if (!newTimeSlot.start || !newTimeSlot.end || newTimeSlot.selectedDays.length === 0) {
        alert('La hora de inicio, fin y al menos un día son requeridos');
        return;
      }
      
      if (newTimeSlot.start >= newTimeSlot.end) {
        alert('La hora de inicio debe ser anterior a la hora de fin');
        return;
      }
      
      const timeSlot = await createTimeSlot(
        newTimeSlot.start, 
        newTimeSlot.end,
        newTimeSlot.selectedDays.sort()
      );
      
      onTimeSlotsChange([...timeSlots, timeSlot]);
      setNewTimeSlot({ start: '', end: '', selectedDays: ['L', 'M', 'X', 'J', 'V'] });
    } catch (error) {
      console.error('Error al crear horario:', error);
      alert(error instanceof Error ? error.message : 'Error al crear el horario');
    }
  };

  const toggleEditDay = (day: string) => {
    if (!editingTimeSlot) return;
    setEditingTimeSlot(prev => ({
      ...prev!,
      selectedDays: prev!.selectedDays.includes(day)
        ? prev!.selectedDays.filter(d => d !== day)
        : [...prev!.selectedDays, day]
    }));
  };

  const handleUpdateTimeSlot = async (timeSlot: TimeSlot) => {
    try {
      if (!timeSlot.start || !timeSlot.end || !timeSlot.selectedDays || timeSlot.selectedDays.length === 0) {
        alert('La hora de inicio, fin y días son requeridos');
        return;
      }
      
      if (timeSlot.start >= timeSlot.end) {
        alert('La hora de inicio debe ser anterior a la hora de fin');
        return;
      }
      
      const updatedTimeSlot = await updateTimeSlot(
        timeSlot.id,
        timeSlot.start,
        timeSlot.end,
        timeSlot.selectedDays.sort()
      );
      
      onTimeSlotsChange(timeSlots.map(t => t.id === updatedTimeSlot.id ? updatedTimeSlot : t));
      setEditingTimeSlot(null);
    } catch (error) {
      console.error('Error al actualizar horario:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar el horario');
    }
  };

  const handleDeleteTimeSlot = async (id: number) => {
    try {
      if (!confirm('¿Está seguro de que desea eliminar este horario?')) {
        return;
      }
      
      await deleteTimeSlot(id);
      onTimeSlotsChange(timeSlots.filter(slot => slot.id !== id));
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar el horario');
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Principal */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Panel de Administración</h2>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {showLogs ? (
              <>
                Ocultar Logs <ChevronUp className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Ver Logs <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {showLogs && (
          <div className="mb-6">
            <LogViewer logs={logs} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gestión de Salas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Gestión de Salas</h3>
            
            {/* Formulario para nueva sala */}
            <div className="space-y-3 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la sala"
                  className="flex-1 px-3 py-2 border rounded-md"
                  value={newRoom.name}
                  onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Capacidad"
                  className="w-24 px-3 py-2 border rounded-md"
                  value={newRoom.capacity}
                  onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })}
                />
              </div>
              <select
                value={newRoom.building}
                onChange={e => setNewRoom({ ...newRoom, building: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-white"
              >
                <option value="">Seleccione un edificio</option>
                {buildings.map((building, index) => (
                  <option key={`building-option-${index}`} value={building}>{building}</option>
                ))}
              </select>
              <button
                onClick={handleAddRoom}
                className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 inline mr-2" />
                Agregar Sala
              </button>
            </div>

            {/* Lista de salas */}
            <div className="space-y-2">
              {rooms.map(room => (
                <div key={room.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  {editingRoom?.id === room.id ? (
                    <>
                      <input
                        type="text"
                        className="w-1/3 px-2 py-1 border rounded"
                        value={editingRoom.name}
                        onChange={e => setEditingRoom({ ...editingRoom, name: e.target.value })}
                      />
                      <input
                        type="number"
                        className="w-24 px-2 py-1 border rounded"
                        value={editingRoom.capacity}
                        onChange={e => setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) })}
                      />
                      <select
                        value={editingRoom.building}
                        onChange={e => setEditingRoom({ ...editingRoom, building: e.target.value })}
                        className="w-1/3 px-2 py-1 border rounded bg-white"
                      >
                        {buildings.map((building, index) => (
                          <option key={`edit-building-${editingRoom.id}-${index}`} value={building}>{building}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleUpdateRoom(editingRoom)}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">{room.name}</span>
                      <span className="text-sm text-gray-500">Cap: {room.capacity}</span>
                      <span className="text-sm text-gray-500">{room.building}</span>
                      <button
                        onClick={() => setEditingRoom(room)}
                        className="p-1 text-gray-600 hover:text-gray-700"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gestión de Horarios */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Gestión de Horarios</h3>
            
            {/* Formulario para nuevo horario */}
            <div className="space-y-4 mb-4">
              <div className="flex gap-2">
                <input
                  type="time"
                  className="flex-1 px-3 py-2 border rounded-md"
                  required
                  value={newTimeSlot.start}
                  onChange={e => setNewTimeSlot({ ...newTimeSlot, start: e.target.value })}
                />
                <input
                  type="time"
                  className="flex-1 px-3 py-2 border rounded-md"
                  required
                  value={newTimeSlot.end}
                  onChange={e => setNewTimeSlot({ ...newTimeSlot, end: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de la semana
                </label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        newTimeSlot.selectedDays.includes(day.id)
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleAddTimeSlot}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Horario
                </button>
              </div>
            </div>

            {/* Lista de horarios */}
            <div className="space-y-2">
              {timeSlots.map(slot => (
                <div key={slot.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  {editingTimeSlot?.id === slot.id ? (
                    <>
                      <input
                        type="time"
                        className="flex-1 px-2 py-1 border rounded"
                        value={editingTimeSlot.start}
                        onChange={e => setEditingTimeSlot({ ...editingTimeSlot, start: e.target.value })}
                      />
                      <input
                        type="time"
                        className="flex-1 px-2 py-1 border rounded"
                        value={editingTimeSlot.end}
                        onChange={e => setEditingTimeSlot({ ...editingTimeSlot, end: e.target.value })}
                      />
                      <div className="flex gap-1">
                        {weekDays.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleEditDay(day.id)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              editingTimeSlot.selectedDays.includes(day.id)
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {day.id}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleUpdateTimeSlot(editingTimeSlot)}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div>{slot.start} - {slot.end}</div>
                        <div className="text-sm text-gray-500">{
                          (() => {
                            try {
                              return JSON.parse(slot.days).join(', ');
                            } catch (e) {
                              return 'L, M, X, J, V';
                            }
                          })()
                        }</div>
                      </div>
                      <button
                        onClick={() => setEditingTimeSlot({
                          ...slot,
                          selectedDays: (() => {
                            try {
                              return JSON.parse(slot.days);
                            } catch (e) {
                              return ['L', 'M', 'X', 'J', 'V'];
                            }
                          })()
                        })}
                        className="p-1 text-gray-600 hover:text-gray-700"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTimeSlot(slot.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}