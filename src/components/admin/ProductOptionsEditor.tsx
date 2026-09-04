import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

import type { Tables } from "@/integrations/supabase/types";

type ProductOption = Tables<"product_options">;

interface ProductOption {
  id: string;
  name: string;
  price_amount: number | string;
  discount_percent: number | string;
  stock_quantity: number | null;
  sku?: string | null;
}

interface ProductOptionsEditorProps {
  options: ProductOption[];
  onOptionsChange: (options: ProductOption[]) => void;
}

export function ProductOptionsEditor({
  options,
  onOptionsChange,
}: ProductOptionsEditorProps) {
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const [newOptionDiscount, setNewOptionDiscount] = useState("0");
  const [newOptionStock, setNewOptionStock] = useState("");

  const calculateFinalPrice = (amount: number, discount: number): number => {
    return amount * (1 - discount / 100);
  };

  const handleAddOption = () => {
    if (!newOptionName.trim() || !newOptionPrice) {
      alert("Por favor ingresa el nombre y precio de la opción");
      return;
    }

    const price = parseFloat(newOptionPrice);
    const discount = parseFloat(newOptionDiscount) || 0;

    if (isNaN(price) || price < 0) {
      alert("Por favor ingresa un precio válido");
      return;
    }

    if (discount < 0 || discount > 100) {
      alert("El descuento debe estar entre 0 y 100");
      return;
    }

    const newOption: ProductOption = {
      id: `temp-${Date.now()}-${Math.random()}`,
      name: newOptionName.trim(),
      price_amount: price,
      discount_percent: discount,
      stock_quantity: newOptionStock ? parseInt(newOptionStock) : null,
      sku: null,
    };

    onOptionsChange([...options, newOption]);

    // Reset form
    setNewOptionName("");
    setNewOptionPrice("");
    setNewOptionDiscount("0");
    setNewOptionStock("");
  };

  const handleUpdateOption = (
    id: string,
    updates: Partial<ProductOption>
  ) => {
    onOptionsChange(
      options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt))
    );
  };

  const handleDeleteOption = (id: string) => {
    onOptionsChange(options.filter((opt) => opt.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddOption();
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Precio (€)</TableHead>
              <TableHead className="text-right">Descuento (%)</TableHead>
              <TableHead className="text-right">Precio Final (€)</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay opciones. Agrega una a continuación.
                </TableCell>
              </TableRow>
            ) : (
              options.map((option) => {
                const priceAmount = parseFloat(String(option.price_amount));
                const discountPct = parseFloat(String(option.discount_percent)) || 0;
                const finalPrice = calculateFinalPrice(priceAmount, discountPct);

                return (
                  <TableRow key={option.id}>
                    <TableCell>
                      <Input
                        type="text"
                        value={option.name}
                        onChange={(e) =>
                          handleUpdateOption(option.id, { name: e.target.value })
                        }
                        placeholder="ej: Básico, Premium"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceAmount}
                        onChange={(e) =>
                          handleUpdateOption(option.id, {
                            price_amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPct}
                        onChange={(e) =>
                          handleUpdateOption(option.id, {
                            discount_percent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {finalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={option.stock_quantity ?? ""}
                        onChange={(e) =>
                          handleUpdateOption(option.id, {
                            stock_quantity: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                        placeholder="Sin tracking"
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {option.sku || "(Auto)"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOption(option.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Card className="p-4 space-y-4 bg-muted/30">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Agregar Nueva Opción</h3>
          <p className="text-xs text-muted-foreground">
            Agrega opciones como tamaños, tipos o variantes de tu producto
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-option-name" className="text-xs">
              Nombre *
            </Label>
            <Input
              id="new-option-name"
              type="text"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ej: 12 Rosas"
              size="sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-option-price" className="text-xs">
              Precio (€) *
            </Label>
            <Input
              id="new-option-price"
              type="number"
              step="0.01"
              min="0"
              value={newOptionPrice}
              onChange={(e) => setNewOptionPrice(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="45.00"
              size="sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-option-discount" className="text-xs">
              Descuento (%)
            </Label>
            <Input
              id="new-option-discount"
              type="number"
              min="0"
              max="100"
              value={newOptionDiscount}
              onChange={(e) => setNewOptionDiscount(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="0"
              size="sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-option-stock" className="text-xs">
              Stock (opcional)
            </Label>
            <Input
              id="new-option-stock"
              type="number"
              min="0"
              value={newOptionStock}
              onChange={(e) => setNewOptionStock(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Sin tracking"
              size="sm"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAddOption}
          className="w-full"
          variant="secondary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Opción
        </Button>
      </Card>
    </div>
  );
}
