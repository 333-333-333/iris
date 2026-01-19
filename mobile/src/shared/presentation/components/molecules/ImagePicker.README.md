# ImagePicker Component

Componente reutilizable para seleccionar imágenes de la galería o capturar con la cámara.

## Atomic Design

- **Nivel**: Molécula
- **Categoría**: Input/Selection
- **Composición**: Button (atom) + Typography (atom) + Image (native)

## Uso

### Básico

```tsx
import { ImagePicker } from './components/molecules/ImagePicker';

function MyComponent() {
  const handleImageSelected = (uri: string) => {
    console.log('Selected image:', uri);
    // Procesar la imagen
  };

  return (
    <ImagePicker
      onImageSelected={handleImageSelected}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Solo Galería

```tsx
<ImagePicker
  mode="gallery"
  onImageSelected={handleImageSelected}
/>
```

### Solo Cámara

```tsx
<ImagePicker
  mode="camera"
  onImageSelected={handleImageSelected}
/>
```

### Sin Preview

```tsx
<ImagePicker
  showPreview={false}
  onImageSelected={handleImageSelected}
/>
```

### Botones Personalizados

```tsx
<ImagePicker
  galleryButtonLabel="Seleccionar Foto"
  cameraButtonLabel="Tomar Foto"
  onImageSelected={handleImageSelected}
/>
```

## Props

### `onImageSelected?: (uri: string) => void`

Callback que se ejecuta cuando el usuario selecciona o captura una imagen exitosamente.

**Parámetros:**
- `uri` - URI local de la imagen (formato: `file://...`)

### `onError?: (error: string) => void`

Callback que se ejecuta cuando ocurre un error (permisos denegados, error al cargar, etc.).

**Parámetros:**
- `error` - Mensaje de error descriptivo

### `showPreview?: boolean`

Si debe mostrar un preview de la imagen seleccionada.

**Default:** `true`

### `mode?: 'gallery' | 'camera' | 'both'`

Modo de selección de imágenes.

**Opciones:**
- `'gallery'` - Solo muestra botón de galería
- `'camera'` - Solo muestra botón de cámara
- `'both'` - Muestra ambos botones (default)

**Default:** `'both'`

### `galleryButtonLabel?: string`

Texto personalizado para el botón de galería.

**Default:** `'📁 Seleccionar de Galería'`

### `cameraButtonLabel?: string`

Texto personalizado para el botón de cámara.

**Default:** `'📷 Capturar Foto'`

## Características

### Manejo de Permisos

El componente solicita automáticamente los permisos necesarios:

- **Galería**: `MediaLibrary` permissions
- **Cámara**: `Camera` permissions

Si el usuario deniega los permisos, se ejecuta el callback `onError` con un mensaje descriptivo.

### Preview de Imagen

Cuando `showPreview={true}` (default), el componente muestra:

- Preview de la imagen seleccionada (250px de altura)
- Botón "✕ Eliminar" para limpiar la selección
- Borde y fondo para mejor visualización

### Estados

El componente maneja internamente:

- **Loading**: Desactiva botones mientras se procesa
- **Selected**: Muestra preview si está habilitado
- **Error**: Propaga errores via `onError` callback

## Ejemplos de Uso

### Integración con Vision AI

```tsx
function VisionTestPanel() {
  const { analyzeImage } = useVisionService();
  
  const handleImageSelected = async (uri: string) => {
    try {
      const result = await analyzeImage(uri);
      console.log('Analysis result:', result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <ImagePicker
      onImageSelected={handleImageSelected}
      onError={(error) => alert(error)}
      showPreview={true}
    />
  );
}
```

### Formulario de Perfil

```tsx
function ProfileForm() {
  const [avatarUri, setAvatarUri] = useState<string>('');

  return (
    <View>
      <Typography variant="heading">Foto de Perfil</Typography>
      
      <ImagePicker
        mode="gallery"
        showPreview={true}
        galleryButtonLabel="Seleccionar Avatar"
        onImageSelected={(uri) => setAvatarUri(uri)}
        onError={(error) => console.error(error)}
      />
      
      {avatarUri && (
        <Button
          label="Guardar"
          onPress={() => saveProfile(avatarUri)}
        />
      )}
    </View>
  );
}
```

### Upload de Documentos

```tsx
function DocumentUpload() {
  const handleDocumentSelected = async (uri: string) => {
    const formData = new FormData();
    formData.append('document', {
      uri,
      type: 'image/jpeg',
      name: 'document.jpg',
    } as any);
    
    await uploadDocument(formData);
  };

  return (
    <ImagePicker
      mode="both"
      showPreview={false}
      galleryButtonLabel="Seleccionar Documento"
      cameraButtonLabel="Escanear Documento"
      onImageSelected={handleDocumentSelected}
    />
  );
}
```

## Dependencias

- `expo-image-picker` - API de Expo para acceder a galería y cámara
- Componentes atoms: `Button`, `Typography`

## Testing

El componente incluye tests completos:

```bash
npm test ImagePicker.test.tsx
```

Tests cubiertos:
- ✅ Renderizado en diferentes modos
- ✅ Solicitud de permisos
- ✅ Selección de galería
- ✅ Captura con cámara
- ✅ Preview de imagen
- ✅ Limpieza de imagen
- ✅ Manejo de errores
- ✅ Estados de carga

## Accesibilidad

El componente es accesible:

- ✅ Usa componentes `Button` que ya tienen soporte de accesibilidad
- ✅ Labels descriptivos en botones
- ✅ Feedback visual claro
- ✅ Estados de carga comunicados

## Performance

Optimizaciones incluidas:

- Estados locales para UI inmediata
- Callbacks memoizables
- Carga lazy de imágenes
- Manejo de errores robusto

## Limitaciones

- Solo soporta imágenes (no videos)
- No tiene edición de imagen integrada
- Preview tiene altura fija (250px)
- No comprime automáticamente las imágenes

## Mejoras Futuras

- [ ] Soporte para múltiples imágenes
- [ ] Edición básica (crop, rotate)
- [ ] Compresión automática de imágenes
- [ ] Soporte para videos
- [ ] Preview con zoom
- [ ] Galería con thumbnails
