export type ShippingZone = {
  id: string;
  title: string;
  towns?: string;
  rates: string[];
};

// Tarifas facilitadas por la floristería. Se conservan literalmente.
export const shippingZones: ShippingZone[] = [
  {
    id: "san-fernando",
    title: "San Fernando de Henares",
    rates: ["Pedidos hasta 25€: 6€ de portes.", "Pedidos superiores a 35€: Envío incluido."],
  },
  {
    id: "limitrofes",
    title: "Pueblos Limítrofes",
    towns: "Vicálvaro, Torrejón de Ardoz, Coslada",
    rates: [
      "Pedidos hasta 55€: 9€ de portes.",
      "Pedidos superiores a 55€: Envío gratuito (Porte incluido).",
    ],
  },
  {
    id: "cercanas",
    title: "Otras Localidades Cercanas",
    towns: "Paracuellos de Jarama, Alcalá de Henares, Mejorada del Campo",
    rates: [
      "Pedidos hasta 55€: 14,50€ de portes.",
      "Pedidos superiores a 55€: Envío gratuito (Porte incluido).",
    ],
  },
  {
    id: "madrid",
    title: "Madrid Capital",
    rates: ["Pedidos hasta 110€: 18€ de portes.", "Pedidos superiores a 120€: Envío incluido"],
  },
];

export const shippingConditions = [
  "Pedido mínimo 25 euros coste incluido.",
  "Los envíos superiores a 35 coste incluido.",
  "Los pedidos 120 euros el envío incluido.",
];
