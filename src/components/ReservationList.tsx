import React from 'react';
import { Clock, User, FileText } from 'lucide-react';
import type { Room, TimeSlot, Reservation } from '../types/reservation';

interface ReservationListProps {
  reservations: Reservation[];
  rooms: Room[];
  timeSlots: TimeSlot[];
}

export function ReservationList({ reservations, rooms, timeSlots }: ReservationListProps) {
  const getRoomName = (roomId: number) => {
    return rooms.find(room => room.id === roomId)?.name || 'Sala no encontrada';
  };

  const getTimeSlot = (timeSlotId: number) => {
    return timeSlots.find(slot => slot.id === timeSlotId);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Reservas del día
        </h3>
      </div>
      <div className="border-t border-gray-200">
        {reservations.length === 0 ? (
          <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
            No hay reservas para este día
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reservations.map((reservation) => {
              const timeSlot = getTimeSlot(reservation.time_slot_id);
              return (
                <li key={reservation.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-indigo-600">
                        {getRoomName(reservation.room_id)}
                      </h4>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <p>
                          {timeSlot ? `${timeSlot.start} - ${timeSlot.end}` : 'Horario no disponible'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <User className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <p>{reservation.user_id}</p>
                      </div>
                      {reservation.groups && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Users className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          <p>Grupos: {reservation.groups}</p>
                        </div>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <FileText className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <p>{reservation.purpose}</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}