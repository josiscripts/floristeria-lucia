import { useState } from "react";
import { ColorVariant } from "~/integrations/supabase/types";

interface ColorVariantsSectionProps {
  colors: ColorVariant[];
  onAdd: (color: string) => void;
  onDelete: (colorId: string) => void;
}

export default function ColorVariantsSection({ colors, onAdd, onDelete }: ColorVariantsSectionProps) {
  const [newColorName, setNewColorName] = useState("");

  const handleAddColor = () => {
    if (!newColorName.trim()) {
      alert("Ingrese un nombre de color");
      return;
    }

    onAdd(newColorName);
    setNewColorName("");
  };

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-semibold">Variantes de Color</legend>

      <div className="space-y-2">
        {colors.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay colores agregados aún.</p>
        ) : (
          <ul className="space-y-2">
            {colors.map((color) => (
              <li
                key={color.id}
                className="flex justify-between items-center p-3 bg-gray-50 border border-gray-300 rounded-md"
              >
                <div>
                  <p className="font-medium">{color.name}</p>
                  <p className="text-sm text-gray-500">Orden: {color.sort_order}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(color.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-gray-300 rounded-md p-4 space-y-3">
        <h3 className="font-semibold">Agregar Nuevo Color</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddColor();
              }
            }}
            placeholder="ej: Rojo, Rosa, Blanco"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            type="button"
            onClick={handleAddColor}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Agregar Color
          </button>
        </div>
      </div>
    </fieldset>
  );
}
