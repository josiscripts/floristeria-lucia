import imgBodas from "@/assets/bodas.jpg";
import imgEventos from "@/assets/cat-eventos.jpg";
import imgDecoracion from "@/assets/cat-decoracion.jpg";
import imgPlantas from "@/assets/cat-plantas.jpg";
import imgRamos from "@/assets/cat-ramos.jpg";
import imgRosasEternas from "@/assets/cat-rosas-eternas.jpg";
import imgCondolencias from "@/assets/cat-condolencias.jpg";

/**
 * Servicios: contenido que NO se vende como producto estándar porque necesita
 * contacto, personalización, intervención de la floristería o presupuesto.
 * Todo lo que había dentro de "Catálogo → Bodas y eventos", las composiciones
 * florales sobre base y los arreglos para eventos se han reubicado aquí.
 */
export type ServiceId =
  | "bodas"
  | "eventos"
  | "rosas-eternas"
  | "arreglos-eventos"
  | "encargos-personalizados"
  | "composiciones-personalizadas"
  | "condolencias-personalizadas";

export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  image: string;
  /** Precio de referencia orientativo; el precio final se confirma con la floristería. */
  fromPrice?: number;
};

export type Service = {
  id: ServiceId;
  label: string;
  blurb: string;
  intro: string;
  image: string;
  /** Destino personalizado si el servicio tiene una ruta propia fuera de /servicios/$slug. */
  to?: string;
  /** Configurador de personalización asociado, si procede. */
  builder?: "composicion" | "encargo";
  items: ServiceItem[];
};

