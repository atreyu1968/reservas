import React from 'react';
import { Building2 } from 'lucide-react';
import type { Room } from '../types/reservation';

interface BuildingSelectorProps {
  rooms: Room[];
  selectedBuilding: string | null;
  onBuildingSelect: (building: string) => void;
}

export function BuildingSelector({ rooms, selectedBuilding, onBuildingSelect }: BuildingSelectorProps) {
  const buildings = Array.from(new Set(rooms.map(room => room.building)));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <Building2 className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">
          Seleccione un Edificio
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {buildings.map((building) => (
          <button
            key={building}
            onClick={() => onBuildingSelect(building)}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedBuilding === building
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-400'
            }`}
          >
            {building}
          </button>
        ))}
      </div>
    </div>
  );
}