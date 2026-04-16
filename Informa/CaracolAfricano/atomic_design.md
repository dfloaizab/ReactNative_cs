# Atomic Design en React Native (.tsx)
## Semilero Informa 2026
### Estructura, Filosofía y Ejemplos Aplicados a CampusQuest

---

## ¿Qué es Atomic Design?

Atomic Design es una metodología creada por **Brad Frost** que organiza los componentes de una interfaz de la misma forma en que la química describe la materia: desde las partículas más pequeñas e indivisibles hasta estructuras complejas y completas.

La idea central es que **una UI no se construye de pantallas enteras, sino de piezas pequeñas que se ensamblan progresivamente.**

```
Átomos → Moléculas → Organismos → Plantillas → Páginas
  ↑           ↑            ↑            ↑           ↑
mínimo    combinación  sección      layout     pantalla
indivisible  de átomos  completa    sin datos  con datos reales
```

Aplicado a React Native con TypeScript, esta metodología resuelve tres problemas comunes:
- Componentes gigantes e imposibles de mantener
- Código duplicado en distintas pantallas
- Dificultad para hacer pruebas unitarias

---

## Estructura de Carpetas Recomendada

```
react-native-starter/
└── components/
    ├── atoms/
    │   ├── AppText.tsx
    │   ├── AppButton.tsx
    │   ├── AppInput.tsx
    │   ├── Badge.tsx
    │   └── StationMarker.tsx
    ├── molecules/
    │   ├── FormField.tsx
    │   ├── StationCard.tsx
    │   └── ScoreIndicator.tsx
    ├── organisms/
    │   ├── LoginForm.tsx
    │   ├── StationList.tsx
    │   └── CampusMapView.tsx
    ├── templates/
    │   ├── AuthTemplate.tsx
    │   └── MapTemplate.tsx
    └── index.ts              ← Exporta todo desde un solo punto
```

> **Regla de oro:** Un componente de nivel superior **puede** usar componentes de niveles inferiores, pero **nunca al revés**. Un átomo no importa un organismo.

---

## Anatomía de un Componente `.tsx`

Antes de ver los niveles, es importante entender la estructura interna de cualquier componente en React Native con TypeScript:

```tsx
// 1. IMPORTS — siempre primero
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// 2. TIPOS / INTERFACES — definen el contrato del componente (sus props)
interface MiComponenteProps {
  titulo: string;           // Prop obligatoria
  subtitulo?: string;       // Prop opcional (el ? la hace opcional)
  onPresionar: () => void;  // Prop que es una función (callback)
  activo?: boolean;
}

// 3. COMPONENTE — función que recibe props y retorna JSX
// Se desestructuran las props directamente en los parámetros
export default function MiComponente({
  titulo,
  subtitulo = 'Valor por defecto',  // Default value si no se pasa la prop
  onPresionar,
  activo = false,
}: MiComponenteProps) {

  // 4. ESTADO LOCAL — con useState
  const [contador, setContador] = useState<number>(0);

  // 5. EFECTOS — con useEffect
  useEffect(() => {
    // Código que se ejecuta después del render
    // (llamadas a API, suscripciones, etc.)
    console.log('Componente montado');

    return () => {
      // Función de limpieza: se ejecuta al desmontar el componente
      console.log('Componente desmontado');
    };
  }, []); // El array vacío [] significa "solo al montar"

  // 6. LÓGICA / HANDLERS — funciones que manejan eventos
  const handlePress = () => {
    setContador(prev => prev + 1);
    onPresionar(); // Notifica al componente padre
  };

  // 7. RENDERIZADO — retorna el árbol de elementos JSX
  return (
    <View style={[styles.contenedor, activo && styles.contenedorActivo]}>
      <Text style={styles.titulo}>{titulo}</Text>
      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      <TouchableOpacity onPress={handlePress}>
        <Text>Presionado: {contador} veces</Text>
      </TouchableOpacity>
    </View>
  );
}

// 8. ESTILOS — siempre al final, fuera del componente
// StyleSheet.create() valida los estilos en tiempo de desarrollo
const styles = StyleSheet.create({
  contenedor: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  contenedorActivo: {
    backgroundColor: '#E8F0FE', // Se combina con el estilo base
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003087',
  },
  subtitulo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
});
```

---

## Nivel 1: Átomos

**Son la unidad mínima de la UI.** No se pueden descomponer más sin perder su utilidad. No contienen lógica de negocio, solo presentación. Reciben todo por props.

**Ejemplos:** un texto estilizado, un botón, un campo de entrada, un ícono, una imagen, un indicador de carga.

