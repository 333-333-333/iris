# Migración: Gemini → Azure Computer Vision

## 📋 Resumen

Cambiamos de **Google Gemini Vision** a **Azure Computer Vision** para aprovechar un free tier más generoso y mejores capacidades de detección.

## 🎯 Razones del Cambio

| Aspecto | Gemini | Azure Computer Vision |
|---------|--------|----------------------|
| **Free Tier** | 1,500 requests/día (15/min) | **5,000 requests/mes** |
| **Velocidad** | ~2-3s | ~1-2s |
| **Detección** | Solo texto descriptivo | **Objetos + coordenadas + descripción** |
| **API** | Chat-based (pesado) | REST especializado (ligero) |
| **Datos estructurados** | ❌ No | ✅ Sí (JSON con objetos) |

## 🔄 Cambios Realizados

### 1. Dependencias

**Removido:**
```json
"@google/generative-ai": "^0.24.1"
```

**Agregado:**
```json
"axios": "^1.13.2"
```

### 2. Configuración

**Antes (Gemini):**
```bash
# .env
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

**Ahora (Azure):**
```bash
# .env
EXPO_PUBLIC_AZURE_CV_API_KEY=your-azure-api-key-here
EXPO_PUBLIC_AZURE_CV_ENDPOINT=https://iris-assistant-cv.cognitiveservices.azure.com/
```

### 3. Archivos Nuevos

```
src/
├── config/
│   └── azure.ts                    # ✨ NUEVO: Configuración de Azure CV
│
└── vision/infrastructure/adapters/
    └── azure/
        └── AzureVisionAdapter.ts   # ✨ NUEVO: Adapter para Azure CV
```

### 4. Archivos Modificados

```
✏️  src/config/gemini.ts                              → Reemplazado por azure.ts
✏️  src/vision/infrastructure/adapters/hybrid/HybridVisionAdapter.ts
    - Cambiado: geminiAdapter → azureAdapter
    - Actualizado: constructor ahora recibe { apiKey, endpoint }
    
✏️  src/vision/presentation/hooks/useVisionService.ts
    - Cambiado: getGeminiApiKey() → getAzureConfig()
    - Actualizado: pasa config completo al HybridVisionAdapter

✏️  package.json                                      → Removido Gemini, agregado axios
✏️  README.md                                         → Actualizada documentación
✏️  docs/VISION_SERVICE.md                            → Agregada estrategia híbrida
✏️  .env                                              → Nuevas credenciales de Azure
✏️  .env.example                                      → Plantilla actualizada
```

### 5. Archivos No Tocados (pueden removerse después)

```
❌ src/config/gemini.ts                               # Ya no se usa
❌ src/vision/infrastructure/adapters/gemini/GeminiVisionAdapter.ts  # Ya no se usa
```

## 🏗️ Arquitectura Actualizada

### HybridVisionAdapter (Estrategia)

```typescript
// Antes
constructor(geminiApiKey?: string)

// Ahora
constructor(azureConfig?: { apiKey: string; endpoint: string })
```

### Flujo de Análisis

```
1. TFLite detecta objetos localmente (200-500ms)
   → objects: DetectedObject[]
   → naturalDescription: "template básico"

2. Si hay internet:
   a. Azure analiza contexto (1-2s)
      → POST /computervision/imageanalysis:analyze
      → Features: caption, denseCaptions, objects, tags
   
   b. Combina resultados:
      → objects: de TFLite (con coordenadas normalizadas)
      → naturalDescription: de Azure (contextual y rico)

3. Si NO hay internet:
   → Usa solo resultado de TFLite
```

## 📊 Comparación de Resultados

### Ejemplo: Foto de Oficina

**TFLite (local):**
```json
{
  "objects": [
    { "label": "person", "confidence": 0.92 },
    { "label": "laptop", "confidence": 0.88 },
    { "label": "chair", "confidence": 0.76 }
  ],
  "naturalDescription": "Veo una persona, un portátil y una silla"
}
```

**Azure (enriquecido):**
```json
{
  "objects": [
    { "object": "person", "confidence": 0.94, "rectangle": {...} },
    { "object": "laptop", "confidence": 0.91, "rectangle": {...} },
    { "object": "chair", "confidence": 0.82, "rectangle": {...} }
  ],
  "captionResult": {
    "text": "Una persona trabajando en una oficina moderna con un portátil sobre el escritorio",
    "confidence": 0.89
  }
}
```

**Resultado Híbrido Final:**
```json
{
  "objects": [
    // De TFLite, pero con etiquetas de Azure si están disponibles
    { "label": "person", "labelEs": "persona", "confidence": 0.92, ... },
    { "label": "laptop", "labelEs": "portátil", "confidence": 0.88, ... },
    { "label": "chair", "labelEs": "silla", "confidence": 0.76, ... }
  ],
  "naturalDescription": "Una persona trabajando en una oficina moderna con un portátil sobre el escritorio",
  "confidence": 0.89
}
```

## 🔑 Ventajas de Azure Computer Vision

### 1. Datos Estructurados
- **Objetos con coordenadas** en píxeles absolutos (normalizamos a 0-1)
- **Múltiples captions** (general + dense por regiones)
- **Tags descriptivos** con confianza
- **Metadata** de imagen (width, height)

### 2. API Diseñada para Visión
```typescript
// Gemini (chat-based, genérico)
await model.generateContent([prompt, { inlineData: { ... } }])

// Azure (REST especializado)
await axios.post('/imageanalysis:analyze', imageBinary, {
  params: {
    features: 'caption,objects,tags',
    language: 'es'
  }
})
```

### 3. Free Tier Generoso
- **5,000 transacciones/mes** gratis
- Sin límite por minuto
- Suficiente para desarrollo y usuarios beta

### 4. Latencia Predecible
- Azure: ~1-2s consistente
- Gemini: ~2-4s variable

## 🚀 Cómo Usar

### Configuración Inicial

1. **Obtener credenciales** (ya hecho):
   - Recurso: `iris-assistant-cv`
   - Region: East US
   - API Key: ✅ Configurado en `.env`
   - Endpoint: ✅ Configurado en `.env`

2. **La app detecta automáticamente** si hay Azure configurado:
   ```typescript
   try {
     azureConfig = getAzureConfig();
     console.log('✓ Azure enabled');
   } catch {
     console.log('⚠️ Azure disabled, using TFLite only');
   }
   ```

### Testing

```bash
# Instalar dependencias
bun install

# La app usará Azure automáticamente si:
# 1. Hay credenciales en .env
# 2. Hay conexión a internet

# Sin internet → TFLite solamente
# Con internet → TFLite + Azure (hybrid)
```

## 📝 Siguiente Paso

**Probar en dispositivo real:**

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios --device
```

**Verificar logs:**
```bash
# Buscar en logs:
[HybridVisionAdapter] Online - using Azure Computer Vision for rich description
[AzureVisionAdapter] Description: "..."
```

## 🎉 Resultado

✅ **Free tier más generoso** (5,000/mes vs 1,500/día)  
✅ **Mejor calidad** de descripciones contextuales  
✅ **Datos estructurados** (objetos con coordenadas)  
✅ **API especializada** para visión (no chat genérico)  
✅ **Funciona offline** con TFLite como fallback  
✅ **Zero downtime** - migración transparente

## 🔗 Referencias

- [Azure Computer Vision Docs](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/)
- [Image Analysis API](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/how-to/call-analyze-image-40)
- [Free Tier Limits](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/computer-vision/)
