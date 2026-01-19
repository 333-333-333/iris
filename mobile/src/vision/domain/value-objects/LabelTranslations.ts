/**
 * LabelTranslations - Diccionario de traducción para labels de COCO dataset
 * 
 * Traduce las 80 categorías de COCO-SSD del inglés al español
 */

export const COCO_LABELS_ES: Record<string, string> = {
  // Personas y animales
  'person': 'persona',
  'bird': 'pájaro',
  'cat': 'gato',
  'dog': 'perro',
  'horse': 'caballo',
  'sheep': 'oveja',
  'cow': 'vaca',
  'elephant': 'elefante',
  'bear': 'oso',
  'zebra': 'cebra',
  'giraffe': 'jirafa',

  // Vehículos
  'bicycle': 'bicicleta',
  'car': 'coche',
  'motorcycle': 'motocicleta',
  'airplane': 'avión',
  'bus': 'autobús',
  'train': 'tren',
  'truck': 'camión',
  'boat': 'barco',

  // Señalización y mobiliario urbano
  'traffic light': 'semáforo',
  'fire hydrant': 'boca de incendios',
  'stop sign': 'señal de alto',
  'parking meter': 'parquímetro',
  'bench': 'banco',

  // Mobiliario
  'chair': 'silla',
  'couch': 'sofá',
  'potted plant': 'planta en maceta',
  'bed': 'cama',
  'dining table': 'mesa de comedor',
  'toilet': 'inodoro',
  'tv': 'televisor',
  'laptop': 'portátil',
  'mouse': 'ratón',
  'remote': 'control remoto',
  'keyboard': 'teclado',
  'cell phone': 'teléfono móvil',

  // Electrodomésticos
  'microwave': 'microondas',
  'oven': 'horno',
  'toaster': 'tostadora',
  'sink': 'fregadero',
  'refrigerator': 'refrigerador',

  // Objetos de interior
  'book': 'libro',
  'clock': 'reloj',
  'vase': 'jarrón',
  'scissors': 'tijeras',
  'teddy bear': 'osito de peluche',
  'hair drier': 'secador de pelo',
  'toothbrush': 'cepillo de dientes',

  // Comida y bebida
  'banana': 'plátano',
  'apple': 'manzana',
  'sandwich': 'sándwich',
  'orange': 'naranja',
  'broccoli': 'brócoli',
  'carrot': 'zanahoria',
  'hot dog': 'perrito caliente',
  'pizza': 'pizza',
  'donut': 'dona',
  'cake': 'pastel',

  // Vajilla y utensilios
  'bottle': 'botella',
  'wine glass': 'copa de vino',
  'cup': 'taza',
  'fork': 'tenedor',
  'knife': 'cuchillo',
  'spoon': 'cuchara',
  'bowl': 'bol',

  // Deportes
  'frisbee': 'frisbee',
  'skis': 'esquís',
  'snowboard': 'tabla de snowboard',
  'sports ball': 'balón',
  'kite': 'cometa',
  'baseball bat': 'bate de béisbol',
  'baseball glove': 'guante de béisbol',
  'skateboard': 'monopatín',
  'surfboard': 'tabla de surf',
  'tennis racket': 'raqueta de tenis',

  // Accesorios
  'backpack': 'mochila',
  'umbrella': 'paraguas',
  'handbag': 'bolso',
  'tie': 'corbata',
  'suitcase': 'maleta',
};

/**
 * Traduce un label del inglés al español
 */
export function translateLabel(label: string): string {
  const normalized = label.toLowerCase().trim();
  return COCO_LABELS_ES[normalized] || label;
}

/**
 * Obtiene el plural de un label en español
 */
export function pluralizeLabel(labelEs: string): string {
  // Reglas básicas de pluralización en español
  if (labelEs.endsWith('s') || labelEs.endsWith('x') || labelEs.endsWith('z')) {
    return labelEs + 'es';
  }
  
  if (labelEs.endsWith('ón')) {
    return labelEs.slice(0, -2) + 'ones';
  }
  
  if (labelEs.endsWith('a') || labelEs.endsWith('e') || labelEs.endsWith('i') || labelEs.endsWith('o') || labelEs.endsWith('u')) {
    return labelEs + 's';
  }
  
  return labelEs + 'es';
}

/**
 * Artículo determinado para un label
 */
export function getArticle(labelEs: string, plural: boolean = false): string {
  if (plural) return 'los';
  
  const firstChar = labelEs.charAt(0).toLowerCase();
  
  // Femenino
  if (labelEs.endsWith('a') || labelEs.endsWith('ción') || labelEs.endsWith('dad')) {
    return 'la';
  }
  
  // Por defecto masculino
  return 'el';
}

/**
 * Artículo indeterminado para un label
 */
export function getIndefiniteArticle(labelEs: string): string {
  // Femenino
  if (labelEs.endsWith('a') || labelEs.endsWith('ción') || labelEs.endsWith('dad')) {
    return 'una';
  }
  
  // Por defecto masculino
  return 'un';
}
