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
    rates: ["Pedido mínimo: 25€: +6€ de portes.", "Pedidos superiores a 35€: Envío gratuito."],
  },
  {
    id: "limitrofes",
    title: "Pueblos Limítrofes",
    towns: "Torrejón de Ardoz, Coslada",
    rates: [
      "Pedido mínimo: 25€: +11€ de portes.",
      "Pedidos superiores a 55€: Envío gratuito (Porte incluido).",
    ],
  },
  {
    id: "cercanas",
    title: "Otras Localidades",
    towns: "Vicálvaro, Paracuellos de Jarama, Alcalá de Henares, Mejorada del Campo, Parque Corredor",
    rates: [
      "Pedido mínimo: 25€: +16€ de portes.",
      "Pedidos superiores a 55€: Envío gratuito (Porte incluido).",
    ],
  },
  {
    id: "madrid",
    title: "Madrid Capital",
    rates: ["Pedido mínimo: 25€: +20€ de portes.", "Pedidos superiores a 120€: Envío gratuito"],
  },
];

export const shippingConditions = [
  "Pedido mínimo 25 euros coste incluido.",
];