**Características:**
- Sin estado propio (o estado mínimo de presentación)
- Sin llamadas a APIs
- Altamente reutilizables en toda la app
- Fáciles de probar con pruebas unitarias

---

### Ejemplo: `atoms/AppButton.tsx`

```tsx
// components/atoms/AppButton.tsx
// El botón más básico de la app. No sabe nada del dominio del negocio
// (no sabe si es un botón de login, de gymkhana, o de otra cosa).
// Solo sabe cómo verse y qué hacer cuando lo tocan.

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';

// El tipo de variante define la apariencia visual
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;        // Permite estilos adicionales desde el padre
}

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
}: AppButtonProps) {

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],             // Aplica el estilo de la variante elegida
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,                        // Estilos externos tienen la última palabra
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {isLoading
        ? <ActivityIndicator color="#FFFFFF" size="small" />
        : <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// Los estilos usan un Record con las variantes para escalar fácilmente
const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variantes de color
  primary:   { backgroundColor: '#003087' },
  secondary: { backgroundColor: '#00843D' },
  danger:    { backgroundColor: '#C62828' },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#003087',
  },

  // Labels de cada variante
  label:          { fontSize: 16, fontWeight: '700' },
  primaryLabel:   { color: '#FFFFFF' },
  secondaryLabel: { color: '#FFFFFF' },
  dangerLabel:    { color: '#FFFFFF' },
  ghostLabel:     { color: '#003087' },
});
```

---

### Ejemplo: `atoms/AppInput.tsx`

```tsx
// components/atoms/AppInput.tsx
// Campo de texto reutilizable. Maneja su propio estado de foco
// para dar feedback visual, pero no valida ni procesa los datos.

import React, { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps, ViewStyle, View } from 'react-native';

interface AppInputProps extends TextInputProps {
  // Extiende TextInputProps para heredar todas las props nativas
  // (value, onChangeText, placeholder, secureTextEntry, etc.)
  hasError?: boolean;
  containerStyle?: ViewStyle;
}

export default function AppInput({ hasError = false, containerStyle, ...rest }: AppInputProps) {
  // Estado de foco: puramente visual, no afecta la lógica del negocio
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={containerStyle}>
      <TextInput
        style={[
          styles.input,
          isFocused && styles.focused,
          hasError && styles.error,
        ]}
        placeholderTextColor="#A0AEC0"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...rest}  // Pasa todas las demás props al TextInput nativo
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#DDE3F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A202C',
    backgroundColor: '#F7F8FC',
  },
  focused: {
    borderColor: '#003087',
    backgroundColor: '#FFFFFF',
    // Sombra sutil al enfocar (solo iOS)
    shadowColor: '#003087',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  error: {
    borderColor: '#E53935',
    backgroundColor: '#FFF5F5',
  },
});
```

---

### Ejemplo: `atoms/AppText.tsx`

```tsx
// components/atoms/AppText.tsx
// Texto tipográfico consistente en toda la app.
// Centraliza los estilos de fuente para que un cambio aquí
// se refleje en toda la interfaz.

import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
type TextColor  = 'primary' | 'secondary' | 'muted' | 'white' | 'error';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: TextColor;
  bold?: boolean;
  style?: TextStyle;
  children: React.ReactNode;
}

export default function AppText({
  variant = 'body',
  color = 'primary',
  bold = false,
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        styles[variant],
        styles[`color_${color}`],
        bold && styles.bold,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  // Variantes tipográficas
  h1:      { fontSize: 28, fontWeight: '900', lineHeight: 34 },
  h2:      { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3:      { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body:    { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label:   { fontSize: 13, fontWeight: '600', lineHeight: 18, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Paleta de colores
  color_primary:   { color: '#1A202C' },
  color_secondary: { color: '#003087' },
  color_muted:     { color: '#718096' },
  color_white:     { color: '#FFFFFF' },
  color_error:     { color: '#C62828' },

  bold: { fontWeight: '700' },
});
```

---

## Nivel 2: Moléculas

**Son combinaciones de 2 o más átomos** que trabajan juntos para cumplir una función específica de presentación. Pueden tener algo de lógica local (validación de formato, por ejemplo), pero siguen sin conocer el negocio.

**Ejemplos:** un campo de formulario con su etiqueta y mensaje de error, una tarjeta de estación, un indicador de puntuación.

**Características:**
- Importan y usan átomos
- Pueden tener estado local simple
- Siguen siendo reutilizables, pero en contextos más específicos

---

### Ejemplo: `molecules/FormField.tsx`

