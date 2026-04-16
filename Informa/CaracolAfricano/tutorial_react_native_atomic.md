# Tutorial: Prototipos de Pantallas para App de Caracol Africano con React Native, Atomic Design y Expo Go
## Semillero Informa, 2026

---

## Tabla de Contenidos

1. [¿Qué vamos a construir?](#1-qué-vamos-a-construir)
2. [Conceptos clave antes de empezar](#2-conceptos-clave-antes-de-empezar)
3. [Configuración del entorno](#3-configuración-del-entorno)
4. [Estructura del proyecto (Atomic Design)](#4-estructura-del-proyecto-atomic-design)
5. [Átomos: los bloques más pequeños](#5-átomos-los-bloques-más-pequeños)
6. [Moléculas: componentes compuestos](#6-moléculas-componentes-compuestos)
7. [Organismos: secciones de pantalla](#7-organismos-secciones-de-pantalla)
8. [Templates y Screens](#8-templates-y-screens)
9. [Navegación entre pantallas](#9-navegación-entre-pantallas)
10. [Deploy en Expo Go](#10-deploy-en-expo-go)
11. [Resumen y próximos pasos](#11-resumen-y-próximos-pasos)

---

## 1. ¿Qué vamos a construir?

Construiremos dos pantallas de una app ciudadana para reportar el **Caracol Africano** (*Achatina fulica*), una especie invasora en Cali.

### Pantalla 1 — Home (`HomeScreen`)
- Saludo personalizado al usuario
- Alerta principal con botón de reporte
- Métricas de la comunidad (reportes y zonas limpias)
- Tarjetas educativas horizontales

### Pantalla 2 — Protocolo de Manejo (`ProtocolScreen`)
- Barra de navegación con título
- Imagen de cabecera
- Título y descripción
- Lista de pasos del protocolo
- Botón de descarga de PDF oficial

---

## 2. Conceptos clave antes de empezar

Antes de escribir código, hay algunos conceptos que usaremos a lo largo de todo el tutorial. Léelos ahora y vuelve a consultarlos cuando los encuentres en el código.

### 2.1 TypeScript: tipado estático

TypeScript es JavaScript con **tipos**. Nos ayuda a detectar errores antes de ejecutar el código.

```typescript
// JavaScript: no sabe qué tipo tiene 'nombre'
const nombre = "Ana";

// TypeScript: sabemos que es un string
const nombre: string = "Ana";

// Tipo de objeto (interface)
interface Usuario {
  nombre: string;
  edad: number;
  activo: boolean;
}

const usuario: Usuario = {
  nombre: "Ana",
  edad: 28,
  activo: true,
};
```

### 2.2 Props: cómo los componentes reciben datos

Las **props** (propiedades) son los parámetros que un componente padre le pasa a un componente hijo. Es la forma principal de comunicación en React.

```typescript
// Definimos qué props acepta el componente
interface SaludoProps {
  nombre: string;       // requerido
  mensaje?: string;     // opcional (el ? lo indica)
}

// El componente recibe las props como parámetro
function Saludo({ nombre, mensaje = "¡Hola!" }: SaludoProps) {
  return <Text>{mensaje} {nombre}</Text>;
}

// Así se usa:
<Saludo nombre="Ana" />
<Saludo nombre="Carlos" mensaje="Bienvenido," />
```

### 2.3 Hooks: estado y efectos

Los **hooks** son funciones especiales de React que comienzan con `use`. Los más importantes son:

```typescript
// useState: guarda un valor que puede cambiar
const [contador, setContador] = useState<number>(0);
// cuando llamas setContador(1), el componente se vuelve a renderizar

// useEffect: ejecuta código cuando algo cambia
useEffect(() => {
  console.log("El contador cambió:", contador);
}, [contador]); // el array son las dependencias
```

### 2.4 StyleSheet de React Native

En React Native **no hay CSS**. Los estilos se definen con objetos JavaScript:

```typescript
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
});
```

### 2.5 Atomic Design: la filosofía que seguiremos

Atomic Design divide los componentes en 5 niveles:

| Nivel | Descripción | Ejemplo |
|-------|-------------|---------|
| **Átomos** | Componentes mínimos, sin dependencias | `AppText`, `AppButton`, `Badge` |
| **Moléculas** | Combinación de 2–3 átomos | `AlertCard`, `StatCard`, `ProtocolStep` |
| **Organismos** | Secciones completas de UI | `HomeHeader`, `LearnSection` |
| **Templates** | Layout de la pantalla sin datos reales | `HomeTemplate` |
| **Screens** | Template + datos reales | `HomeScreen` |

---

## 3. Configuración del entorno

### 3.1 Requisitos previos

Instala estas herramientas antes de comenzar:

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|----------|
| Node.js | 18.x o superior | https://nodejs.org |
| VS Code | Última estable | https://code.visualstudio.com |
| Git | Cualquiera | https://git-scm.com |
| Expo Go (celular) | Última | App Store / Play Store |

### 3.2 Extensiones de VS Code recomendadas

Abre VS Code, ve a Extensions (`Ctrl+Shift+X`) e instala:

- **ESLint** — detecta errores de código en tiempo real
- **Prettier - Code formatter** — formatea el código automáticamente
- **React Native Tools** — soporte para depuración
- **TypeScript Hero** — organiza imports automáticamente
- **Color Highlight** — muestra los colores en el editor

### 3.3 Crear el proyecto con Expo

Abre una terminal en la carpeta donde quieres crear el proyecto y ejecuta:

```bash
# Instalar Expo CLI globalmente (solo la primera vez)
npm install -g expo-cli

# Crear el proyecto con TypeScript
npx create-expo-app EcosistemaApp --template blank-typescript

# Entrar a la carpeta del proyecto
cd EcosistemaApp
```

> **¿Qué hace `--template blank-typescript`?**  
> Crea un proyecto mínimo con TypeScript preconfigurado. Es el punto de partida más limpio para aprender.

### 3.4 Instalar librerías

Ejecuta estos comandos **dentro de la carpeta del proyecto**:

```bash
# Navegación entre pantallas (React Navigation)
npm install @react-navigation/native @react-navigation/stack

# Dependencias peer de React Navigation (requeridas por Expo)
npx expo install react-native-screens react-native-safe-area-context

# Íconos incluidos con Expo
npx expo install @expo/vector-icons

# Scroll horizontal para las tarjetas educativas
# (ya incluido en React Native, no necesita instalación)
```

**Resumen de librerías y para qué sirven:**

| Librería | Propósito |
|----------|-----------|
| `@react-navigation/native` | Sistema de navegación entre pantallas |
| `@react-navigation/stack` | Navegación tipo "pila" (pantalla sobre pantalla) |
| `react-native-screens` | Optimiza el rendimiento de la navegación |
| `react-native-safe-area-context` | Respeta el notch y la barra inferior del teléfono |
| `@expo/vector-icons` | Íconos (Ionicons, MaterialIcons, FontAwesome) |

### 3.5 Verificar que todo funciona

```bash
npx expo start
```

Escanea el código QR con la app **Expo Go** en tu celular. Deberías ver la pantalla por defecto de Expo.

---

## 4. Estructura del proyecto (Atomic Design)

Crea la siguiente estructura de carpetas dentro de `EcosistemaApp/`. Puedes hacerlo desde la terminal o desde VS Code:

```
EcosistemaApp/
├── app.json
├── App.tsx                    ← Punto de entrada
├── assets/
│   └── images/                ← Imágenes (caracol, guantes, etc.)
├── src/
│   ├── components/
│   │   ├── atoms/             ← Componentes mínimos
│   │   │   ├── AppText.tsx
│   │   │   ├── AppButton.tsx
│   │   │   └── Badge.tsx
│   │   ├── molecules/         ← Combinación de átomos
│   │   │   ├── AlertCard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── EducationCard.tsx
│   │   │   └── ProtocolStep.tsx
│   │   └── organisms/         ← Secciones de pantalla
│   │       ├── HomeHeader.tsx
│   │       ├── StatsRow.tsx
│   │       └── LearnSection.tsx
│   ├── screens/               ← Pantallas completas
│   │   ├── HomeScreen.tsx
│   │   └── ProtocolScreen.tsx
│   ├── navigation/            ← Configuración de rutas
│   │   └── AppNavigator.tsx
│   └── theme/                 ← Colores y tipografía globales
│       └── index.ts
```

Para crear las carpetas en la terminal:

```bash
mkdir -p src/components/atoms
mkdir -p src/components/molecules
mkdir -p src/components/organisms
mkdir -p src/screens
mkdir -p src/navigation
mkdir -p src/theme
mkdir -p assets/images
```

---

## 5. Átomos: los bloques más pequeños

Los átomos son el nivel más bajo. No dependen de ningún otro componente propio del proyecto. Empezamos por el sistema de tema (colores y tipografía).

### 5.1 Theme (`src/theme/index.ts`)

Centralizar los colores evita que los tengas repetidos por todo el código.

```typescript
// src/theme/index.ts

export const colors = {
  // Colores primarios de la app
  primary: "#22C55E",        // Verde principal
  primaryDark: "#16A34A",    // Verde oscuro (hover / pressed)
  primaryLight: "#DCFCE7",   // Verde claro (fondos de íconos)
  
  // Colores de acento y alerta
  danger: "#EF4444",         // Rojo (peligro)
  warning: "#F59E0B",        // Amarillo (prevención)
  
  // Escala de grises
  black: "#111827",
  gray900: "#1F2937",
  gray600: "#4B5563",
  gray400: "#9CA3AF",
  gray100: "#F3F4F6",
  white: "#FFFFFF",
  
  // Fondo de pantalla
  background: "#F9FAFB",
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};
```

> **Concepto: módulos de TypeScript**  
> La palabra clave `export` hace que estas constantes estén disponibles en otros archivos. En los componentes las importarás así: `import { colors } from "../theme"`.

---

### 5.2 AppText (`src/components/atoms/AppText.tsx`)

Un componente de texto reutilizable con variantes predefinidas. Así evitas repetir `fontSize`, `fontWeight` y `color` en cada pantalla.

```typescript
// src/components/atoms/AppText.tsx

import React from "react";
import { Text, TextStyle, StyleSheet } from "react-native";
import { colors, fontSizes } from "../../theme";

// 1. Definimos los tipos de variante disponibles
type TextVariant = "h1" | "h2" | "h3" | "body" | "caption" | "label";

// 2. Definimos las props del componente
interface AppTextProps {
  variant?: TextVariant;       // Tipo de texto (opcional, por defecto "body")
  color?: string;              // Color personalizado (opcional)
  style?: TextStyle;           // Estilos adicionales (opcional)
  children: React.ReactNode;   // Contenido del texto (requerido)
}

// 3. El componente en sí
export function AppText({
  variant = "body",   // valor por defecto si no se pasa variant
  color,
  style,
  children,
}: AppTextProps) {
  return (
    <Text style={[styles[variant], color ? { color } : null, style]}>
      {children}
    </Text>
  );
}

// 4. Estilos para cada variante
const styles = StyleSheet.create({
  h1: {
    fontSize: fontSizes["3xl"],
    fontWeight: "800",
    color: colors.black,
    lineHeight: 36,
  },
  h2: {
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.black,
    lineHeight: 30,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: "600",
    color: colors.black,
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: "400",
    color: colors.gray600,
    lineHeight: 22,
  },
  caption: {
    fontSize: fontSizes.sm,
    fontWeight: "400",
    color: colors.gray400,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
```

**Uso del componente:**
```tsx
<AppText variant="h1">Protege nuestro ecosistema</AppText>
<AppText variant="body">Texto descriptivo aquí...</AppText>
<AppText variant="caption" color={colors.primary}>Ver todo</AppText>
```

> **Concepto: `StyleSheet.create` vs objeto literal**  
> `StyleSheet.create({})` optimiza los estilos internamente y añade validación de tipos. Siempre úsalo en lugar de `style={{ ... }}` inline para estilos que no cambian.

---

### 5.3 AppButton (`src/components/atoms/AppButton.tsx`)

Un botón reutilizable con variantes de estilo.

```typescript
// src/components/atoms/AppButton.tsx

import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  View,
} from "react-native";
import { AppText } from "./AppText";
import { colors, radius, spacing } from "../../theme";

type ButtonVariant = "primary" | "dark" | "outline";

interface AppButtonProps {
  label: string;
  onPress: () => void;           // Función que se ejecuta al presionar
  variant?: ButtonVariant;
  loading?: boolean;             // Muestra un spinner si es true
  icon?: React.ReactNode;        // Ícono opcional al lado del texto
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
  icon,
  style,
}: AppButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], style]}
      onPress={onPress}
      activeOpacity={0.8}        // Opacidad al presionar
      disabled={loading}         // Deshabilita si está cargando
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <AppText
            variant="label"
            color={variant === "outline" ? colors.primary : colors.white}
          >
            {label}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: spacing.sm,
  },
  // Variantes
  primary: {
    backgroundColor: colors.primary,
  },
  dark: {
    backgroundColor: colors.black,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
});
```

> **Concepto: `TouchableOpacity`**  
> Es el componente de React Native para hacer botones. Reduce la opacidad cuando se presiona (feedback visual). Alternativa: `Pressable` (más moderno, más flexible).

---

### 5.4 Badge (`src/components/atoms/Badge.tsx`)

La etiqueta de categoría que aparece sobre las tarjetas educativas (PELIGRO, PREVENCIÓN, GUÍA).

```typescript
// src/components/atoms/Badge.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { colors, radius, spacing } from "../../theme";

type BadgeType = "danger" | "prevention" | "guide";

interface BadgeProps {
  type: BadgeType;
  label: string;
}

// Mapa de colores por tipo
const badgeColors: Record<BadgeType, string> = {
  danger: colors.danger,
  prevention: colors.warning,
  guide: colors.primary,
};

export function Badge({ type, label }: BadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor: badgeColors[type] }]}>
      <AppText variant="caption" color={colors.white}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: "flex-start",  // No ocupa todo el ancho disponible
  },
});
```

> **Concepto: `Record<K, V>`**  
> Es un tipo de TypeScript que define un objeto donde todas las claves son de tipo `K` y los valores de tipo `V`. `Record<BadgeType, string>` garantiza que el objeto tenga exactamente las claves "danger", "prevention" y "guide".

---

## 6. Moléculas: componentes compuestos

Las moléculas combinan átomos para crear componentes con más lógica y estructura.

### 6.1 AlertCard (`src/components/molecules/AlertCard.tsx`)

La tarjeta verde de alerta principal que aparece en la pantalla Home.

```typescript
// src/components/molecules/AlertCard.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../atoms/AppText";
import { AppButton } from "../atoms/AppButton";
import { colors, radius, spacing } from "../../theme";

interface AlertCardProps {
  title: string;             // "¡He visto un Caracol Africano!"
  alertLabel?: string;       // "ALERTA ESPECIE INVASORA"
  buttonLabel: string;       // "Reportar Ahora"
  onReportPress: () => void; // Qué hacer al presionar el botón
}

export function AlertCard({
  title,
  alertLabel = "ALERTA ESPECIE INVASORA",
  buttonLabel,
  onReportPress,
}: AlertCardProps) {
  return (
    <View style={styles.container}>
      {/* Fila de la etiqueta de alerta */}
      <View style={styles.alertRow}>
        <Ionicons name="warning-outline" size={16} color={colors.white} />
        <AppText variant="caption" color={colors.white} style={styles.alertLabel}>
          {alertLabel}
        </AppText>
      </View>

      {/* Título principal */}
      <AppText variant="h2" color={colors.white} style={styles.title}>
        {title}
      </AppText>

      {/* Botón de reporte */}
      <AppButton
        label={buttonLabel}
        onPress={onReportPress}
        variant="dark"
        icon={<Ionicons name="camera-outline" size={18} color={colors.white} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
    gap: spacing.md,            // Espacio entre hijos (React Native 0.71+)
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  alertLabel: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
});
```

> **Concepto: `gap` en React Native**  
> Desde React Native 0.71, puedes usar `gap`, `rowGap` y `columnGap` igual que en CSS. Es equivalente a poner `margin` en cada hijo, pero más limpio. Solo funciona con Flexbox (que es el sistema por defecto en RN).

---

### 6.2 StatCard (`src/components/molecules/StatCard.tsx`)

Las tarjetas de métricas (54 reportes, 12 zonas limpias).

```typescript
// src/components/molecules/StatCard.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../atoms/AppText";
import { colors, radius, spacing } from "../../theme";

// Tipo que acepta cualquier nombre de ícono de Ionicons
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface StatCardProps {
  value: number | string;
  label: string;
  iconName: IoniconsName;
  iconColor?: string;
}

export function StatCard({
  value,
  label,
  iconName,
  iconColor = colors.primary,
}: StatCardProps) {
  return (
    <View style={styles.container}>
      {/* Círculo con ícono */}
      <View style={[styles.iconCircle, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>

      {/* Número grande */}
      <AppText variant="h1" style={styles.value}>
        {value}
      </AppText>

      {/* Etiqueta descriptiva */}
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                        // Ocupa el espacio disponible equitativamente
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,                   // Sombra en Android
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 32,
    fontWeight: "800",
  },
});
```

> **Concepto: `flex: 1`**  
> En un contenedor con `flexDirection: "row"`, `flex: 1` hace que el elemento ocupe todo el espacio restante. Si dos hijos tienen `flex: 1`, se dividen el espacio en partes iguales. Es el sistema de grid de React Native.

---

### 6.3 EducationCard (`src/components/molecules/EducationCard.tsx`)

Las tarjetas con imagen que aparecen en el scroll horizontal de la sección "Aprende a identificarlos".

```typescript
// src/components/molecules/EducationCard.tsx

import React from "react";
import { View, Image, StyleSheet, ImageSourcePropType } from "react-native";
import { Badge } from "../atoms/Badge";
import { AppText } from "../atoms/AppText";
import { colors, radius, spacing } from "../../theme";

// Importamos el tipo de BadgeProps para reutilizar el tipo
type BadgeType = "danger" | "prevention" | "guide";

interface EducationCardProps {
  imageSource: ImageSourcePropType;  // Acepta require() o { uri: "url" }
  badgeType: BadgeType;
  badgeLabel: string;
  title: string;
  onPress?: () => void;
}

export function EducationCard({
  imageSource,
  badgeType,
  badgeLabel,
  title,
}: EducationCardProps) {
  return (
    <View style={styles.container}>
      {/* Imagen con Badge encima */}
      <View style={styles.imageWrapper}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        {/* Posición absoluta: encima de la imagen */}
        <View style={styles.badgeOverlay}>
          <Badge type={badgeType} label={badgeLabel} />
        </View>
      </View>

      {/* Título de la tarjeta */}
      <AppText variant="body" style={styles.title}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,                     // Ancho fijo para scroll horizontal
    marginRight: spacing.md,
  },
  imageWrapper: {
    position: "relative",           // Para que el badge se posicione absolutamente
    borderRadius: radius.lg,
    overflow: "hidden",             // El badge no se sale del borde redondeado
  },
  image: {
    width: "100%",
    height: 120,
  },
  badgeOverlay: {
    position: "absolute",           // Se superpone sobre la imagen
    bottom: spacing.sm,
    left: spacing.sm,
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: "500",
  },
});
```

> **Concepto: `position: "absolute"`**  
> Un elemento con `position: "absolute"` se posiciona relativo a su contenedor más cercano con `position: "relative"`. No ocupa espacio en el flujo normal del layout. Equivale al `position: absolute` de CSS.

---

### 6.4 ProtocolStep (`src/components/molecules/ProtocolStep.tsx`)

Los pasos del protocolo de la segunda pantalla.

```typescript
// src/components/molecules/ProtocolStep.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../atoms/AppText";
import { colors, radius, spacing } from "../../theme";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface ProtocolStepProps {
  iconName: IoniconsName;
  title: string;
  description: string;
  showArrow?: boolean;  // Muestra la flecha derecha
}

export function ProtocolStep({
  iconName,
  title,
  description,
  showArrow = true,
}: ProtocolStepProps) {
  return (
    <View style={styles.container}>
      {/* Ícono en círculo verde */}
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={24} color={colors.primary} />
      </View>

      {/* Contenido de texto */}
      <View style={styles.textContent}>
        <AppText variant="h3" style={styles.title}>{title}</AppText>
        <AppText variant="body" style={styles.description}>{description}</AppText>
      </View>

      {/* Flecha derecha */}
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.md,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,               // No se encoge aunque haya poco espacio
  },
  textContent: {
    flex: 1,                     // Ocupa el espacio restante entre ícono y flecha
  },
  title: {
    fontSize: 15,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: colors.gray600,
  },
});
```

---

## 7. Organismos: secciones de pantalla

Los organismos son secciones completas y coherentes que agrupan moléculas y átomos.

### 7.1 HomeHeader (`src/components/organisms/HomeHeader.tsx`)

El encabezado de la pantalla principal con saludo y avatar.

```typescript
// src/components/organisms/HomeHeader.tsx

import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { AppText } from "../atoms/AppText";
import { colors, radius, spacing } from "../../theme";

interface HomeHeaderProps {
  userName: string;
  avatarUri?: string;
}

export function HomeHeader({ userName, avatarUri }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Textos de saludo */}
      <View style={styles.textGroup}>
        <AppText variant="caption">Bienvenido de nuevo</AppText>
        <AppText variant="h3">Hola, {userName}</AppText>
      </View>

      {/* Avatar del usuario */}
      {avatarUri ? (
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          {/* Indicador de estado online */}
          <View style={styles.onlineDot} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  textGroup: {
    gap: 2,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
```

---

### 7.2 StatsRow (`src/components/organisms/StatsRow.tsx`)

La fila horizontal con las dos tarjetas de estadísticas.

```typescript
// src/components/organisms/StatsRow.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { StatCard } from "../molecules/StatCard";
import { colors, spacing } from "../../theme";

interface StatsRowProps {
  reportsCount: number;
  cleanZonesCount: number;
}

export function StatsRow({ reportsCount, cleanZonesCount }: StatsRowProps) {
  return (
    <View style={styles.container}>
      <StatCard
        value={reportsCount}
        label="Reportes en tu zona"
        iconName="location"
        iconColor={colors.danger}
      />
      <StatCard
        value={cleanZonesCount}
        label="Zonas limpiadas"
        iconName="shield-checkmark"
        iconColor={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.md,
    marginVertical: spacing.md,
  },
});
```

---

### 7.3 LearnSection (`src/components/organisms/LearnSection.tsx`)

La sección "Aprende a identificarlos" con scroll horizontal.

```typescript
// src/components/organisms/LearnSection.tsx

import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { AppText } from "../atoms/AppText";
import { EducationCard } from "../molecules/EducationCard";
import { colors, spacing } from "../../theme";

// Definimos el tipo para cada ítem educativo
interface EducationItem {
  id: string;
  imageSource: any;            // any porque puede ser require() o { uri }
  badgeType: "danger" | "prevention" | "guide";
  badgeLabel: string;
  title: string;
}

interface LearnSectionProps {
  items: EducationItem[];
  onSeeAll?: () => void;
}

export function LearnSection({ items, onSeeAll }: LearnSectionProps) {
  return (
    <View style={styles.section}>
      {/* Encabezado con "Aprende a identificarlos" y "Ver todo" */}
      <View style={styles.header}>
        <AppText variant="h3">Aprende a identificarlos</AppText>
        <TouchableOpacity onPress={onSeeAll}>
          <AppText variant="caption" color={colors.primary}>
            Ver todo
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Scroll horizontal sin barra de desplazamiento visible */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <EducationCard
            key={item.id}             // Requerido para listas en React
            imageSource={item.imageSource}
            badgeType={item.badgeType}
            badgeLabel={item.badgeLabel}
            title={item.title}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingRight: spacing.md,    // Padding al final del scroll
  },
});
```

> **Concepto: `key` en listas**  
> Cuando renderizas una lista con `.map()`, React necesita que cada elemento tenga una prop `key` única. Esto permite a React identificar qué elementos cambiaron, se añadieron o se eliminaron sin re-renderizar todo. Usa siempre un ID único, nunca el índice del array (mala práctica).

---

## 8. Templates y Screens

Ahora construimos las pantallas completas.

### 8.1 HomeScreen (`src/screens/HomeScreen.tsx`)

```typescript
// src/screens/HomeScreen.tsx

import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeHeader } from "../components/organisms/HomeHeader";
import { AlertCard } from "../components/molecules/AlertCard";
import { StatsRow } from "../components/organisms/StatsRow";
import { LearnSection } from "../components/organisms/LearnSection";
import { AppText } from "../components/atoms/AppText";
import { colors, spacing } from "../theme";

// Props que recibe de la navegación
// (StackScreenProps viene de @react-navigation/stack)
interface HomeScreenProps {
  navigation: any;   // Simplificado para este tutorial
}

// Datos de ejemplo (en una app real vendrían de una API)
const EDUCATION_ITEMS = [
  {
    id: "1",
    imageSource: { uri: "https://dfloaizab.github.io/imgs/mobile/danger.png" },
    badgeType: "danger" as const,
    badgeLabel: "PELIGRO",
    title: "Riesgos para la salud",
  },
  {
    id: "2",
    imageSource: { uri: "https://dfloaizab.github.io/imgs/mobile/warning.png" },
    badgeType: "prevention" as const,
    badgeLabel: "PREVENCIÓN",
    title: "Uso de guantes",
  },
  {
    id: "3",
    imageSource: { uri: "https://dfloaizab.github.io/imgs/mobile/user-guide.png" },
    badgeType: "guide" as const,
    badgeLabel: "GUÍA",
    title: "Zonas afectadas",
  },
];

export function HomeScreen({ navigation }: HomeScreenProps) {
  // Función para manejar el botón de reporte
  const handleReport = () => {
    // Aquí iría la lógica de reporte (cámara, ubicación, etc.)
    console.log("Abriendo cámara para reportar...");
  };

  // Función para ir a la pantalla de protocolo
  const handleLearnMore = () => {
    navigation.navigate("Protocol");
  };

  return (
    // SafeAreaView respeta el notch y barras del sistema
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ORGANISMO: Encabezado */}
        <HomeHeader
          userName="Ciudadano"
          avatarUri="https://i.pravatar.cc/150?img=33"
        />

        {/* ÁTOMO: Título principal */}
        <View style={styles.heroTitle}>
          <AppText variant="h1">
            Protege nuestro{" "}
            <AppText variant="h1" color={colors.primary}>
              ecosistema
            </AppText>
            {" "}en Cali
          </AppText>
        </View>

        {/* MOLÉCULA: Tarjeta de alerta */}
        <AlertCard
          title="¡He visto un Caracol Africano!"
          buttonLabel="Reportar Ahora"
          onReportPress={handleReport}
        />

        {/* ORGANISMO: Fila de estadísticas */}
        <StatsRow reportsCount={54} cleanZonesCount={12} />

        {/* ORGANISMO: Sección educativa */}
        <LearnSection items={EDUCATION_ITEMS} onSeeAll={handleLearnMore} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroTitle: {
    marginTop: spacing.sm,
  },
});
```

---

### 8.2 ProtocolScreen (`src/screens/ProtocolScreen.tsx`)

```typescript
// src/screens/ProtocolScreen.tsx

import React from "react";
import {
  ScrollView,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../components/atoms/AppText";
import { AppButton } from "../components/atoms/AppButton";
import { ProtocolStep } from "../components/molecules/ProtocolStep";
import { colors, spacing, radius } from "../theme";

interface ProtocolScreenProps {
  navigation: any;
}

// Pasos del protocolo
const PROTOCOL_STEPS = [
  {
    id: "1",
    iconName: "hand-right" as const,
    title: "Protege tus manos",
    description: "Nunca lo toques directamente.",
  },
  {
    id: "2",
    iconName: "camera" as const,
    title: "Toma una foto",
    description: "Registra la evidencia en la app.",
  },
  {
    id: "3",
    iconName: "flask" as const,
    title: "Disposición final",
    description: "Aplica sal o cal directamente.",
  },
];

export function ProtocolScreen({ navigation }: ProtocolScreenProps) {
  const handleDownloadPDF = () => {
    console.log("Descargando PDF oficial...");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra de navegación custom */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <AppText variant="h3">Protocolo de Manejo</AppText>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Imagen de cabecera */}
        <Image
          source={{ uri: "https://dfloaizab.github.io/imgs/mobile/forest.jpg" }}
          style={styles.headerImage}
          resizeMode="cover"
        />

        {/* Título y descripción */}
        <View style={styles.titleSection}>
          <AppText variant="h2">
            Qué hacer si encuentras un Caracol Africano
          </AppText>
          <AppText variant="body" style={styles.description}>
            Sigue estos pasos cruciales para garantizar tu seguridad y la salud
            pública de tu comunidad.
          </AppText>
        </View>

        {/* Lista de pasos */}
        <View style={styles.stepsContainer}>
          {PROTOCOL_STEPS.map((step) => (
            <ProtocolStep
              key={step.id}
              iconName={step.iconName}
              title={step.title}
              description={step.description}
            />
          ))}
        </View>

        {/* Botón de descarga */}
        <AppButton
          label="Descargar PDF oficial del protocolo"
          onPress={handleDownloadPDF}
          variant="primary"
          style={styles.downloadButton}
          icon={<Ionicons name="download-outline" size={18} color={colors.white} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    padding: spacing.xs,
  },
  shareButton: {
    padding: spacing.xs,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  headerImage: {
    width: "100%",
    height: 220,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  titleSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  description: {
    lineHeight: 24,
  },
  stepsContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  downloadButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
});
```

---

## 9. Navegación entre pantallas

### 9.1 AppNavigator (`src/navigation/AppNavigator.tsx`)

```typescript
// src/navigation/AppNavigator.tsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { HomeScreen } from "../screens/HomeScreen";
import { ProtocolScreen } from "../screens/ProtocolScreen";

// Definición de las rutas y sus parámetros
// undefined = la ruta no recibe parámetros
export type RootStackParamList = {
  Home: undefined;
  Protocol: undefined;
};

// Creamos el navegador con tipo
const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,   // Ocultamos el header por defecto (usamos el nuestro)
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Protocol" component={ProtocolScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 9.2 App.tsx — Punto de entrada

```typescript
// App.tsx (en la raíz del proyecto)

import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
```

> **Concepto: `SafeAreaProvider`**  
> Debe envolver toda la aplicación para que `SafeAreaView` funcione correctamente. Calcula los insets (espacios) del notch, la barra de estado y la barra de navegación del sistema operativo.

---

## 10. Deploy en Expo Go

### 10.1 Probar en tu teléfono (desarrollo)

```bash
# Asegúrate de estar en la carpeta del proyecto
cd EcosistemaApp

# Inicia el servidor de Expo
npx expo start
```

En la terminal verás un **código QR**. Escanéalo con la app **Expo Go** desde tu teléfono. Tu celular y tu computador deben estar en la **misma red WiFi**.

### 10.2 Flujo de trabajo recomendado

```
Editas código en VS Code
       ↓
Guardas el archivo (Ctrl+S)
       ↓
Expo detecta el cambio automáticamente
       ↓
La app en tu celular se actualiza en 1-2 segundos
```

### 10.3 Comandos útiles del CLI de Expo

| Comando | Descripción |
|---------|-------------|
| `npx expo start` | Inicia el servidor de desarrollo |
| `npx expo start --tunnel` | Usa un túnel si no estás en la misma red |
| `npx expo start --clear` | Limpia la caché (útil si algo no actualiza) |
| `r` en la terminal | Recarga manualmente la app |
| `m` en la terminal | Abre el menú de desarrollador |
| `Ctrl+C` | Detiene el servidor |

### 10.4 Compartir con otros (sin instalar nada)

```bash
# Publica el proyecto en la nube de Expo
npx expo publish
```

Esto genera una URL que cualquier persona con Expo Go puede abrir.

### 10.5 Solución de problemas comunes

| Problema | Solución |
|----------|----------|
| La app no carga el QR | Ejecuta `npx expo start --tunnel` |
| Error "Module not found" | Ejecuta `npm install` y reinicia |
| Estilos no se ven como esperas | Verifica `flex`, `width`, y `alignItems` |
| Las imágenes no cargan | Verifica la URL o la ruta del require() |
| El `gap` no funciona | Actualiza a React Native 0.71+ |

---

## 11. Resumen y próximos pasos

### Lo que construiste

```
src/
├── theme/index.ts              ✅ Sistema de diseño centralizado
├── components/
│   ├── atoms/
│   │   ├── AppText.tsx         ✅ Tipografía reutilizable con variantes
│   │   ├── AppButton.tsx       ✅ Botón con variantes y estados
│   │   └── Badge.tsx           ✅ Etiqueta de categoría
│   ├── molecules/
│   │   ├── AlertCard.tsx       ✅ Tarjeta de alerta principal
│   │   ├── StatCard.tsx        ✅ Tarjeta de métrica
│   │   ├── EducationCard.tsx   ✅ Tarjeta educativa con imagen
│   │   └── ProtocolStep.tsx    ✅ Paso del protocolo
│   └── organisms/
│       ├── HomeHeader.tsx      ✅ Encabezado con avatar
│       ├── StatsRow.tsx        ✅ Fila de estadísticas
│       └── LearnSection.tsx    ✅ Sección con scroll horizontal
├── screens/
│   ├── HomeScreen.tsx          ✅ Pantalla principal
│   └── ProtocolScreen.tsx      ✅ Pantalla de protocolo
└── navigation/
    └── AppNavigator.tsx        ✅ Navegación tipo stack
```

### Conceptos que aprendiste

- **TypeScript:** interfaces, tipos, genéricos (`Record<K,V>`)
- **Props:** tipado, valores por defecto, props opcionales
- **Hooks:** `useState`, `useEffect` (bases)
- **Flexbox en RN:** `flex`, `flexDirection`, `gap`, `alignItems`
- **Posicionamiento:** `position: "absolute"` y `"relative"`
- **Navegación:** Stack Navigator, `navigation.navigate()`, `navigation.goBack()`
- **Componentes nativos:** `ScrollView`, `Image`, `TouchableOpacity`, `SafeAreaView`
- **Atomic Design:** átomos → moléculas → organismos → screens

### Próximos pasos sugeridos

1. **Conectar una API real** con `fetch` o `axios` para los datos del servidor
2. **Agregar la cámara** con `expo-camera` para el reporte de avistamientos
3. **Mapa de reportes** con `react-native-maps`
4. **Autenticación** con `expo-auth-session`
5. **Publicar en producción** con `eas build` (Expo Application Services)

---

*Semillero Informa — App Caracol Africano - 2026*  
*Made by humans with heart and soul*
