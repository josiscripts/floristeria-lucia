import imgBodas from "@/assets/imagen_bodas.jpg";
import imgEventos from "@/assets/imagen_eventos.webp";
import imgDecoracion from "@/assets/cat-decoracion.jpg";
import imgPlantas from "@/assets/cat-plantas.jpg";
import imgRamos from "@/assets/cat-ramos.jpg";
import imgRosasEternas from "@/assets/cat-rosas-eternas.jpg";
import imgCondolencias from "@/assets/cat-condolencias.jpg";
import jarronRamo from "@/assets/jarron_ramo.png";
import coronaFlores from "@/assets/corona_flores.png";
import pulseraFlores from "@/assets/pulsera_flores.png";
import ramoBoda from "@/assets/ramo_boda.png";
import automovilBoda from "@/assets/automovil_boda.png";
import decoracionCentros from "@/assets/decoracion_centros.jpg";
import decoracionPuerta from "@/assets/decoracion_puerta.jpg";
import decoracionEspacios from "@/assets/decoracion_espacios.png";

/**
 * Servicios: contenido que NO se vende como producto estándar porque necesita
 * contacto, personalización, intervención de la floristería o presupuesto.
 * Todo lo que había dentro de "Catálogo → Bodas y eventos", las composiciones
 * florales sobre base y los arreglos para eventos se han reubicado aquí.
 */
export type ServiceId = "bodas" | "eventos";

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
        image: ramoBoda,
      },
      {
        id: "pulseras-flores",
        name: "Pulseras y prendidos de flores",
        description: "Pulseras y prendidos de flor natural para madrinas, damas e invitadas.",
        image: pulseraFlores,
      },
      {
        id: "corona-cabeza",
        name: "Corona de flores para la cabeza",
        description: "Corona o tocado de flor natural hecho a medida.",
        image: coronaFlores,
      },
      {
        id: "flores-jarrones-boda",
        name: "Flores en jarrones",
        description: "Jarrones con flor natural para mesas, altar y espacios del enlace.",
        image: jarronRamo,
      },
      {
        id: "decoracion-coche-boda",
        name: "Decoración floral del automóvil",
        description: "Decoración de la parte delantera del coche y detalles florales del vehículo.",
        image: automovilBoda,
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
        id: "centros-composiciones",
        name: "Centros y composiciones",
        description:
          "Composiciones florales diseñadas a medida para aniversarios, celebraciones empresariales y eventos especiales, con flor de temporada y diseño personalizado.",
        image: decoracionCentros,
      },
      {
        id: "entradas-accesos",
        name: "Entradas y accesos",
        description:
          "Decoración floral personalizada para entradas, puertas y accesos de eventos, celebraciones y espacios, realzando la primera impresión con flor natural.",
        image: decoracionPuerta,
      },
      {
        id: "ambientacion-espacios",
        name: "Ambientación de espacios",
        description:
          "Ambientación floral completa de espacios, locales, escaparates y zonas de eventos, transformando el ambiente con diseño floral de impacto.",
        image: decoracionEspacios,
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
};
