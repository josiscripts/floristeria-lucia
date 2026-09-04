import type { LocaleBundle } from "../types";

export const pages: LocaleBundle = {
  es: {
    preserved: {
      badge: "Flor preservada",
      title: "Rosas Eternas",
      titleHighlight: "que duran años",
      intro:
        "Son rosas naturales, no artificiales. Un proceso de preservación sustituye su savia por una solución vegetal que mantiene el tacto y el color del pétalo entre 7 y 10 años, sin agua y sin necesidad de luz.",
      ctaSeeCollection: "Ver colección",
      ctaCustomBox: "Personalizar una caja",
      howTitle: "Cómo se preserva una rosa",
      step: "Paso {{n}}",
      steps: {
        selected: {
          title: "Rosa natural seleccionada",
          text: "Partimos de rosa fresca de corte premium, elegida en su punto óptimo de apertura.",
        },
        sap: {
          title: "Sustitución de la savia",
          text: "La savia se reemplaza por una solución vegetal que mantiene la textura y flexibilidad del pétalo.",
        },
        noLight: {
          title: "Sin agua ni luz directa",
          text: "No necesita riego ni sol. Basta mantenerla en interior, alejada de la humedad.",
        },
        lifespan: {
          title: "Entre 7 y 10 años de vida",
          text: "Conserva su aspecto natural durante años, por eso es el regalo más duradero de la tienda.",
        },
      },
      faq: {
        careQ: "¿Qué cuidados necesita?",
        careA:
          "Ninguno especial: no se riega ni se pulveriza. Manténla en interior, evita la humedad alta y la luz solar directa, y quita el polvo con un pincel suave o aire frío.",
        colorQ: "¿Puedo elegir el color y la dedicatoria?",
        colorA:
          "Sí. Trabajamos rojo, rosa, blanco, nude y tonos especiales, y podemos grabar o rotular iniciales y dedicatorias en la caja. Llámanos al 91 882 68 37 para verlo contigo.",
        durationQ: "¿Realmente duran de 7 a 10 años?",
        durationA:
          "Sí, siempre que se respeten las condiciones de conservación. Con el paso del tiempo el tono puede matizarse ligeramente, algo natural en la flor preservada.",
      },
      collectionTitle: "Colección de rosas eternas",
      imgAlt: "Caja negra con rosas eternas preservadas en tono fucsia",
    },
    shipping: {
      badge: "San Fernando de Henares, Madrid",
      title: "Envíos y cobertura",
      intro:
        "Repartimos con vehículo propio en hasta 12 poblaciones para que la flor llegue en perfecto estado, con detalles y composiciones únicas y personalizadas. Consulta tu población en el buscador; si no aparece, llámanos al {{phone}} y estudiamos la entrega.",
      quote: "Una flor dice mucho: un infinito floral.",
      statLabelTop: "Poblaciones",
      statLabelBottom: "con reparto",
      placesBadge: "Dónde llegamos",
      cards: {
        ownDelivery: {
          title: "Reparto propio",
          text: "Sin mensajería externa en la zona de cobertura: la flor viaja en nuestras manos.",
        },
        sameDay: {
          title: "Mismo día",
          text: "Pedidos confirmados por la mañana con entrega en el día según disponibilidad.",
        },
        securePayment: {
          title: "Pago seguro",
          text: "Tarjeta con pasarela SSL o transferencia. IVA incluido.",
        },
      },
      placesTitle: "Lugares de envíos",
      placesIntro:
        "Nuestra zona de reparto comprende 12 poblaciones entre Madrid y Guadalajara, con entrega propia para que cada flor llegue en perfecto estado.",
      placesQuote: "Entregamos con cuidado, cercanía y dedicación.",
      placesStrip: "12 poblaciones con servicio de entrega propio",
      placesNote:
        "Si tu población no aparece en la lista y estás cerca de nuestra zona, escríbenos y estudiaremos tu entrega personalizada.",
      placesContact: "Contactar",
      ratesTitle: "Tarifas de envío",
      ratesIntro: "Consulta las condiciones de entrega según la zona de reparto.",
      rateRows: {
        "san-fernando": {
          name: "San Fernando de Henares",
          sub: "Entrega con reparto propio.",
          conditions: ["Pedidos hasta 25 €", "Pedidos superiores a 35 €"],
          results: ["6 € de portes", "Envío incluido"],
        },
        limitrofes: {
          name: "Pueblos Limítrofes",
          sub: "Vicálvaro, Torrejón de Ardoz, Coslada",
          conditions: ["Pedidos hasta 55 €", "Pedidos superiores a 55 €"],
          results: ["9 € de portes", "Envío gratuito"],
        },
        cercanas: {
          name: "Otras Localidades Cercanas",
          sub: "Paracuellos de Jarama, Alcalá de Henares, Mejorada del Campo",
          conditions: ["Pedidos hasta 55 €", "Pedidos superiores a 55 €"],
          results: ["14,50 € de portes", "Envío gratuito"],
        },
        madrid: {
          name: "Madrid Capital",
          sub: "Entrega con reparto propio.",
          conditions: ["Pedidos hasta 110 €", "Pedidos superiores a 120 €"],
          results: ["18 € de portes", "Envío incluido"],
        },
      },
      generalItems: {
        min: { amount: "25 €", label: "Coste incluido", note: "Pedido mínimo" },
        s35: { amount: "35 €", label: "Envío incluido", note: "En pedidos superiores a 35 €." },
        s120: { amount: "120 €", label: "Envío incluido", note: "En pedidos superiores a 120 €." },
      },
      towns: "Localidades",
      conditionsTitle: "Condiciones generales",
      zones: {
        "san-fernando": {
          title: "San Fernando de Henares",
          rates: ["Pedidos hasta 25€: 6€ de portes.", "Pedidos superiores a 35€: Envío incluido."],
        },
        limitrofes: {
          title: "Pueblos Limítrofes",
          towns: "Vicálvaro, Torrejón de Ardoz, Coslada",
          rates: [
            "Pedidos hasta 55€: 9€ de portes.",
            "Pedidos superiores a 55€: Envío gratuito (Porte incluido).",
          ],
        },
        cercanas: {
          title: "Otras Localidades Cercanas",
          towns: "Paracuellos de Jarama, Alcalá de Henares, Mejorada del Campo",
          rates: [
            "Pedidos hasta 55€: 14,50€ de portes.",
            "Pedidos superiores a 55€: Envío gratuito (Porte incluido).",
          ],
        },
        madrid: {
          title: "Madrid Capital",
          rates: [
            "Pedidos hasta 110€: 18€ de portes.",
            "Pedidos superiores a 120€: Envío incluido",
          ],
        },
      },
      conditions: [
        "Pedido mínimo 25 euros coste incluido.",
        "Los envíos superiores a 35 coste incluido.",
        "Los pedidos 120 euros el envío incluido.",
      ],
    },
    about: {
      badge: "Sobre nosotros",
      title: "Flores, plantas",
      titleHighlight: "y emociones",
      intro:
        "Somos una floristería que se adapta a todos los gustos y necesidades de nuestros clientes. Ofrecemos el mejor servicio y la máxima calidad, con un diseño único y personalizado en cada uno de nuestros productos.",
      imgAlt1: "Interior de la floristería con cubos de flor fresca",
      workTitle: "Nuestra forma de trabajar",
      workP1:
        "Escuchamos primero: la ocasión, la persona que va a recibir las flores, los colores que le gustan y el presupuesto. A partir de ahí diseñamos una composición única, nunca dos iguales, cuidando la calidad de cada flor y cada planta que sale de la tienda.",
      workP2:
        "Personalizamos ramos, composiciones, cestas y detalles, y aconsejamos sin prisa a quien no sabe qué elegir.",
      imgAlt2: "Ramo de flores variadas sostenido en la mano",
      nearTitle: "Cerca de ti",
      nearText:
        "Estamos en Calle de Motrico 9, 28830 San Fernando de Henares, Madrid y entregamos en 12 localidades de la zona, entre ellas San Fernando de Henares, Torrejón de Ardoz, Coslada, Rivas-Vaciamadrid, Madrid y Guadalajara.",
      ctaCatalog: "Ver catálogo",
      ctaContact: "Contactar",
      ctaZones: "Zonas de entrega",
      imgAlt3: "Floristera montando un ramo de novia en el taller",
      workEyebrow: "Nuestra forma de trabajar",
      workTitleA: "Escuchamos primero.",
      workTitleB: "Diseñamos después.",
      essenceBadge: "Nuestra esencia",
      essenceTitleA: "Flores para cada ocasión,",
      essenceTitleB: "hechas con el corazón.",
      ctaStore: "Conoce nuestra tienda",
    },
    contact: {
      badge: "Contacto",
      title: "Hablemos de tus flores",
      intro:
        "Ven a la tienda o llámanos y cuéntanos tu necesidad o idea: preparamos tu ramo de novia, tu boda, tu evento o tu encargo personalizado contigo.",
      storeLabel: "Tienda y taller",
      phoneLabel: "Teléfono",
      emailLabel: "Email",
      imgAlt: "Ramo de novia en el taller de la floristería",
      weddingsTitle: "Bodas, eventos y encargos a medida",
      weddingsP1:
        "Cuéntanos la fecha y el estilo que tienes en mente y preparamos una propuesta: ramo de novia, decoración de boda, evento o empresa y composiciones personalizadas.",
      weddingsP2:
        "Llámanos al {{phone}} o escríbenos a {{email}} con tu necesidad o idea y te respondemos con el presupuesto lo antes posible.",
      ctaCall: "Llamar al {{phone}}",
      ctaEmail: "Escribir un email",
      ctaCatalog: "Ver catálogo",
      info: {
        storeTitle: "TIENDA",
        phoneTitle: "TELÉFONO",
        whatsappTitle: "WHATSAPP",
        emailTitle: "EMAIL",
        addressLine1: "Calle de Motrico 9",
        addressLine2: "28830 San Fernando de Henares, Madrid",
        phoneNote: "Estamos disponibles para atenderte.",
        whatsappNote: "Escríbenos y cuéntanos tu idea o necesidad.",
        ctaMap: "Cómo llegar",
        ctaCall: "Llamar",
        ctaWhatsapp: "Escribir por WhatsApp",
        ctaEmail: "Escribir un email",
      },
      location: {
        badge: "Dónde estamos",
        title: "Encuéntranos",
        intro: "Visítanos en San Fernando de Henares y estaremos encantados de atenderte.",
        mapTitle: "Mapa de la ubicación de floristeria lucia",
        addressLine1: "Calle de Motrico 9",
        addressLine2: "28830 San Fernando de Henares, Madrid",
        cta: "Cómo llegar",
      },
    },
  },
  en: {
    preserved: {
      badge: "Preserved flower",
      title: "Eternal Roses",
      titleHighlight: "that last for years",
      intro:
        "These are natural roses, not artificial ones. A preservation process replaces their sap with a plant-based solution that keeps the petal's texture and colour for 7 to 10 years, with no water and no need for light.",
      ctaSeeCollection: "View collection",
      ctaCustomBox: "Customise a box",
      howTitle: "How a rose is preserved",
      step: "Step {{n}}",
      steps: {
        selected: {
          title: "Selected natural rose",
          text: "We start with fresh premium cut roses, chosen at their optimal point of bloom.",
        },
        sap: {
          title: "Sap replacement",
          text: "The sap is replaced with a plant-based solution that keeps the petal's texture and flexibility.",
        },
        noLight: {
          title: "No water or direct light",
          text: "No watering or sunlight needed. Just keep it indoors, away from humidity.",
        },
        lifespan: {
          title: "7 to 10 years of life",
          text: "It keeps its natural look for years, making it the shop's longest-lasting gift.",
        },
      },
      faq: {
        careQ: "What care does it need?",
        careA:
          "None in particular: no watering or spraying. Keep it indoors, avoid high humidity and direct sunlight, and dust it off with a soft brush or cool air.",
        colorQ: "Can I choose the colour and the dedication?",
        colorA:
          "Yes. We work with red, pink, white, nude and special shades, and we can engrave or print initials and dedications on the box. Call us at 91 882 68 37 to discuss it.",
        durationQ: "Do they really last 7 to 10 years?",
        durationA:
          "Yes, as long as the care conditions are followed. Over time the shade may soften slightly, which is natural for preserved flowers.",
      },
      collectionTitle: "Eternal roses collection",
      imgAlt: "Black box with fuchsia preserved eternal roses",
    },
    shipping: {
      badge: "San Fernando de Henares, Madrid",
      title: "Shipping and coverage",
      intro:
        "We deliver with our own vehicle to up to 12 towns so the flowers arrive in perfect condition, with unique and personalised details and arrangements. Check your town in the search box; if it's not there, call us at {{phone}} and we'll look into delivery.",
      quote: "A flower says a lot: a floral infinity.",
      statLabelTop: "Towns",
      statLabelBottom: "with our delivery",
      placesBadge: "Where we deliver",
      cards: {
        ownDelivery: {
          title: "Own delivery",
          text: "No external courier within the coverage area: the flowers travel in our own hands.",
        },
        sameDay: {
          title: "Same day",
          text: "Orders confirmed in the morning are delivered the same day, subject to availability.",
        },
        securePayment: {
          title: "Secure payment",
          text: "Card via SSL gateway or bank transfer. VAT included.",
        },
      },
      placesTitle: "Delivery areas",
      placesIntro:
        "Our delivery area covers 12 towns between Madrid and Guadalajara, with our own delivery so every flower arrives in perfect condition.",
      placesQuote: "We deliver with care, closeness and dedication.",
      placesStrip: "12 towns with our own delivery service",
      placesNote:
        "If your town isn't on the list and you're close to our area, write to us and we'll look into a personalised delivery.",
      placesContact: "Contact",
      ratesTitle: "Shipping rates",
      ratesIntro: "Check the delivery conditions for each area we serve.",
      rateRows: {
        "san-fernando": {
          name: "San Fernando de Henares",
          sub: "Delivered by our own team.",
          conditions: ["Orders up to €25", "Orders over €35"],
          results: ["€6 shipping", "Shipping included"],
        },
        limitrofes: {
          name: "Neighbouring Towns",
          sub: "Vicálvaro, Torrejón de Ardoz, Coslada",
          conditions: ["Orders up to €55", "Orders over €55"],
          results: ["€9 shipping", "Free shipping"],
        },
        cercanas: {
          name: "Other Nearby Towns",
          sub: "Paracuellos de Jarama, Alcalá de Henares, Mejorada del Campo",
          conditions: ["Orders up to €55", "Orders over €55"],
          results: ["€14.50 shipping", "Free shipping"],
        },
        madrid: {
          name: "Madrid Capital",
          sub: "Delivered by our own team.",
          conditions: ["Orders up to €110", "Orders over €120"],
          results: ["€18 shipping", "Shipping included"],
        },
      },
      generalItems: {
        min: { amount: "€25", label: "Cost included", note: "Minimum order" },
        s35: { amount: "€35", label: "Shipping included", note: "On orders over €35." },
        s120: { amount: "€120", label: "Shipping included", note: "On orders over €120." },
      },
      towns: "Towns",
      conditionsTitle: "General conditions",
      zones: {
        "san-fernando": {
          title: "San Fernando de Henares",
          rates: ["Orders up to €25: €6 shipping.", "Orders over €35: Shipping included."],
        },
        limitrofes: {
          title: "Neighbouring Towns",
          towns: "Vicálvaro, Torrejón de Ardoz, Coslada",
          rates: ["Orders up to €55: €9 shipping.", "Orders over €55: Free shipping (included)."],
        },
        cercanas: {
          title: "Other Nearby Towns",
          towns: "Paracuellos de Jarama, Alcalá de Henares, Mejorada del Campo",
          rates: [
            "Orders up to €55: €14.50 shipping.",
            "Orders over €55: Free shipping (included).",
          ],
        },
        madrid: {
          title: "Madrid Capital",
          rates: ["Orders up to €110: €18 shipping.", "Orders over €120: Shipping included"],
        },
      },
      conditions: [
        "Minimum order €25, cost included.",
        "Orders over €35, shipping included.",
        "Orders over €120, shipping included.",
      ],
    },
    about: {
      badge: "About us",
      title: "Flowers, plants",
      titleHighlight: "and emotions",
      intro:
        "We are a flower shop that adapts to all the tastes and needs of our customers. We offer the best service and the highest quality, with unique and personalised design for each of our products.",
      imgAlt1: "Inside the flower shop with buckets of fresh flowers",
      workTitle: "Our way of working",
      workP1:
        "We listen first: the occasion, the person who will receive the flowers, the colours they like and the budget. From there we design a unique arrangement, never two alike, taking care of the quality of every flower and plant that leaves the shop.",
      workP2:
        "We personalise bouquets, arrangements, baskets and gifts, and we take our time advising anyone who isn't sure what to choose.",
      imgAlt2: "Bouquet of assorted flowers held in a hand",
      nearTitle: "Close to you",
      nearText:
        "We are located at Calle de Motrico 9, 28830 San Fernando de Henares, Madrid, and we deliver to 12 towns in the area, including San Fernando de Henares, Torrejón de Ardoz, Coslada, Rivas-Vaciamadrid, Madrid and Guadalajara.",
      ctaCatalog: "View catalogue",
      ctaContact: "Contact",
      ctaZones: "Delivery areas",
      imgAlt3: "Florist arranging a bridal bouquet in the workshop",
      workEyebrow: "Our way of working",
      workTitleA: "We listen first.",
      workTitleB: "We design after.",
      essenceBadge: "Our essence",
      essenceTitleA: "Flowers for every occasion,",
      essenceTitleB: "made with the heart.",
      ctaStore: "Discover our shop",
    },
    contact: {
      badge: "Contact",
      title: "Let's talk about your flowers",
      intro:
        "Come to the shop or call us and tell us what you need or have in mind: we'll prepare your bridal bouquet, your wedding, your event or your personalised order together with you.",
      storeLabel: "Shop and workshop",
      phoneLabel: "Phone",
      emailLabel: "Email",
      imgAlt: "Bridal bouquet in the flower shop's workshop",
      weddingsTitle: "Weddings, events and made-to-measure orders",
      weddingsP1:
        "Tell us the date and the style you have in mind and we'll prepare a proposal: bridal bouquet, wedding decoration, event or corporate arrangements and personalised compositions.",
      weddingsP2:
        "Call us at {{phone}} or write to us at {{email}} with what you need or have in mind and we'll get back to you with a quote as soon as possible.",
      ctaCall: "Call {{phone}}",
      ctaEmail: "Send an email",
      ctaCatalog: "View catalogue",
      info: {
        storeTitle: "SHOP",
        phoneTitle: "PHONE",
        whatsappTitle: "WHATSAPP",
        emailTitle: "EMAIL",
        addressLine1: "Calle de Motrico 9",
        addressLine2: "28830 San Fernando de Henares, Madrid",
        phoneNote: "We are available to help you.",
        whatsappNote: "Write to us and tell us your idea or need.",
        ctaMap: "How to get there",
        ctaCall: "Call",
        ctaWhatsapp: "Write via WhatsApp",
        ctaEmail: "Send an email",
      },
      location: {
        badge: "Where we are",
        title: "Find us",
        intro: "Visit us in San Fernando de Henares and we will be delighted to help you.",
        mapTitle: "Map with floristeria lucia's location",
        addressLine1: "Calle de Motrico 9",
        addressLine2: "28830 San Fernando de Henares, Madrid",
        cta: "Get directions",
      },
    },
  },
  ca: {
    preserved: {
      badge: "Flor preservada",
      title: "Roses Eternes",
      titleHighlight: "que duren anys",
      intro:
        "Són roses naturals, no artificials. Un procés de preservació substitueix la seva saba per una solució vegetal que manté el tacte i el color del pètal entre 7 i 10 anys, sense aigua i sense necessitat de llum.",
      ctaSeeCollection: "Veure col·lecció",
      ctaCustomBox: "Personalitzar una caixa",
      howTitle: "Com es preserva una rosa",
      step: "Pas {{n}}",
      steps: {
        selected: {
          title: "Rosa natural seleccionada",
          text: "Partim de rosa fresca de tall premium, triada en el seu punt òptim d'obertura.",
        },
        sap: {
          title: "Substitució de la saba",
          text: "La saba es reemplaça per una solució vegetal que manté la textura i flexibilitat del pètal.",
        },
        noLight: {
          title: "Sense aigua ni llum directa",
          text: "No necessita reg ni sol. N'hi ha prou amb mantenir-la a l'interior, allunyada de la humitat.",
        },
        lifespan: {
          title: "Entre 7 i 10 anys de vida",
          text: "Conserva el seu aspecte natural durant anys, per això és el regal més durador de la botiga.",
        },
      },
      faq: {
        careQ: "Quines cures necessita?",
        careA:
          "Cap d'especial: no es rega ni es polvoritza. Mantén-la a l'interior, evita la humitat alta i la llum solar directa, i treu-ne la pols amb un pinzell suau o aire fred.",
        colorQ: "Puc triar el color i la dedicatòria?",
        colorA:
          "Sí. Treballem vermell, rosa, blanc, nude i tons especials, i podem gravar o rotular inicials i dedicatòries a la caixa. Truca'ns al 91 882 68 37 per veure-ho amb tu.",
        durationQ: "De debò duren de 7 a 10 anys?",
        durationA:
          "Sí, sempre que es respectin les condicions de conservació. Amb el pas del temps el to pot matisar-se lleugerament, cosa natural en la flor preservada.",
      },
      collectionTitle: "Col·lecció de roses eternes",
      imgAlt: "Caixa negra amb roses eternes preservades en to fúcsia",
    },
    shipping: {
      badge: "San Fernando de Henares, Madrid",
      title: "Enviaments i cobertura",
      intro:
        "Repartim amb vehicle propi a fins a 12 poblacions perquè la flor arribi en perfecte estat, amb detalls i composicions úniques i personalitzades. Consulta la teva població al cercador; si no hi apareix, truca'ns al {{phone}} i estudiem el lliurament.",
      quote: "Una flor diu molt: un infinit floral.",
      statLabelTop: "Poblacions",
      statLabelBottom: "amb repartiment",
      placesBadge: "On arribem",
      cards: {
        ownDelivery: {
          title: "Repartiment propi",
          text: "Sense missatgeria externa a la zona de cobertura: la flor viatja a les nostres mans.",
        },
        sameDay: {
          title: "Mateix dia",
          text: "Comandes confirmades al matí amb lliurament el mateix dia segons disponibilitat.",
        },
        securePayment: {
          title: "Pagament segur",
          text: "Targeta amb passarel·la SSL o transferència. IVA inclòs.",
        },
      },
      placesTitle: "Llocs d'enviament",
      placesIntro:
        "La nostra zona de repartiment comprèn 12 poblacions entre Madrid i Guadalajara, amb lliurament propi perquè cada flor arribi en perfecte estat.",
      placesQuote: "Lliurem amb cura, proximitat i dedicació.",
      placesStrip: "12 poblacions amb servei de lliurament propi",
      placesNote:
        "Si la teva població no apareix a la llista i ets a prop de la nostra zona, escriu-nos i estudiarem el teu lliurament personalitzat.",
      placesContact: "Contactar",
      ratesTitle: "Tarifes d'enviament",
      ratesIntro: "Consulta les condicions de lliurament segons la zona de repartiment.",
      rateRows: {
        "san-fernando": {
          name: "San Fernando de Henares",
          sub: "Lliurament amb repartiment propi.",
          conditions: ["Comandes fins a 25 €", "Comandes superiors a 35 €"],
          results: ["6 € de ports", "Enviament inclòs"],
        },
        limitrofes: {
          name: "Pobles Limítrofs",
          sub: "Vicálvaro, Torrejón de Ardoz, Coslada",
          conditions: ["Comandes fins a 55 €", "Comandes superiors a 55 €"],
          results: ["9 € de ports", "Enviament gratuït"],
        },
        cercanas: {
          name: "Altres Localitats Properes",
          sub: "Paracuellos de Jarama, Alcalá de Henares, Mejorada del Campo",
          conditions: ["Comandes fins a 55 €", "Comandes superiors a 55 €"],
          results: ["14,50 € de ports", "Enviament gratuït"],
        },
        madrid: {
          name: "Madrid Capital",
          sub: "Lliurament amb repartiment propi.",
          conditions: ["Comandes fins a 110 €", "Comandes superiors a 120 €"],
          results: ["18 € de ports", "Enviament inclòs"],
        },
      },
      generalItems: {
        min: { amount: "25 €", label: "Cost inclòs", note: "Comanda mínima" },
        s35: { amount: "35 €", label: "Enviament inclòs", note: "En comandes superiors a 35 €." },
        s120: {
          amount: "120 €",
          label: "Enviament inclòs",
          note: "En comandes superiors a 120 €.",
        },
      },
      towns: "Localitats",
      conditionsTitle: "Condicions generals",
      zones: {
        "san-fernando": {
          title: "San Fernando de Henares",
          rates: [
            "Comandes fins a 25€: 6€ de ports.",
            "Comandes superiors a 35€: Enviament inclòs.",
          ],
        },
        limitrofes: {
          title: "Pobles Limítrofs",
          towns: "Vicálvaro, Torrejón de Ardoz, Coslada",
          rates: [
            "Comandes fins a 55€: 9€ de ports.",
            "Comandes superiors a 55€: Enviament gratuït (Port inclòs).",
          ],
        },
        cercanas: {
          title: "Altres Localitats Properes",
          towns: "Paracuellos de Jarama, Alcalá de Henares, Mejorada del Campo",
          rates: [
            "Comandes fins a 55€: 14,50€ de ports.",
            "Comandes superiors a 55€: Enviament gratuït (Port inclòs).",
          ],
        },
        madrid: {
          title: "Madrid Capital",
          rates: [
            "Comandes fins a 110€: 18€ de ports.",
            "Comandes superiors a 120€: Enviament inclòs",
          ],
        },
      },
      conditions: [
        "Comanda mínima 25 euros cost inclòs.",
        "Els enviaments superiors a 35 cost inclòs.",
        "Les comandes de 120 euros amb l'enviament inclòs.",
      ],
    },
    about: {
      badge: "Sobre nosaltres",
      title: "Flors, plantes",
      titleHighlight: "i emocions",
      intro:
        "Som una floristeria que s'adapta a tots els gustos i necessitats dels nostres clients. Oferim el millor servei i la màxima qualitat, amb un disseny únic i personalitzat en cadascun dels nostres productes.",
      imgAlt1: "Interior de la floristeria amb cubells de flor fresca",
      workTitle: "La nostra manera de treballar",
      workP1:
        "Escoltem primer: l'ocasió, la persona que rebrà les flors, els colors que li agraden i el pressupost. A partir d'aquí dissenyem una composició única, mai dues iguals, tenint cura de la qualitat de cada flor i cada planta que surt de la botiga.",
      workP2:
        "Personalitzem rams, composicions, cistelles i detalls, i aconsellem sense pressa a qui no sap què triar.",
      imgAlt2: "Ram de flors variades sostingut a la mà",
      nearTitle: "A prop teu",
      nearText:
        "Som al Carrer de Motrico 9, 28830 San Fernando de Henares, Madrid i entreguem a 12 localitats de la zona, entre elles San Fernando de Henares, Torrejón de Ardoz, Coslada, Rivas-Vaciamadrid, Madrid i Guadalajara.",
      ctaCatalog: "Veure catàleg",
      ctaContact: "Contactar",
      ctaZones: "Zones de lliurament",
      imgAlt3: "Florista muntant un ram de núvia al taller",
      workEyebrow: "La nostra manera de treballar",
      workTitleA: "Escoltem primer.",
      workTitleB: "Dissenyem després.",
      essenceBadge: "La nostra essència",
      essenceTitleA: "Flors per a cada ocasió,",
      essenceTitleB: "fetes amb el cor.",
      ctaStore: "Coneix la nostra botiga",
    },
    contact: {
      badge: "Contacte",
      title: "Parlem de les teves flors",
      intro:
        "Vine a la botiga o truca'ns i explica'ns la teva necessitat o idea: preparem el teu ram de núvia, el teu casament, el teu esdeveniment o el teu encàrrec personalitzat amb tu.",
      storeLabel: "Botiga i taller",
      phoneLabel: "Telèfon",
      emailLabel: "Email",
      imgAlt: "Ram de núvia al taller de la floristeria",
      weddingsTitle: "Casaments, esdeveniments i encàrrecs a mida",
      weddingsP1:
        "Explica'ns la data i l'estil que tens al cap i preparem una proposta: ram de núvia, decoració de casament, esdeveniment o empresa i composicions personalitzades.",
      weddingsP2:
        "Truca'ns al {{phone}} o escriu-nos a {{email}} amb la teva necessitat o idea i et responem amb el pressupost al més aviat possible.",
      ctaCall: "Trucar al {{phone}}",
      ctaEmail: "Escriure un email",
      ctaCatalog: "Veure catàleg",
      info: {
        storeTitle: "BOTIGA",
        phoneTitle: "TELÈFON",
        whatsappTitle: "WHATSAPP",
        emailTitle: "EMAIL",
        addressLine1: "Calle de Motrico 9",
        addressLine2: "28830 San Fernando de Henares, Madrid",
        phoneNote: "Estem disponibles per atendre't.",
        whatsappNote: "Escriu-nos i explica'ns la teva idea o necessitat.",
        ctaMap: "Com arribar",
        ctaCall: "Trucar",
        ctaWhatsapp: "Escriure per WhatsApp",
        ctaEmail: "Escriure un email",
      },
      location: {
        badge: "On som",
        title: "Troba'ns",
        intro: "Visita'ns a San Fernando de Henares i estarem encantats d'atendre't.",
        mapTitle: "Mapa de la ubicació de floristeria lucia",
        addressLine1: "Calle de Motrico 9",
        addressLine2: "28830 San Fernando de Henares, Madrid",
        cta: "Com arribar",
      },
    },
  },
};
