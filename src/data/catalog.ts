import imgRamos from "@/assets/cat-ramos.jpg";
import imgGirasoles from "@/assets/girasoles.jpg";
import imgPlantas from "@/assets/cat-plantas.jpg";
import imgRosasEternas from "@/assets/cat-rosas-eternas.jpg";
import imgComplementos from "@/assets/cat-complementos.jpg";
import imgCondolencias from "@/assets/cat-condolencias.jpg";

/**
 * El catálogo contiene ÚNICAMENTE productos comprables.
 * Bodas, eventos, arreglos para eventos, composiciones personalizadas,
 * encargos y condolencias personalizadas viven en `src/data/services.ts`.
 */
export type CategoryId =
  | "ramos"
  | "plantas"
  | "rosas-eternas"
  | "complementos"
  | "condolencias";

export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  priceMin: number;
  priceMax?: number;
  image: string;
  description: string;
  badge?: string;
  quoteOnly?: boolean;
  /** Cuando la cantidad representa rosas: incrementos de 6 (1 = 6 rosas). */
  roseStep?: number;
  /** Colores disponibles para personalizar el producto. */
  colors?: string[];
};

export const categories: {
  id: CategoryId;
  label: string;
  headline?: string;
  blurb: string;
  image: string;
}[] = [
  {
    id: "ramos",
    label: "Ramos y arreglos florales",
    headline: "Ramos y arreglos florales que enamoran",
    blurb: "Ramos de temporada montados a mano cada mañana.",
    image: imgRamos,
  },
  {
    id: "plantas",
    label: "Plantas y Composiciones",
    blurb: "Plantas de interior, orquídeas y cestas de planta para regalar y decorar.",
    image: imgPlantas,
  },
  {
    id: "rosas-eternas",
    label: "Rosas eternas",
    blurb: "Flor natural preservada que dura entre 7 y 10 años.",
    image: imgRosasEternas,
  },
  {
    id: "complementos",
    label: "Complementos",
    blurb: "Bombones, vino, queso, frutas, globos, jarrones y peluches.",
    image: imgComplementos,
  },
  {
    id: "condolencias",
    label: "Condolencias",
    blurb: "Cruces, ramos, murales y aros de flores para despedidas.",
    image: imgCondolencias,
  },
];

export const categoryLabels: Record<CategoryId, string> = {
  ramos: "Ramos y arreglos florales",
  plantas: "Plantas y Composiciones",
  "rosas-eternas": "Rosas eternas",
  complementos: "Complementos",
  condolencias: "Condolencias",
};

export const roseColors = [
  "Rojo",
  "Rosa",
  "Blanco",
  "Azul",
  "Lila",
  "Amarillo",
] as const;

