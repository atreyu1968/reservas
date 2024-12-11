import React, { useState } from 'react';
import { Calendar, ClipboardList } from 'lucide-react';
import type { Room, TimeSlot, Reservation } from '../types/reservation';
import { RoomGrid } from './RoomGrid';
import { ReservationList } from './ReservationList';

interface BuildingViewProps {
  selectedBuilding: string;
  rooms: Room[];
  timeSlots: TimeSlot[];
  reservations: Reservation[];
  selectedDate: Date;
  onReserve: (roomId: number, timeSlotId: number) => void;
}

export function BuildingView({ 
  selectedBuilding,
  rooms,
  timeSlots,
  reservations,
  selectedDate,
  onReserve
}: BuildingViewProps) {
  const [activeTab, setActiveTab] = useState<'reserve' | 'list'>('reserve');
  const buildingRooms = rooms.filter(room => room.building === selectedBuilding);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('reserve')}
          className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'reserve'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="h-5 w-5 mr-2" />
          Reservar Sala
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'list'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList className="h-5 w-5 mr-2" />
          Ver Reservas
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'reserve' ? (
          <RoomGrid
            rooms={buildingRooms}
            timeSlots={timeSlots}
            reservations={reservations}
            selectedDate={selectedDate}
            onReserve={onReserve}
          />
        ) : (
          <ReservationList
            reservations={reservations.filter(res => {
              const room = rooms.find(r => r.id === res.room_id);
              return room?.building === selectedBuilding;
            })}
            rooms={rooms}
            timeSlots={timeSlots}
          />
        )}
      </div>
    </div>
  );
}