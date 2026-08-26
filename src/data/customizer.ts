import { roseColors } from "@/data/catalog";

/**
 * Elementos disponibles para los configuradores de personalización
 * (ramo personalizado, composiciones personalizadas y encargos).
 */
export type BuilderKind = "ramo" | "composicion" | "encargo";

export type BuilderElement = {
  id: string;
  name: string;
  /** Precio por unidad (o por bloque cuando `step` > 1). */
  price?: number;
  /** Incremento de unidades. Las rosas se montan en múltiplos de 6. */
  step: number;
  unit: "rosas" | "tallos" | "unidad";
  colors?: string[];
  /** El precio final necesita confirmación de la floristería. */
  quoteOnly?: boolean;
  kinds: BuilderKind[];
};

export const builderElements: BuilderElement[] = [
  {
    id: "rosas",
    name: "Rosas",
    price: 3.5,
    step: 6,
    unit: "rosas",
    colors: [...roseColors],
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "rosas-eternas",
    name: "Rosas eternas (preservadas)",
    price: 7,
    step: 6,
    unit: "rosas",
    colors: [...roseColors],
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "gerberas",
    name: "Gerberas",
    price: 2.5,
    step: 1,
    unit: "tallos",
    colors: ["Rojo", "Rosa", "Blanco", "Amarillo", "Naranja"],
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "lilium",
    name: "Lilium",
    price: 4,
    step: 1,
    unit: "tallos",
    colors: ["Blanco", "Rosa", "Amarillo"],
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "girasoles",
    name: "Girasoles",
    price: 3.8,
    step: 1,
    unit: "tallos",
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "hortensia",
    name: "Hortensia",
    price: 6.5,
    step: 1,
    unit: "tallos",
    colors: ["Azul", "Blanco", "Rosa", "Lila"],
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "flor-temporada",
    name: "Flor de temporada (elección de la floristería)",
    step: 1,
    unit: "tallos",
    quoteOnly: true,
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "verdes",
    name: "Verdes y follaje",
    price: 1.5,
    step: 1,
    unit: "tallos",
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "base-cofre",
    name: "Base: cofre de madera",
    price: 18,
    step: 1,
    unit: "unidad",
    kinds: ["composicion"],
  },
  {
    id: "base-cajon",
    name: "Base: cajón de madera",
    price: 14,
    step: 1,
    unit: "unidad",
    kinds: ["composicion"],
  },
  {
    id: "base-gondola",
    name: "Base: góndola",
    price: 16,
    step: 1,
    unit: "unidad",
    kinds: ["composicion"],
  },
  {
    id: "base-regadera",
    name: "Base: regadera decorativa",
    price: 15,
    step: 1,
    unit: "unidad",
    kinds: ["composicion"],
  },
  {
    id: "jarron",
    name: "Jarrón de cristal",
    price: 5,
    step: 1,
    unit: "unidad",
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "bombones",
    name: "Bombones belgas",
    price: 12.5,
    step: 1,
    unit: "unidad",
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "peluche",
    name: "Peluche",
    price: 12.5,
    step: 1,
    unit: "unidad",
    kinds: ["ramo", "composicion", "encargo"],
  },
  {
    id: "cinta-dedicatoria",
    name: "Cinta de dedicatoria",
    price: 0,
    step: 1,
    unit: "unidad",
    kinds: ["ramo", "composicion", "encargo"],
  },
];

export function elementsFor(kind: BuilderKind) {
  return builderElements.filter((e) => e.kinds.includes(kind));
}
