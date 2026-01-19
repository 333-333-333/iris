#!/bin/bash
# Script de setup para desarrollo de Iris
# Configura el entorno y resuelve problemas comunes

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
echo -e "${BLUE}        Iris Mobile - Setup de Desarrollo        ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# 1. Verificar Node.js
echo -e "${BLUE}[1/6] Verificando Node.js...${NC}"
if ! command -v node &>/dev/null; then
	echo -e "${RED}✗ Node.js no está instalado${NC}"
	echo -e "${YELLOW}  Instala Node.js desde https://nodejs.org/${NC}"
	exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js instalado: ${NODE_VERSION}${NC}"
echo ""

# 2. Instalar dependencias
echo -e "${BLUE}[2/6] Instalando dependencias...${NC}"
cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
	npm install
	echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
	echo -e "${YELLOW}! node_modules ya existe. ¿Reinstalar? (y/n)${NC}"
	read -r reinstall
	if [ "$reinstall" = "y" ]; then
		rm -rf node_modules package-lock.json
		npm install
		echo -e "${GREEN}✓ Dependencias reinstaladas${NC}"
	else
		echo -e "${YELLOW}! Saltando instalación de dependencias${NC}"
	fi
fi
echo ""

# 3. Verificar expo-image-picker
echo -e "${BLUE}[3/6] Verificando expo-image-picker...${NC}"
if npm list expo-image-picker &>/dev/null; then
	echo -e "${GREEN}✓ expo-image-picker instalado${NC}"
else
	echo -e "${YELLOW}! Instalando expo-image-picker...${NC}"
	npm install expo-image-picker
	echo -e "${GREEN}✓ expo-image-picker instalado${NC}"
fi
echo ""

# 4. Verificar configuración de app.json
echo -e "${BLUE}[4/6] Verificando app.json...${NC}"
if grep -q "expo-image-picker" app.json; then
	echo -e "${GREEN}✓ Plugin expo-image-picker configurado${NC}"
else
	echo -e "${RED}✗ Plugin expo-image-picker no está en app.json${NC}"
	echo -e "${YELLOW}  Por favor, agrega el plugin manualmente${NC}"
fi
echo ""

# 5. Limpiar cache
echo -e "${BLUE}[5/6] Limpiando cache...${NC}"
echo -e "${YELLOW}¿Limpiar cache de Metro? (y/n)${NC}"
read -r clean_cache
if [ "$clean_cache" = "y" ]; then
	npx expo start --clear &
	sleep 2
	kill %1 2>/dev/null || true
	echo -e "${GREEN}✓ Cache limpiado${NC}"
else
	echo -e "${YELLOW}! Saltando limpieza de cache${NC}"
fi
echo ""

# 6. Pre-build (opcional)
echo -e "${BLUE}[6/6] Pre-build...${NC}"
echo -e "${YELLOW}¿Ejecutar prebuild? Necesario si modificaste app.json (y/n)${NC}"
read -r do_prebuild
if [ "$do_prebuild" = "y" ]; then
	echo -e "${YELLOW}Selecciona plataforma:${NC}"
	echo -e "  1) Android"
	echo -e "  2) iOS"
	echo -e "  3) Ambas"
	read -r platform_choice

	case $platform_choice in
	1)
		npx expo prebuild --platform android --clean
		echo -e "${GREEN}✓ Pre-build Android completado${NC}"
		;;
	2)
		npx expo prebuild --platform ios --clean
		echo -e "${GREEN}✓ Pre-build iOS completado${NC}"
		;;
	3)
		npx expo prebuild --clean
		echo -e "${GREEN}✓ Pre-build completado para ambas plataformas${NC}"
		;;
	*)
		echo -e "${YELLOW}! Opción inválida, saltando prebuild${NC}"
		;;
	esac
else
	echo -e "${YELLOW}! Saltando prebuild${NC}"
fi
echo ""

# Resumen
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}✓ Setup completado${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo ""
echo -e "  Para desarrollo normal:"
echo -e "    ${BLUE}npx expo start${NC}"
echo ""
echo -e "  Para ejecutar en dispositivo (después de prebuild):"
echo -e "    ${BLUE}npx expo run:android${NC}  (Android)"
echo -e "    ${BLUE}npx expo run:ios${NC}      (iOS)"
echo ""
echo -e "  Para ejecutar tests:"
echo -e "    ${BLUE}npm test${NC}"
echo ""
echo -e "${YELLOW}Nota:${NC} Si modificaste app.json, necesitas ejecutar prebuild"
echo -e "      y luego run:android o run:ios"
echo ""