```tsx
// components/molecules/FormField.tsx
// Combina: AppText (etiqueta) + AppInput (campo) + AppText (error)
// Esta combinación aparece en TODOS los formularios de la app,
// por eso tiene sentido encapsularla en una molécula.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '../atoms/AppText';
import AppInput from '../atoms/AppInput';
import type { TextInputProps } from 'react-native';

interface FormFieldProps extends TextInputProps {
  label: string;
  errorMessage?: string;  // Si hay error, se muestra en rojo debajo del input
  hint?: string;          // Texto de ayuda opcional (gris, debajo del input)
}

export default function FormField({
  label,
  errorMessage,
  hint,
  ...inputProps  // Todo lo demás se pasa directo al AppInput (TextInput)
}: FormFieldProps) {

  const hasError = !!errorMessage;

  return (
    <View style={styles.container}>
      {/* Átomo: etiqueta del campo */}
      <AppText variant="label" color="muted" style={styles.label}>
        {label}
      </AppText>

      {/* Átomo: campo de entrada */}
      <AppInput hasError={hasError} {...inputProps} />

      {/* Átomo: mensaje de error (solo se renderiza si hay error) */}
      {hasError && (
        <AppText variant="caption" color="error" style={styles.errorText}>
          ⚠️ {errorMessage}
        </AppText>
      )}

      {/* Átomo: mensaje de ayuda (solo si no hay error y existe hint) */}
      {!hasError && hint && (
        <AppText variant="caption" color="muted" style={styles.hint}>
          {hint}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label:     { marginBottom: 6 },
  errorText: { marginTop: 4 },
  hint:      { marginTop: 4 },
});
```

---

### Ejemplo: `molecules/StationCard.tsx`

```tsx
// components/molecules/StationCard.tsx
// Tarjeta que representa una estación del gymkhana en la lista.
// Combina un ícono de bloque (átomo), texto descriptivo (átomo)
// y un badge de estado (átomo).

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import AppText from '../atoms/AppText';
import Badge from '../atoms/Badge';

interface StationCardProps {
  locId: string;
  name: string;
  block: number;
  floor?: number;
  isCompleted: boolean;
  onPress: (locId: string) => void;
}

export default function StationCard({
  locId,
  name,
  block,
  floor,
  isCompleted,
  onPress,
}: StationCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.cardCompleted]}
      onPress={() => onPress(locId)}
      activeOpacity={0.75}
    >
      {/* Ícono circular con número de bloque */}
      <View style={[styles.blockIcon, isCompleted && styles.blockIconCompleted]}>
        <AppText variant="h3" color="white" bold>
          {block}
        </AppText>
      </View>

      {/* Info textual */}
      <View style={styles.info}>
        <AppText variant="h3" color="secondary" bold numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" color="muted">
          Bloque {block}{floor && floor > 1 ? ` · Piso ${floor}` : ''}
        </AppText>
      </View>

      {/* Badge de estado */}
      <Badge
        label={isCompleted ? '✓ Completada' : 'Pendiente'}
        variant={isCompleted ? 'success' : 'default'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#EDF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardCompleted: {
    borderColor: '#00843D',
    backgroundColor: '#F0FAF5',
  },
  blockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#003087',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blockIconCompleted: {
    backgroundColor: '#00843D',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
});
```

---

## Nivel 3: Organismos

**Son secciones completas y funcionales de la UI.** Pueden tener lógica de negocio real: llamadas a la API, manejo de estado complejo, validaciones de dominio. Combinan moléculas (y a veces átomos directamente).

**Ejemplos:** un formulario de login completo, la lista de estaciones con carga desde el backend, el mapa del campus con todos sus controles.

**Características:**
- Importan moléculas y átomos
- Pueden hacer llamadas a servicios/APIs
- Tienen estado de carga, error y datos
- Se enfocan en una sección específica de la pantalla

---

### Ejemplo: `organisms/LoginForm.tsx`

