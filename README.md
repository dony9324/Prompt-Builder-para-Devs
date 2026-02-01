# Prompt Builder para Devs
Una herramienta web para **construir, reutilizar y versionar prompts técnicos** usando bloques modulares, con predicciones inteligentes y backup en GitHub Gist.

Pensada para desarrolladores que usan IA a diario y no quieren volver a escribir el mismo prompt una y otra vez.



1️⃣ Gestión de Bloques (Core)
✔ Creación de bloques

Crear bloques personalizados desde la UI

Campos:

Categoría / Grupo

Título

Contenido

Persistencia automática en localStorage

✔ Edición de bloques

Edición mediante clic derecho

Reutiliza el mismo formulario de creación

Permite:

Cambiar título

Cambiar contenido

Cambiar categoría del bloque

Modo edición visual (botón cambia a “Actualizar”)

✔ Eliminación de bloques

Eliminación segura mediante:

Shift + clic derecho

Confirmación previa

Limpieza automática de:

selección

relaciones

estado persistido

✔ Favoritos

Bloques pueden marcarse como favoritos

Estado persistente

Preparado para vistas filtradas o accesos rápidos

2️⃣ Organización y Taxonomía
✔ Categorías (Taxonomy)

Sistema de grupos:

Rol / Perfil

Objetivo / Tarea

Plataforma / Stack

Lenguaje

UI / Layout

Arquitectura

Restricciones

Output

Complejidad

Contexto

Navegación por pestañas

✔ Conteo de bloques

Conteo total de bloques en la librería

Conteo por categoría en cada pestaña

Actualización automática al:

crear

editar

eliminar

importar / restaurar

3️⃣ Construcción del Prompt
✔ Inserción inteligente

Inserción de bloques exactamente donde está el cursor

Uso de:

selectionStart

selectionEnd

No rompe el flujo de escritura

✔ Editor libre

El usuario puede escribir texto manualmente

Combinar texto libre + bloques

El contenido del editor se guarda automáticamente

✔ Persistencia atómica

Cualquier cambio se guarda:

escritura en textarea

selección de bloques

creación / edición / borrado

No existe botón “Guardar” obligatorio

4️⃣ Sugerencias Inteligentes (Predicciones)
✔ Sistema de co-ocurrencia

Aprende qué bloques se usan juntos

Registra relaciones bloque ↔ bloque

No usa IA externa ni ML

✔ Panel de sugerencias

Muestra bloques relacionados no seleccionados

Ordenados por relevancia histórica

Inserción directa con un clic

5️⃣ Plantillas (Combinaciones)
✔ Guardado de combinaciones

Guardar selección actual como plantilla

Cada plantilla incluye:

nombre

bloques asociados

fecha de creación

✔ Aplicación de plantillas

Aplicar plantilla con un clic

Restaura selección de bloques

Reconstruye prompt

6️⃣ Descomposición de Código (Mock IA)
✔ Entrada de código

Área para pegar código fuente

✔ Análisis simulado

Genera:

descripción

responsabilidades

Mock sin API externa

✔ Inserción en prompt

Resultado puede insertarse en el editor

7️⃣ Persistencia y Recuperación
✔ Almacenamiento local

Todo el estado se guarda en localStorage

Incluye:

bloques

selección

relaciones

plantillas

prompt

✔ Export / Import JSON

Exportar toda la configuración

Importar y restaurar estado completo

Normalización de datos antiguos

✔ Backup en GitHub Gist

Guardado remoto del estado completo

Restauración desde Gist

Portabilidad total entre equipos

✔ Gestión de token GitHub

Token solicitado solo cuando es necesario

Guardado seguro en localStorage

Scope mínimo requerido: gist

8️⃣ UX, Seguridad y Robustez
✔ Modal de instrucciones

Accesible desde botón

Explica:

uso de bloques

persistencia

backups

limitaciones de file://

✔ Advertencias de entorno

Advertencia clara sobre pérdida de datos al mover carpetas

Recomendaciones:

servidor local

Gist

exportación JSON

✔ Normalización de estado

Compatibilidad con datos antiguos

Conversión segura de:

arrays → Set

propiedades faltantes

✔ Accesibilidad básica

Cierre de modales con Esc

Scroll interno en paneles

Feedback visual de acciones

9️⃣ Arquitectura Técnica
✔ Stack

HTML

CSS

JavaScript (Vanilla)

✔ Principios

Sin backend

Sin frameworks

Sin dependencias externas

Estado centralizado

Funciones puras donde es posible

🔚 Resumen Ejecutivo

Tu herramienta es actualmente:

Un editor de prompts modular, persistente y portable,
pensado para desarrolladores que trabajan con IA de forma intensiva.

Cumple con:

edición real

persistencia confiable

recuperación ante fallos

UX de herramienta profesional

🛣️ Funcionalidades NO implementadas (aún)

Para dejarlo claro:

❌ Undo / Redo

❌ Versionado de prompts

❌ Multi-perfil

❌ Colaboración en tiempo real

❌ IA real para análisis (solo mock)