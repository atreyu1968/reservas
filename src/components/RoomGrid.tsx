import React from 'react';
import { Calendar, Users } from 'lucide-react';
import type { Room, TimeSlot, Reservation } from '../types/reservation';
import { formatDate } from '../utils/date';

interface RoomGridProps {
  rooms: Room[];
  timeSlots: TimeSlot[];
  reservations: Reservation[];
  selectedDate: Date;
  onReserve: (roomId: number, timeSlotId: number) => void;
}

export function RoomGrid({ rooms, timeSlots, reservations, selectedDate, onReserve }: RoomGridProps) {
  if (!Array.isArray(rooms) || !Array.isArray(timeSlots) || !Array.isArray(reservations)) {
    console.error('Invalid data provided to RoomGrid:', { rooms, timeSlots, reservations });
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-md">
        Error al cargar los datos. Por favor, inténtelo de nuevo.
      </div>
    );
  }

  const isSlotReserved = (roomId: number, timeSlotId: number) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    return reservations.some(
      (res) =>
        res.room_id === roomId &&
        res.time_slot_id === timeSlotId &&
        res.date === formattedDate
    );
  };

  const getDayCode = (date: Date): string => {
    const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    return days[date.getDay()];
  };

  const availableTimeSlots = timeSlots.filter(slot => {
    const dayCode = getDayCode(selectedDate);
    try {
      const days = typeof slot.days === 'string' ? JSON.parse(slot.days) : ['L', 'M', 'X', 'J', 'V'];
      return days.includes(dayCode);
    } catch (error) {
      console.error('Error parsing days:', error);
      return ['L', 'M', 'X', 'J', 'V'].includes(dayCode); // Default to weekdays if parsing fails
    }
  });

  if (availableTimeSlots.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-md">
        No hay horarios disponibles para {getDayCode(selectedDate)}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sala
                </th>
                {availableTimeSlots.map((slot) => (
                  <th
                    key={slot.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {slot.start} - {slot.end}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {room.name}
                    <span className="text-gray-500 text-xs block">
                      <Users className="h-4 w-4 inline mr-1" />
                      Capacidad: {room.capacity}
                    </span>
                  </td>
                  {availableTimeSlots.map((slot) => {
                    const reserved = isSlotReserved(room.id, slot.id);
                    return (
                      <td
                        key={slot.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {reserved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Reservado
                          </span>
                        ) : (
                          <button
                            onClick={() => onReserve(room.id, slot.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
                          >
                            <Calendar className="mr-1 h-4 w-4" />
                            Reservar
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}