```tsx
// components/organisms/LoginForm.tsx
// Organismo completo de autenticación.
// Sabe cómo validar los campos, llamar al servicio de login
// y notificar al padre si fue exitoso.
// La pantalla (Template/Page) solo lo renderiza y recibe el resultado.

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import FormField from '../molecules/FormField';    // Molécula
import AppButton from '../atoms/AppButton';         // Átomo
import AppText from '../atoms/AppText';             // Átomo
import { login } from '../../services/auth.service';

interface LoginFormProps {
  // Callback: el organismo avisa a la pantalla que el login fue exitoso
  onSuccess: (username: string) => void;
}

// Tipo del estado del formulario
interface FormState {
  username: string;
  password: string;
}

// Tipo de errores por campo
interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [form, setForm] = useState<FormState>({ username: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Actualiza un campo del formulario y limpia su error asociado
  const handleChange = (field: keyof FormState) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
  };

  // Valida todos los campos y retorna true si todo está bien
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.username.trim()) {
      newErrors.username = 'El usuario es obligatorio';
    } else if (form.username.trim().length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres';
    }

    if (!form.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;  // Detiene si hay errores de validación

    setIsLoading(true);
    try {
      const result = await login({
        username: form.username.trim().toLowerCase(),
        password: form.password,
      });
      onSuccess(result.user.username);  // Notifica al padre
    } catch (err: any) {
      setErrors({
        general: err.response?.data?.message || 'Error de conexión. Intenta de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Molécula: campo de usuario */}
      <FormField
        label="Usuario"
        placeholder="Tu usuario USC"
        value={form.username}
        onChangeText={handleChange('username')}
        errorMessage={errors.username}
        autoCapitalize="none"
        returnKeyType="next"
      />

      {/* Molécula: campo de contraseña */}
      <FormField
        label="Contraseña"
        placeholder="Tu contraseña"
        value={form.password}
        onChangeText={handleChange('password')}
        errorMessage={errors.password}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {/* Error general del sistema (no de validación de campo) */}
      {errors.general && (
        <View style={styles.generalError}>
          <AppText variant="caption" color="error">⚠️ {errors.general}</AppText>
        </View>
      )}

      {/* Átomo: botón de envío */}
      <AppButton
        label="Entrar al Campus"
        onPress={handleSubmit}
        variant="primary"
        isLoading={isLoading}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  generalError: {
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#C62828',
  },
});
```

---

## Nivel 4: Plantillas (Templates)

**Son los esqueletos de las pantallas.** Definen el layout (disposición espacial) pero **no tienen datos reales**: reciben todo por props. Permiten ver cómo queda la estructura antes de conectar el backend.

**Características:**
- Importan organismos, moléculas y átomos
- No hacen llamadas a APIs
- Definen márgenes, scroll, posicionamiento
- Son los "wireframes interactivos" del código

---

### Ejemplo: `templates/AuthTemplate.tsx`

```tsx
// components/templates/AuthTemplate.tsx
// Define el layout visual de todas las pantallas de autenticación.
// El logo, el fondo azul, el scroll y la tarjeta blanca.
// No sabe qué formulario va adentro; eso lo decide la Page.

import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import AppText from '../atoms/AppText';

interface AuthTemplateProps {
  title: string;
  subtitle?: string;
  LogoComponent: React.ReactNode;   // El logo se inyecta desde afuera
  children: React.ReactNode;        // El formulario/organismo va aquí
  footerText?: string;
}

export default function AuthTemplate({
  title,
  subtitle,
  LogoComponent,
  children,
  footerText,
}: AuthTemplateProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Zona del logo (viene de afuera) */}
        <View style={styles.logoZone}>
          {LogoComponent}
          <AppText variant="h2" color="white" bold style={styles.title}>
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="caption" color="white" style={styles.subtitle}>
              {subtitle}
            </AppText>
          )}
        </View>

        {/* Tarjeta blanca donde van los organismos */}
        <View style={styles.card}>
          {children}
        </View>

        {/* Footer opcional */}
        {footerText && (
          <AppText variant="caption" color="white" style={styles.footer}>
            {footerText}
          </AppText>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#003087' },
  scroll:   { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoZone: { alignItems: 'center', marginBottom: 28 },
  title:    { marginTop: 12, textAlign: 'center' },
  subtitle: { marginTop: 4, opacity: 0.75, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  footer: { textAlign: 'center', marginTop: 24, opacity: 0.6 },
});
```

---

## Nivel 5: Páginas (Pages)

**Son las pantallas reales de la app.** En Expo Router, corresponden a los archivos dentro de `app/(tabs)/`. Instancian la plantilla con datos reales, coordinan organismos y manejan la navegación.

**Características:**
- Importan templates, organismos y el router
- Coordinan múltiples organismos si la pantalla es compleja
- Manejan la navegación entre pantallas
- Son el punto de entrada de cada ruta

---

### Ejemplo: `app/(tabs)/index.tsx` (la Page de Login)

