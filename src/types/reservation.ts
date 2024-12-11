export interface Room {
  id: number;
  name: string;
  capacity: number;
  building: string;
}

export interface TimeSlot {
  id: number;
  start: string;
  end: string;
  days: string;
}

export interface Reservation {
  id: number;
  room_id: number;
  time_slot_id: number;
  date: string;
  user_id: string;
  purpose: string;
  groups?: string;
}

export interface ServerLog {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
  details?: string;
}