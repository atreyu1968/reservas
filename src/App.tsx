import React from 'react';
import { useState, useEffect } from 'react';
import { BuildingSelector } from './components/BuildingSelector';
import { BuildingView } from './components/BuildingView';
import { DatePicker } from './components/DatePicker';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { ReservationModal, type ReservationFormData } from './components/ReservationModal';
import type { Room, TimeSlot, Reservation } from './types/reservation';
import { getRooms, getTimeSlots, getReservations, createReservation } from './services/api';

function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    room?: Room;
    timeSlot?: TimeSlot;
  }>({
    isOpen: false
  });

  useEffect(() => {
    // Fetch rooms and time slots on component mount
    async function fetchInitialData() {
      try {
        setError(null);
        const [roomsData, timeSlotsData] = await Promise.all([
          getRooms(),
          getTimeSlots()
        ]);
        setRooms(roomsData);
        setTimeSlots(timeSlotsData);
      } catch (error) {
        setError('Error al cargar los datos. Por favor, recargue la página.');
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Fetch reservations when date changes
    async function fetchReservations() {
      try {
        setError(null);
        const data = await getReservations(selectedDate);
        setReservations(data);
      } catch (error) {
        setError('Error al cargar las reservas. Por favor, inténtelo de nuevo más tarde.');
      }
    }
    fetchReservations();
  }, [selectedDate]);

  const handleReserveClick = (roomId: number, timeSlotId: number) => {
    const room = rooms.find(r => r.id === roomId);
    const timeSlot = timeSlots.find(t => t.id === timeSlotId);
    if (room && timeSlot) {
      setModalData({ isOpen: true, room, timeSlot });
    }
  };

  const handleReserveSubmit = async (formData: ReservationFormData) => {
    if (!modalData.room || !modalData.timeSlot) return;

    setError(null);
    try {
      const newReservation = await createReservation(
        modalData.room.id,
        modalData.timeSlot.id,
        selectedDate,
        formData.email,
        formData.proposito,
        formData.grupos
      );
      setReservations([...reservations, newReservation]);
      setModalData({ isOpen: false });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear la reserva');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-white">
                Sistema de Reserva de Salas
              </h1>
            </div>
            <button
              className="px-4 py-2 text-white border-2 border-white rounded-md hover:bg-white hover:text-blue-600 transition-colors disabled:opacity-50"
              onClick={() => {
                if (showAdmin && isAdminAuthenticated) {
                  setIsAdminAuthenticated(false);
                }
                setShowAdmin(!showAdmin);
              }}
            >
              {showAdmin ? 'Ver Reservas' : 'Administración'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAdmin ? (
          isAdminAuthenticated ? (
            <AdminPanel
              rooms={rooms}
              timeSlots={timeSlots}
              onRoomsChange={setRooms}
              onTimeSlotsChange={setTimeSlots}
            />
          ) : (
            <AdminLogin onLogin={setIsAdminAuthenticated} />
          )
        ) : (
          <div className="space-y-6">
            <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
            
            <BuildingSelector
              rooms={rooms}
              selectedBuilding={selectedBuilding}
              onBuildingSelect={setSelectedBuilding}
            />

            {error && (
              <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
                <p className="text-sm">
                  {error}
                </p>
              </div>
            )}

            {selectedBuilding ? (
              <BuildingView
                selectedBuilding={selectedBuilding}
                rooms={rooms}
                timeSlots={timeSlots}
                reservations={reservations}
                selectedDate={selectedDate}
                onReserve={handleReserveClick}
              />
            ) : (
              <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-md">
                Seleccione un edificio para ver las salas disponibles
              </div>
            )}
          </div>
        )}
        {modalData.isOpen && modalData.room && modalData.timeSlot && (
          <ReservationModal
            isOpen={modalData.isOpen}
            onClose={() => setModalData({ isOpen: false })}
            onSubmit={handleReserveSubmit}
            room={modalData.room}
            timeSlot={modalData.timeSlot}
          />
        )}
      </main>
    </div>
  );
}

export default App;