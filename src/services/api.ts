import { SERVER_CONFIG } from '../config';
import type { Room, TimeSlot, Reservation, ServerLog } from '../types/reservation';

export async function getServerLogs(): Promise<ServerLog[]> {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/logs`);
    if (!response.ok) {
      throw new Error('Error al obtener los logs del servidor');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching server logs:', error);
    throw error;
  }
}

export async function getRooms(): Promise<Room[]> {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/rooms`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || 'Error al cargar las salas');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al cargar las salas');
  }
}

export async function getTimeSlots(): Promise<TimeSlot[]> {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/time-slots`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al cargar los horarios' }));
      throw new Error(errorData.error || 'Error al cargar los horarios');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching time slots:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al cargar los horarios');
  }
}

export async function getReservations(date: Date): Promise<Reservation[]> {
  try {
    const formattedDate = date.toISOString().split('T')[0];
    const response = await fetch(
      `${SERVER_CONFIG.BASE_URL}/api/reservations?date=${encodeURIComponent(formattedDate)}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Reservations data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}

export async function createReservation(
  roomId: number,
  timeSlotId: number,
  date: Date,
  userId: string,
  purpose: string,
  groups?: string
): Promise<Reservation> {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        room_id: roomId,
        time_slot_id: timeSlotId,
        date: date.toISOString().split('T')[0],
        user_id: userId,
        purpose,
        groups
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || 'Error al procesar la reserva');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

export async function createRoom(name: string, capacity: number, building: string): Promise<Room> {
  try {
    const capacityNum = parseInt(String(capacity), 10);
    const trimmedName = name.trim();
    const trimmedBuilding = building.trim();
    
    if (!trimmedName || !capacity || !trimmedBuilding) {
      throw new Error('Todos los campos son requeridos');
    }
    
    if (isNaN(capacityNum) || capacityNum <= 0) {
      throw new Error('La capacidad debe ser un número positivo');
    }

    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        name: trimmedName, 
        capacity: capacityNum, 
        building: trimmedBuilding 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || 'Error al crear la sala');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al crear la sala');
  }
}

export async function updateRoom(id: number, name: string, capacity: number, building: string): Promise<Room> {
  try {
    const capacityNum = parseInt(String(capacity), 10);
    const trimmedName = name.trim();
    const trimmedBuilding = building.trim();
    
    if (!id || !trimmedName || !capacity || !trimmedBuilding) {
      throw new Error('Todos los campos son requeridos');
    }
    
    if (isNaN(capacityNum) || capacityNum <= 0) {
      throw new Error('La capacidad debe ser un número positivo');
    }

    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/rooms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        name: trimmedName, 
        capacity: capacityNum, 
        building: trimmedBuilding 
      }),
    });
    
    if (response.status === 404) {
      throw new Error('Sala no encontrada');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Error al procesar la respuesta del servidor' 
      }));
      throw new Error(errorData.error || 'Error al actualizar la sala');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating room:', error);
    throw error instanceof Error ? error : new Error('Error al actualizar la sala');
  }
}

export async function deleteRoom(id: number): Promise<void> {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/rooms/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      if (response.status === 404) {
        throw new Error('Sala no encontrada');
      }
      if (response.status === 400) {
        throw new Error('No se puede eliminar la sala porque tiene reservas asociadas');
      }
      throw new Error(errorData.error || 'Error al eliminar la sala');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting room:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al eliminar la sala');
  }
}

export async function createTimeSlot(
  start: string,
  end: string,
  days: string[]
): Promise<TimeSlot> {
  try {
    if (!start || !end || !Array.isArray(days)) {
      throw new Error('Hora de inicio, fin y días son requeridos');
    }

    if (days.length === 0) {
      throw new Error('Debe seleccionar al menos un día');
    }

    const daysJson = JSON.stringify(days);

    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/time-slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        start, 
        end, 
        days: daysJson
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || 'Error al crear el horario');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating time slot:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al crear el horario');
  }
}

export async function updateTimeSlot(id: number, start: string, end: string, days: string[]): Promise<TimeSlot> {
  try {
    if (!start || !end || !Array.isArray(days) || days.length === 0) {
      throw new Error('Hora de inicio, fin y días son requeridos');
    }

    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/time-slots/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        start, 
        end, 
        days: JSON.stringify(days) 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || 'Error al actualizar el horario');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating time slot:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al actualizar el horario');
  }
}

export async function deleteTimeSlot(id: number): Promise<void> {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/time-slots/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      if (response.status === 404) {
        throw new Error('Horario no encontrado');
      }
      if (response.status === 400) {
        throw new Error('No se puede eliminar el horario porque tiene reservas asociadas');
      }
      throw new Error(errorData.error || 'Error al eliminar el horario');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting time slot:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al eliminar el horario');
  }
}