export const products: Product[] = [
  // Ramos (producto de compra directa)
  {
    id: "ramo-silvestre",
    name: "Ramo Silvestre",
    category: "ramos",
    priceMin: 30,
    priceMax: 45,
    image: imgRamos,
    description: "Flor variada de temporada con aire campestre y mucho movimiento.",
  },
  {
    id: "ramo-felicidad",
    name: "Ramo Felicidad",
    category: "ramos",
    priceMin: 35,
    priceMax: 50,
    image: imgRamos,
    description: "Tonos luminosos en rosa y blanco para celebrar buenas noticias.",
    badge: "Más vendido",
  },
  {
    id: "ramo-alegria",
    name: "Ramo Alegría",
    category: "ramos",
    priceMin: 35,
    priceMax: 50,
    image: imgRamos,
    description: "Colores vivos y contrastados, un ramo que se ve desde lejos.",
  },
  {
    id: "ramo-girasoles",
    name: "Ramo de Girasoles",
    category: "ramos",
    priceMin: 30,
    priceMax: 45,
    image: imgGirasoles,
    description: "Girasoles frescos combinados con verdes de temporada.",
  },
  {
    id: "ramo-belleza",
    name: "Ramo Belleza",
    category: "ramos",
    priceMin: 30,
    priceMax: 45,
    image: imgRamos,
    description: "Composición romántica en gamas rosadas y blancas.",
  },
  {
    id: "ramo-rosas",
    name: "Ramo de Rosas",
    category: "ramos",
    priceMin: 24,
    priceMax: 48,
    image: imgRamos,
    description:
      "Ramo de rosas frescas. La cantidad se monta en múltiplos de 6 rosas (1 = 6 rosas).",
    roseStep: 6,
    colors: [...roseColors],
  },

  // Plantas (producto de compra directa)
  {
    id: "anthurium",
    name: "Anthurium",
    category: "plantas",
    priceMin: 25,
    image: imgPlantas,
    description: "Planta de interior de flor duradera y hoja brillante.",
  },
  {
    id: "taza-plantas",
    name: "Taza de Plantas",
    category: "plantas",
    priceMin: 36,
    priceMax: 60,
    image: imgPlantas,
    description: "Composición de plantas variadas en taza de cerámica.",
  },
  {
    id: "cesta-mimbre",
    name: "Cesta de Mimbre",
    category: "plantas",
    priceMin: 60,
    image: imgPlantas,
    description: "Cesta de mimbre natural con plantas de interior surtidas.",
  },
  {
    id: "cesta-blanca-mimbre",
    name: "Cesta Blanca de Mimbre",
    category: "plantas",
    priceMin: 45,
    image: imgPlantas,
    description: "Mimbre lacado en blanco con composición de plantas.",
  },
  {
    id: "banera-ceramica",
    name: "Bañera Cerámica",
    category: "plantas",
    priceMin: 35,
    image: imgPlantas,
    description: "Jardinera de cerámica con plantas de interior.",
  },
  {
    id: "orquidea-azul",
    name: "Orquídea Azul",
    category: "plantas",
    priceMin: 30,
    image: imgPlantas,
    description: "Phalaenopsis teñida en azul, muy decorativa.",
  },
  {
    id: "orquidea",
    name: "Orquídea",
    category: "plantas",
    priceMin: 30,
    image: imgPlantas,
    description: "Orquídea Phalaenopsis en maceta decorativa.",
  },
  {
    id: "denrobium",
    name: "Denrobium",
    category: "plantas",
    priceMin: 28,
    image: imgPlantas,
    description: "Orquídea Dendrobium de floración abundante.",
  },
  {
    id: "centro-orquideas-variadas",
    name: "Centro de Orquídeas Variadas",
    category: "plantas",
    priceMin: 80,
    image: imgPlantas,
    description: "Centro de gran formato con varias orquídeas y verdes.",
    badge: "Premium",
  },
  {
    id: "centro-orquidea-blanca",
    name: "Centro Orquídea Blanca",
    category: "plantas",
    priceMin: 80,
    image: imgPlantas,
    description: "Centro elegante de orquídea blanca sobre base natural.",
  },
  {
    id: "cesta-rosa",
    name: "Cesta Rosa",
    category: "plantas",
    priceMin: 25,
    image: imgPlantas,
    description: "Cesta en tonos rosados con planta de temporada.",
  },
  {
    id: "bonsai-ficus-ginseng",
    name: "Bonsái Ficus Ginseng",
    category: "plantas",
    priceMin: 25,
    image: imgPlantas,
    description: "Bonsái de interior resistente y de fácil cuidado.",
  },
  {
    id: "calathea",
    name: "Calathea",
    category: "plantas",
    priceMin: 35,
    image: imgPlantas,
    description: "Planta de hoja decorativa para interiores luminosos.",
  },

  // Rosas eternas
  {
    id: "caja-rosas-eternas",
    name: "Caja de Rosas Eternas",
    category: "rosas-eternas",
    priceMin: 40,
    priceMax: 85,
    image: imgRosasEternas,
    description: "Rosa natural preservada en caja de regalo. Disponible en varios tamaños.",
    badge: "7-10 años",
    roseStep: 6,
    colors: [...roseColors],
  },
  {
    id: "caja-romantica",
    name: "Caja Romántica",
    category: "rosas-eternas",
    priceMin: 45,
    priceMax: 75,
    image: imgRosasEternas,
    description: "Rosas preservadas con acabado romántico y lazo de satén.",
    roseStep: 6,
    colors: [...roseColors],
  },
  {
    id: "cupido",
    name: "Cupido",
    category: "rosas-eternas",
    priceMin: 55,
    priceMax: 85,
    image: imgRosasEternas,
    description: "Corazón de rosas eternas, nuestro diseño más regalado.",
    roseStep: 6,
    colors: [...roseColors],
  },
  {
    id: "pecera-rosa-eterna",
    name: "Pecera Rosa Eterna",
    category: "rosas-eternas",
    priceMin: 22,
    image: imgRosasEternas,
    description: "Rosa preservada bajo cúpula de cristal, un detalle perfecto.",
    colors: [...roseColors],
  },

  // Complementos
  {
    id: "jarron-cristal-1",
    name: "Jarrón de Cristal Nº 1",
    category: "complementos",
    priceMin: 1.5,
    image: imgComplementos,
    description: "Jarrón de cristal pequeño para tu ramo.",
  },
  {
    id: "jarron-cristal-2",
    name: "Jarrón de Cristal Nº 2",
    category: "complementos",
    priceMin: 5,
    image: imgComplementos,
    description: "Jarrón de cristal de mayor tamaño.",
  },
  {
    id: "chocolate-belga-pequena",
    name: "Chocolate Belga Caja Pequeña",
    category: "complementos",
    priceMin: 12.5,
    image: imgComplementos,
    description: "Bombones belgas surtidos en caja pequeña.",
  },
  {
    id: "chocolate-belga-grande",
    name: "Chocolate Belga Caja Grande",
    category: "complementos",
    priceMin: 15,
    image: imgComplementos,
    description: "Bombones belgas surtidos en caja grande.",
  },
  {
    id: "oso-peluche",
    name: "Oso de Peluche",
    category: "complementos",
    priceMin: 12.5,
    image: imgComplementos,
    description: "Osito de peluche suave para acompañar el regalo.",
  },
  {
    id: "oso-peluche-corazon",
    name: "Oso de Peluche Corazón",
    category: "complementos",
    priceMin: 12,
    image: imgComplementos,
    description: "Osito de peluche con corazón bordado.",
  },
  {
    id: "macetero-violeta-orquidea",
    name: "Macetero Violeta Orquídea",
    category: "complementos",
    priceMin: 4.5,
    image: imgComplementos,
    description: "Macetero decorativo en tono violeta para orquídea.",
  },
  {
    id: "macetero-blanco-orquidea",
    name: "Macetero Blanco Orquídea",
    category: "complementos",
    priceMin: 4.5,
    image: imgComplementos,
    description: "Macetero decorativo blanco para orquídea.",
  },
  {
    id: "piruletas",
    name: "Piruletas",
    category: "complementos",
    priceMin: 3,
    image: imgComplementos,
    description: "Piruletas artesanales de colores.",
  },
  {
    id: "vino-seleccion",
    name: "Botella de vino",
    category: "complementos",
    priceMin: 12,
    priceMax: 25,
    image: imgComplementos,
    description: "Botella de vino seleccionada para acompañar tu ramo o cesta.",
  },
  {
    id: "tabla-quesos",
    name: "Selección de quesos",
    category: "complementos",
    priceMin: 15,
    priceMax: 28,
    image: imgComplementos,
    description: "Quesos artesanos para convertir el detalle en una cesta regalo.",
  },
  {
    id: "cesta-frutas",
    name: "Frutas de temporada",
    category: "complementos",
    priceMin: 18,
    priceMax: 35,
    image: imgComplementos,
    description: "Frutas frescas de temporada combinadas con flor natural.",
  },
  {
    id: "globos-ocasion",
    name: "Globos",
    category: "complementos",
    priceMin: 4,
    priceMax: 12,
    image: imgComplementos,
    description: "Globos de helio y globos de número para cumpleaños y celebraciones.",
  },

  // Condolencias (productos)
  {
    id: "cruz-flores",
    name: "Cruz de flores",
    category: "condolencias",
    priceMin: 90,
    image: imgCondolencias,
    description: "Cruz de flor natural para tanatorio, iglesia o cementerio.",
  },
  {
    id: "ramo-condolencias",
    name: "Ramo de condolencias",
    category: "condolencias",
    priceMin: 60,
    image: imgCondolencias,
    description: "Ramo sobrio de flor natural para acompañar en la despedida.",
  },
  {
    id: "mural-flores",
    name: "Mural de flores para pared",
    category: "condolencias",
    priceMin: 150,
    image: imgCondolencias,
    description: "Mural floral para pared, diseñado a la medida del espacio.",
  },
  {
    id: "ramos-bancas-iglesia",
    name: "Ramos para bancas de iglesia",
    category: "condolencias",
    priceMin: 45,
    image: imgCondolencias,
    description: "Ramos para las bancas y centros para las esquinas de la mesa de la iglesia.",
  },
  {
    id: "aro-flores",
    name: "Aro de flores",
    category: "condolencias",
    priceMin: 110,
    image: imgCondolencias,
    description: "Aro o corona circular de flor natural para homenajes y despedidas.",
  },
];