```tsx
// app/(tabs)/index.tsx
// LA PANTALLA DE LOGIN — usando Atomic Design completo.
// Esta es la versión refactorizada del index.tsx anterior.
// Notarás que este archivo es MUCHO más corto y legible
// porque toda la lógica está distribuida en los niveles anteriores.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AuthTemplate from '../../components/templates/AuthTemplate';  // Template
import LoginForm from '../../components/organisms/LoginForm';         // Organismo

export default function LoginPage() {

  // La Page maneja la NAVEGACIÓN, no la lógica del formulario
  const handleLoginSuccess = (username: string) => {
    console.log(`✅ Login exitoso: ${username}`);
    router.replace('/(tabs)/explore');
  };

  return (
    <AuthTemplate
      title="CampusQuest"
      subtitle="Gymkhana Institucional · Citadela Pampalinda"
      LogoComponent={
        // Aquí iría el componente de logo real
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoEmoji}>🎓</Text>
        </View>
      }
      footerText="Facultad de Ingeniería · USC · Cali, Colombia"
    >
      {/* El organismo maneja toda la lógica del formulario */}
      <LoginForm onSuccess={handleLoginSuccess} />
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  logoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoEmoji: { fontSize: 44 },
});
```

---

## Comparación Visual: Antes vs. Después

```
ANTES (sin Atomic Design):            DESPUÉS (con Atomic Design):
───────────────────────────           ────────────────────────────────────────
app/(tabs)/index.tsx                  app/(tabs)/index.tsx
│                                     │   └── AuthTemplate (template)
│  ← 300+ líneas mezclando:               └── LoginForm (organism)
│    • layout                                   ├── FormField x2 (molecule)
│    • estilos                                  │     ├── AppText (atom)
│    • validación                               │     └── AppInput (atom)
│    • llamada al API                           └── AppButton (atom)
│    • manejo de errores
│    • navegación
│                                     Cada archivo: 30–80 líneas
│                                     Cada pieza: un solo propósito
```

---

## Reglas Prácticas para Decidir el Nivel

Cuando crees un componente, hazte estas preguntas en orden:

```
¿Puede descomponerse en partes más pequeñas?
        │
        NO → Es un ÁTOMO
        │
        SÍ ↓
¿Combina átomos para una función de presentación específica?
        │
        SÍ → Es una MOLÉCULA
        │
        NO ↓
¿Tiene lógica de negocio o llama a una API?
        │
        SÍ → Es un ORGANISMO
        │
        NO ↓
¿Define el layout de una pantalla sin datos reales?
        │
        SÍ → Es una PLANTILLA
        │
        NO → Es una PÁGINA (archivo en app/)
```

---

## Archivo de Exportación Central

Crea **`components/index.ts`** para importar desde un solo lugar:

```typescript
// components/index.ts
// Barrel file: exporta todos los componentes públicos.
// Ventaja: los imports en las páginas son más limpios.

// Átomos
export { default as AppText }   from './atoms/AppText';
export { default as AppButton } from './atoms/AppButton';
export { default as AppInput }  from './atoms/AppInput';
export { default as Badge }     from './atoms/Badge';

// Moléculas
export { default as FormField }    from './molecules/FormField';
export { default as StationCard }  from './molecules/StationCard';

// Organismos
export { default as LoginForm }    from './organisms/LoginForm';
export { default as StationList }  from './organisms/StationList';
export { default as CampusMapView} from './organisms/CampusMapView';

// Templates
export { default as AuthTemplate } from './templates/AuthTemplate';
export { default as MapTemplate }  from './templates/MapTemplate';
```

Así, en cualquier pantalla puedes importar así:

```tsx
// Sin barrel file (tedioso y frágil):
import AppButton from '../../components/atoms/AppButton';
import FormField from '../../components/molecules/FormField';
import LoginForm from '../../components/organisms/LoginForm';

// Con barrel file (limpio y mantenible):
import { AppButton, FormField, LoginForm } from '../../components';
```

---

## Resumen Final

| Nivel | ¿Qué es? | ¿Llama API? | ¿Tiene estado? | Ejemplo CampusQuest |
|---|---|---|---|---|
| **Átomo** | Pieza mínima e indivisible | ❌ | Mínimo (foco, hover) | `AppButton`, `AppInput`, `AppText` |
| **Molécula** | 2+ átomos con función conjunta | ❌ | Simple (validación visual) | `FormField`, `StationCard` |
| **Organismo** | Sección funcional completa | ✅ | Complejo (datos, errores) | `LoginForm`, `CampusMapView` |
| **Plantilla** | Esqueleto de layout sin datos | ❌ | ❌ | `AuthTemplate`, `MapTemplate` |
| **Página** | Pantalla real con navegación | Delega | Delega | `index.tsx`, `explore.tsx` |

> **La regla más importante:** cada componente debe tener **un solo motivo para cambiar**. Si encuentras que necesitas modificar un componente por dos razones distintas (por ejemplo, el diseño cambió Y la lógica de negocio cambió), es una señal de que debe dividirse en dos componentes de niveles diferentes.

---

*Guía de Atomic Design para CampusQuest · USC · Bootcamp Sesión 2 · Abril 2026*