export const services: Service[] = [
  {
    id: "bodas",
    label: "Bodas",
    blurb: "Ramo de novia, prendidos, tocados y decoración del enlace.",
    intro:
      "Diseñamos y coordinamos la flor de tu boda de principio a fin: ramo de novia, prendidos y tocados, decoración de ceremonia, centros de mesa y ambientación de espacios. Trabajamos con un diseño personalizado según tu paleta de color, la flor de temporada y el estilo del enlace, con asesoramiento previo y montaje el día del evento.",
    image: imgBodas,
    items: [
      {
        id: "ramo-novia",
        name: "Ramo de novia",
        description:
          "Ramo de novia diseñado a medida, con la flor, el color y el estilo que quieras para tu día.",
        image: imgBodas,
      },
      {
        id: "pulseras-flores",
        name: "Pulseras y prendidos de flores",
        description:
          "Pulseras y prendidos de flor natural para madrinas, damas e invitadas.",
        image: imgBodas,
      },
      {
        id: "corona-cabeza",
        name: "Corona de flores para la cabeza",
        description: "Corona o tocado de flor natural hecho a medida.",
        image: imgBodas,
      },
      {
        id: "flores-jarrones-boda",
        name: "Flores en jarrones",
        description: "Jarrones con flor natural para mesas, altar y espacios del enlace.",
        image: imgBodas,
      },
      {
        id: "decoracion-coche-boda",
        name: "Decoración floral del automóvil",
        description:
          "Decoración de la parte delantera del coche y detalles florales del vehículo.",
        image: imgBodas,
      },
    ],
  },
  {
    id: "eventos",
    label: "Eventos",
    blurb: "Aniversarios, empresas, presentaciones y celebraciones.",
    intro:
      "Flor natural y planta para celebraciones privadas y corporativas: aniversarios, comuniones, bautizos, presentaciones, inauguraciones y escaparates. Estudiamos el espacio, la paleta y el presupuesto antes de proponer el diseño.",
    image: imgEventos,
    items: [
      {
        id: "flores-evento",
        name: "Flores para eventos y celebraciones",
        description: "Centros y composiciones para aniversarios, empresas y presentaciones.",
        image: imgEventos,
      },
      {
        id: "decoracion-puerta",
        name: "Decoración de puerta",
        description: "Decoración floral de puertas y accesos para fechas señaladas.",
        image: imgDecoracion,
      },
      {
        id: "decoracion-espacios",
        name: "Decoración de espacios",
        description: "Escaparates, locales y espacios vestidos con flor natural y planta.",
        image: imgDecoracion,
      },
    ],
  },
  {
    id: "rosas-eternas",
    label: "Rosas eternas",
    blurb: "Rosas naturales preservadas que mantienen su belleza durante años.",
    intro:
      "Rosas naturales preservadas que conservan su forma y color durante años, sin agua ni luz. Un detalle duradero y especial para quienes buscan un regalo que perdure en el tiempo, elegante en cualquier espacio y ocasión.",
    image: imgRosasEternas,
    to: "/rosas-eternas",
    items: [
      {
        id: "caja-rosas-eternas",
        name: "Caja de Rosas Eternas",
        description: "Rosa natural preservada en caja de regalo, disponible en varios tamaños.",
        image: imgRosasEternas,
      },
      {
        id: "caja-romantica",
        name: "Caja Romántica",
        description: "Rosas preservadas con acabado romántico y lazo de satén.",
        image: imgRosasEternas,
      },
      {
        id: "cupido",
        name: "Cupido",
        description: "Corazón de rosas eternas, un diseño ideal para sorprender.",
        image: imgRosasEternas,
      },
      {
        id: "pecera-rosa-eterna",
        name: "Pecera Rosa Eterna",
        description: "Rosa preservada bajo cúpula de cristal, un detalle perfecto.",
        image: imgRosasEternas,
      },
    ],
  },
  {
    id: "arreglos-eventos",
    label: "Arreglos florales para eventos",
    blurb: "Centros de mesa y arreglos coordinados con tu celebración.",
    intro:
      "Arreglos florales pensados para un evento concreto: medidas, alturas, jarrones y flor coordinada con el espacio. No son ramos prediseñados, por lo que necesitamos conocer tus necesidades antes de presupuestar.",
    image: imgEventos,
    items: [
      {
        id: "centros-mesa-evento",
        name: "Centros de mesa",
        description: "Centros de mesa en jarrón o base, coordinados con tu celebración.",
        image: imgEventos,
      },
      {
        id: "arreglos-altura",
        name: "Arreglos de altura y ambientación",
        description:
          "Estructuras y arreglos de altura para entradas, altares y zonas fotográficas.",
        image: imgDecoracion,
      },
      {
        id: "arreglos-corporativos",
        name: "Arreglos corporativos periódicos",
        description:
          "Flor fresca renovada para recepciones, hoteles y oficinas con periodicidad acordada.",
        image: imgEventos,
      },
    ],
  },
  {
    id: "encargos-personalizados",
    label: "Encargos personalizados",
    blurb: "Cuéntanos qué necesitas y lo preparamos a medida.",
    intro:
      "Si lo que buscas no encaja en un producto del catálogo, lo preparamos bajo encargo. Indícanos la ocasión, la flor o los colores que prefieres, el presupuesto aproximado y la fecha de entrega, y te confirmamos el diseño.",
    image: imgRamos,
    builder: "encargo",
    items: [
      {
        id: "ramo-a-medida",
        name: "Ramo a medida",
        description:
          "Ramo diseñado con la flor, el color y el tamaño que elijas. También puedes configurarlo tú mismo en «Personalizar mi ramo».",
        image: imgRamos,
      },
      {
        id: "regalo-empresa",
        name: "Regalos de empresa",
        description: "Detalles florales personalizados para clientes y equipos.",
        image: imgEventos,
      },
      {
        id: "suscripcion-flor",
        name: "Flor fresca periódica",
        description: "Entregas recurrentes de flor de temporada para casa o negocio.",
        image: imgRamos,
      },
    ],
  },
  {
    id: "composiciones-personalizadas",
    label: "Composiciones personalizadas",
    blurb: "Composiciones sobre cofre, cajón, góndola, caja o regadera.",
    intro:
      "Composiciones florales montadas sobre una base decorativa. Cada pieza se monta a mano con la flor disponible del día, por lo que el precio de referencia se confirma según la flor, el tamaño y los colores elegidos.",
    image: imgPlantas,
    builder: "composicion",
    items: [
      {
        id: "cofre-pirata-blanco",
        name: "Cofre Pirata Blanco",
        description: "Cofre de madera blanca con composición floral.",
        image: imgPlantas,
        fromPrice: 58,
      },
      {
        id: "cajon-floral",
        name: "Cajón Floral",
        description: "Cajón de madera con flor y planta combinadas.",
        image: imgPlantas,
        fromPrice: 30,
      },
      {
        id: "regadera-madera",
        name: "Regadera Madera",
        description: "Regadera decorativa con composición floral.",
        image: imgPlantas,
        fromPrice: 45,
      },
      {
        id: "cofre-floral",
        name: "Cofre Floral",
        description: "Cofre de madera con flor fresca de temporada.",
        image: imgPlantas,
        fromPrice: 48,
      },
      {
        id: "gondola",
        name: "Góndola",
        description: "Composición alargada ideal para mesas y recibidores.",
        image: imgPlantas,
        fromPrice: 40,
      },
      {
        id: "paraiso-floral",
        name: "Paraíso Floral",
        description: "Composición frondosa con flor y verdes variados.",
        image: imgPlantas,
        fromPrice: 45,
      },
      {
        id: "primavera-floral",
        name: "Primavera Floral",
        description: "Colores de primavera en composición sobre base natural.",
        image: imgPlantas,
        fromPrice: 45,
      },
      {
        id: "caja-mykonos",
        name: "Caja Mykonos",
        description: "Caja en blanco y azul con flor de temporada.",
        image: imgPlantas,
        fromPrice: 50,
      },
      {
        id: "caja-santorini",
        name: "Caja Santorini",
        description: "Inspiración mediterránea con flor fresca y verdes.",
        image: imgPlantas,
        fromPrice: 55,
      },
    ],
  },
  {
    id: "condolencias-personalizadas",
    label: "Condolencias personalizadas",
    blurb: "Piezas de despedida a medida del espacio y del homenaje.",
    intro:
      "Cuando la pieza de condolencia necesita una medida especial, una flor concreta o una dedicatoria particular, la preparamos bajo encargo con atención inmediata por teléfono. Los productos de condolencia con precio fijo están disponibles en el catálogo.",
    image: imgCondolencias,
    items: [
      {
        id: "condolencia-medida",
        name: "Piezas a medida",
        description:
          "Cruces, aros, murales y centros adaptados a la medida del tanatorio, iglesia o cementerio.",
        image: imgCondolencias,
      },
      {
        id: "condolencia-dedicatoria",
        name: "Cinta de dedicatoria",
        description:
          "Cinta de dedicatoria incluida en los productos de condolencia de 60 € o más; en encargos a medida la incluimos siempre.",
        image: imgCondolencias,
      },
      {
        id: "condolencia-urgente",
        name: "Entrega urgente",
        description:
          "Coordinamos la entrega en tanatorio o ceremonia el mismo día cuando es posible.",
        image: imgCondolencias,
      },
    ],
  },
];

export function findService(id: string) {
  return services.find((s) => s.id === id);
}

/** Redirecciones de categorías antiguas del catálogo hacia el servicio correspondiente. */
export const legacyCategoryToService: Record<string, ServiceId> = {
  "bodas-eventos": "bodas",
  bodas: "bodas",
  eventos: "eventos",
  composiciones: "composiciones-personalizadas",
};