export const campaigns = [
  {
    id: "navidad",
    title: "Campaña de Navidad",
    text: "Centros de mesa, coronas y flor de Pascua para toda la casa. Reserva con antelación.",
    dates: "Diciembre",
  },
  {
    id: "san-valentin",
    title: "San Valentín",
    text: "Rosas rojas, cajas de rosas eternas y detalles para el 14 de febrero.",
    dates: "14 de febrero",
  },
  {
    id: "dia-de-la-madre",
    title: "Día de la Madre",
    text: "Ramos, plantas y composiciones especiales con entrega el primer domingo de mayo.",
    dates: "Mayo",
  },
];

export const sizeLabels = ["Estándar", "Especial", "Premium"] as const;

/**
 * Cinta decorativa (condolencias). Lógica centralizada para catálogo,
 * ficha de producto y carrito: 5 € salvo que el importe llegue a 60 €.
 */
export const RIBBON_MIN_PRICE = 60;
export const RIBBON_PRICE = 5;

/** ¿El producto admite cinta decorativa como complemento? */
export function supportsRibbon(product: Product): boolean {
  return product.category === "condolencias" && !product.quoteOnly;
}

/** La cinta es gratuita cuando el importe del pedido alcanza el umbral. */
export function isRibbonFree(subtotal: number): boolean {
  return subtotal >= RIBBON_MIN_PRICE;
}

/** Coste de la cinta para un importe dado (0 € cuando es de cortesía). */
export function ribbonCost(subtotal: number): number {
  return isRibbonFree(subtotal) ? 0 : RIBBON_PRICE;
}

export function priceTiers(product: Product): { label: string; price: number }[] {
  if (product.quoteOnly) return [];
  if (product.priceMax === undefined || product.priceMax === product.priceMin) {
    return [{ label: "Estándar", price: product.priceMin }];
  }
  const mid = Math.round(((product.priceMin + product.priceMax) / 2) * 2) / 2;
  return [
    { label: "Estándar", price: product.priceMin },
    { label: "Especial", price: mid },
    { label: "Premium", price: product.priceMax },
  ];
}

export function formatPrice(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

export function priceRangeLabel(product: Product) {
  if (product.quoteOnly) return "Presupuesto a medida";
  if (product.priceMax === undefined || product.priceMax === product.priceMin) {
    return formatPrice(product.priceMin);
  }
  return `${formatPrice(product.priceMin)} – ${formatPrice(product.priceMax)}`;
}

export function findProduct(id: string) {
  return products.find((p) => p.id === id);
}
