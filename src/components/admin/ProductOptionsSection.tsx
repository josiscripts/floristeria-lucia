import { useState } from "react";
import { ProductOption } from "~/integrations/supabase/types";

interface ProductOptionsSectionProps {
  options: ProductOption[];
  onAdd: (option: ProductOption) => void;
  onUpdate: (optionId: string, option: Partial<ProductOption>) => void;
  onDelete: (optionId: string) => void;
  category?: string;
}

export default function ProductOptionsSection({
  options,
  onAdd,
  onUpdate,
  onDelete,
}: ProductOptionsSectionProps) {
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const [newOptionDiscount, setNewOptionDiscount] = useState("0");
  const [newOptionStock, setNewOptionStock] = useState("");

  const handleAddOption = () => {
    if (!newOptionName.trim() || !newOptionPrice) {
      alert("Ingrese nombre y precio");
      return;
    }

    const price = parseFloat(newOptionPrice);
    const discount = parseFloat(newOptionDiscount) || 0;
    const priceFinal = price * (1 - discount / 100);

    const newOption: ProductOption = {
      id: `temp-${Date.now()}`,
      product_id: "",
      ghl_price_id: null,
      name: newOptionName,
      price_amount: price.toString() as any,
      discount_percent: discount.toString() as any,
      price_final: priceFinal.toString() as any,
      stock_quantity: newOptionStock ? parseInt(newOptionStock) : null,
      sku: null,
      sort_order: options.length,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    onAdd(newOption);
    setNewOptionName("");
    setNewOptionPrice("");
    setNewOptionDiscount("0");
    setNewOptionStock("");
  };

  const calculateFinalPrice = (amount: number, discount: number) => {
    return amount * (1 - discount / 100);
  };

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-semibold">Opciones de Producto *</legend>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Precio €</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Desc. %</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Precio Final €</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Stock</th>
              <th className="border border-gray-300 px-3 py-2 text-left">SKU</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {options.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border border-gray-300 px-3 py-2 text-center text-gray-500"
                >
                  No hay opciones. Agrega una abajo.
                </td>
              </tr>
            ) : (
              options.map((option) => {
                const priceAmount = parseFloat(option.price_amount.toString());
                const discountPct = parseFloat(option.discount_percent.toString());
                const finalPrice = calculateFinalPrice(priceAmount, discountPct);

                return (
                  <tr key={option.id}>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) => onUpdate(option.id, { name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={priceAmount}
                        onChange={(e) => {
                          const newPrice = parseFloat(e.target.value);
                          onUpdate(option.id, {
                            price_amount: newPrice.toString() as any,
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPct}
                        onChange={(e) => {
                          const newDiscount = parseFloat(e.target.value);
                          onUpdate(option.id, {
                            discount_percent: newDiscount.toString() as any,
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                      {finalPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={option.stock_quantity || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          onUpdate(option.id, { stock_quantity: value });
                        }}
                        placeholder="Sin tracking"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">
                      {option.sku || "(Generado al guardar)"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDelete(option.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-gray-300 rounded-md p-4 space-y-3">
        <h3 className="font-semibold">Agregar Nueva Opción</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              placeholder="ej: Básico, Premium"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Precio €</label>
            <input
              type="number"
              step="0.01"
              value={newOptionPrice}
              onChange={(e) => setNewOptionPrice(e.target.value)}
              placeholder="45.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descuento %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={newOptionDiscount}
              onChange={(e) => setNewOptionDiscount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock (opcional)</label>
            <input
              type="number"
              min="0"
              value={newOptionStock}
              onChange={(e) => setNewOptionStock(e.target.value)}
              placeholder="Sin tracking"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddOption}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Agregar Opción
        </button>
      </div>
    </fieldset>
  );
}
