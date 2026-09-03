import type { LocaleBundle } from "../types";

export const coverage: LocaleBundle = {
  es: {
    searchPlaceholder: "Escribe tu población: Coslada, Loeches, Madrid…",
    searchAriaLabel: "Buscar población con servicio de entrega",
    noResults:
      "No entregamos con reparto propio en esa población. Llámanos y buscamos una solución.",
    results: "{{count}} poblaciones con servicio de entrega propio.",
  },
  en: {
    searchPlaceholder: "Type your town: Coslada, Loeches, Madrid…",
    searchAriaLabel: "Search for a town with delivery service",
    noResults:
      "We don't deliver with our own fleet to that town. Call us and we'll find a solution.",
    results: "{{count}} towns with our own delivery service.",
  },
  ca: {
    searchPlaceholder: "Escriu la teva població: Coslada, Loeches, Madrid…",
    searchAriaLabel: "Cercar població amb servei de lliurament",
    noResults:
      "No fem lliurament amb repartiment propi en aquesta població. Truca'ns i buscarem una solució.",
    results: "{{count}} poblacions amb servei de lliurament propi.",
  },
};
