#!/bin/bash
# Script para verificar el setup de TensorFlow Lite

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   TensorFlow Lite Setup - Verificación          ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

cd "$PROJECT_ROOT"

# 1. Verificar paquete instalado
echo -e "${BLUE}[1/5] Verificando react-native-fast-tflite...${NC}"
if npm list react-native-fast-tflite &>/dev/null; then
	VERSION=$(npm list react-native-fast-tflite | grep react-native-fast-tflite | awk '{print $2}')
	echo -e "${GREEN}✓ Instalado: $VERSION${NC}"
else
	echo -e "${RED}✗ NO instalado${NC}"
	echo -e "${YELLOW}  Ejecuta: npm install react-native-fast-tflite${NC}"
	exit 1
fi
echo ""

# 2. Verificar modelo
echo -e "${BLUE}[2/5] Verificando modelo COCO-SSD...${NC}"
if [ -f "assets/models/coco_ssd_mobilenet_v1.tflite" ]; then
	SIZE=$(du -h assets/models/coco_ssd_mobilenet_v1.tflite | awk '{print $1}')
	echo -e "${GREEN}✓ Modelo encontrado: $SIZE${NC}"
else
	echo -e "${RED}✗ Modelo NO encontrado${NC}"
	echo -e "${YELLOW}  Debe estar en: assets/models/coco_ssd_mobilenet_v1.tflite${NC}"
	exit 1
fi
echo ""

# 3. Verificar metro.config.js
echo -e "${BLUE}[3/5] Verificando metro.config.js...${NC}"
if grep -q "\.tflite" metro.config.js; then
	echo -e "${GREEN}✓ Extension .tflite configurada${NC}"
else
	echo -e "${RED}✗ Extension .tflite NO configurada${NC}"
	echo -e "${YELLOW}  Agrega en metro.config.js:${NC}"
	echo -e "${YELLOW}  config.resolver.assetExts.push('tflite');${NC}"
	exit 1
fi
echo ""

# 4. Verificar app.json (react-native-fast-tflite NO necesita plugin)
echo -e "${BLUE}[4/5] Verificando app.json...${NC}"
echo -e "${GREEN}✓ react-native-fast-tflite se configura automáticamente${NC}"
echo -e "${YELLOW}  (No necesita estar en la sección plugins)${NC}"
echo ""

# 5. Verificar build nativo
echo -e "${BLUE}[5/5] Verificando build nativo...${NC}"
if [ -d "android/.gradle" ] || [ -d "ios/.xcode.env" ]; then
	echo -e "${GREEN}✓ Proyecto nativo existe${NC}"
	echo -e "${YELLOW}  IMPORTANTE: Si modificaste app.json, ejecuta:${NC}"
	echo -e "${YELLOW}  npx expo prebuild --clean${NC}"
else
	echo -e "${YELLOW}! Proyecto nativo NO encontrado${NC}"
	echo -e "${YELLOW}  Ejecuta: npx expo prebuild --clean${NC}"
fi
echo ""

# Resumen
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}✓ Verificación completada${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

echo -e "${YELLOW}Próximos pasos para activar TFLite real:${NC}"
echo ""
echo -e "  1. Reconstruir proyecto nativo:"
echo -e "     ${BLUE}npx expo prebuild --clean${NC}"
echo ""
echo -e "  2. Ejecutar en dispositivo:"
echo -e "     ${BLUE}npx expo run:android${NC}"
echo -e "     ${BLUE}npx expo run:ios${NC}"
echo ""
echo -e "  3. Verificar logs:"
echo -e "     Busca: ${GREEN}\"✓ Model loaded successfully!\"${NC}"
echo -e "     NO debe aparecer: ${RED}\"Running MOCK detection\"${NC}"
echo ""
echo -e "${YELLOW}Nota:${NC} npx expo start NO es suficiente para módulos nativos"
echo ""
