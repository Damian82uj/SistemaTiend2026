# Aura Boutique - Rediseño Integral y Reorganización Comercial

Plan arquitectónico para eliminar el apartado número 1 (Inicio), reorganizar los módulos operativos de la tienda de ropa y aplicar un diseño web comercial profesional, elegante y acogedor, libre de estéticas genéricas o futuristas.

> [!IMPORTANT]
> **Decisiones clave confirmadas por el usuario:**
> - **Eliminación del Apartado 1**: Se suprime definitivamente la pantalla de *Inicio / Panel Principal* (`dashboard`).
> - **Módulo de entrada principal**: Al abrir el sistema, se iniciará de forma directa en **Punto de Venta y Cobros**.
> - **Organización del Punto de Venta**: Distribución en pantalla dividida con catálogo de prendas/modelos y selector de talles a la izquierda, y panel de ticket, cobro y cálculo en tiempo real a la derecha.
> - **Paleta de Colores**: Base crema (`#FAF7F2`), blanco cálido (`#FFFFFF`), lino/beige (`#EADFD5`), con acentos en rosa empolvado (`#C87D83`), verde salvia (`#4F725B`) y texto en tonos café moca profundo (`#2D241E`), garantizando descanso visual y alta legibilidad.

---

## 1. Visión General del Sistema Comercial

El sistema se enfoca en la gestión ágil y real de una boutique de indumentaria. Al ingresar, la encargada accede inmediatamente a su herramienta principal de trabajo diario (el Punto de Venta), eliminando paneles decorativos intermedios.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   AURA BOUTIQUE                                        │
│  Sistema Comercial Operativo (Sin inicio superfluo · Enfoque de mostrador diario)      │
├────────────────────┬───────────────────────────────────────────────────────────────────┤
│ Menú Lateral       │ Vista Operativa Principal (Punto de Venta por defecto)           │
│                    │                                                                   │
│ 1. Punto de Venta  │ ┌──────────────────────────────┬────────────────────────────────┐ │
│ 2. Inventario      │ │ Catálogo y Prendas           │ Ticket de Venta Actual         │ │
│ 3. Historial       │ │                              │                                │ │
│ 4. Cambios         │ │ [Buscador SKU / Prenda]      │ - Remera Lino (M) x1   $18.500 │ │
│ 5. Clientes        │ │ [Filtros: Vestidos, Tops...] │ - Pantalón Wide (40)x1 $34.000 │ │
│ 6. Deudas          │ │                              │ ────────────────────────────── │ │
│ 7. Proveedores     │ │ [ Tarjetas de Prendas      ] │ Subtotal:              $52.500 │ │
│ 8. Cuenta de Caja  │ │ [ Talles, Colores y Stock  ] │ Descuento / Cupón:          $0 │ │
│ 9. Reportes        │ │                              │ Total a Cobrar:        $52.500 │ │
│                    │ │                              │                                │ │
│                    │ │                              │ [Métodos de Pago: Efectivo,    │ │
│                    │ │                              │  Transferencia, Tarjeta, Fía]  │ │
│                    │ │                              │                                │ │
│                    │ │                              │ [ Botón Confirmar y Cobrar ]   │ │
│                    │ └──────────────────────────────┴────────────────────────────────┘ │
└────────────────────┴───────────────────────────────────────────────────────────────────┘
```

---

## 2. Reorganización del Menú y Eliminación del Apartado 1

### Módulos que quedan activos y su nueva numeración:
1. **Punto de venta y cobros** (`sales`): Facturación inmediata, selección de prendas, asignación de cliente, múltiples métodos de pago e impresión de ticket.
2. **Inventario y prendas** (`inventory`): Catálogo completo, altas, edición de precios (costo y venta), gestión por talles/colores y alertas de stock mínimo.
3. **Historial de ventas** (`history`): Registro cronológico de operaciones, comprobantes emitidos, reimpresión y anulación justificada.
4. **Cambios y devoluciones** (`exchanges`): Gestión de cambio de prenda por talle o modelo, cálculo de diferencias a favor o en contra y notas de crédito.
5. **Clientes** (`clients`): Directorio de clientes con contacto, historial de compras acumuladas y saldo de cuenta corriente.
6. **Pagos pendientes y deudas** (`debts`): Seguimiento de clientes con compras fiadas, recepción de pagos a cuenta y recibos de cancelación.
7. **Compras a proveedores** (`purchases`): Registro de facturas de mercadería entrante, actualización automática del costo de reposición y stock.
8. **Cuenta de caja** (`cash`): Apertura con fondo inicial, control estricto de dinero físico en cajón vs. medios digitales (tarjeta/transferencia), gastos operativos y arqueo de cierre con cálculo de diferencias.
9. **Reportes y estadísticas** (`reports`): Balances reales de recaudación, rentabilidad y prendas más vendidas.

---

## 3. Identidad Visual Propia y Erradicación del Diseño Futurista

### Paleta Armónica Boutique:
- **Lienzo principal**: `#FAF7F2` (Marfil cálido y sereno, sin fondos negros, sin brillos ni neón).
- **Superficies y Tarjetas**: `#FFFFFF` y `#FDFBF8` con bordes ultrafinos en `#EADFD5` y sutil sombreado orgánico.
- **Rosa Empolvado** (`#C87D83` / `#F9EFF0`): Utilizado como acento en acciones comerciales principales (botones de cobro, pestañas seleccionadas).
- **Verde Salvia** (`#4F725B` / `#ECF3EE`): Indicador de saldo favorable, caja abierta y stock óptimo.
- **Café Moca / Lino** (`#2D241E` / `#6E5342`): Tipografía de alto contraste con jerarquía cálida, eliminando el blanco sobre negro artificial.

### Criterios de Componentes:
- **Tablas**: Filas limpias con espaciado generoso, encabezados discretos en mayúsculas sutiles, números tabulares alineados a la derecha (`font-mono tabular-nums`).
- **Formularios**: Campos con bordes cálidos, etiquetas claras, estados de foco en rosa empolvado suave sin halos exagerados.
- **Modales**: Ventanas de confirmación y formularios emergentes centrados, con fondo atenuado en marrón transparente suave (`bg-[#2D241E]/40`).
- **Diseño Adaptable**: Menú lateral replegable en dispositivos móviles y barra superior compacta que no invade la pantalla.

---

## 4. Plan de Ejecución Paso a Paso

1. **Eliminación del Módulo 1**:
   - Quitar la referencia y archivo `DashboardSection.tsx`.
   - Eliminar `dashboard` de `SectionKey`, del menú lateral `Sidebar.tsx` y de la cabecera `Header.tsx`.
   - Establecer `sales` (Punto de Venta) como estado inicial predeterminado en `App.tsx`.
2. **Reestructuración del Menú**:
   - Renumerar exactamente del 1 al 9 los apartados comerciales en `Sidebar.tsx`.
   - Ajustar el botón de acceso rápido de caja en el encabezado.
3. **Refinamiento de Estilos Globales**:
   - Limpiar `index.css` de efectos residuales oscuros o de alta tecnología.
   - Consolidar las clases `.soft-card` y variables de color en CSS Tailwind.
4. **Optimización del Punto de Venta (`POSSalesSection.tsx`)**:
   - Asegurar que la vista dividida aproveche al máximo el espacio en pantalla grande y sea fluida en pantallas táctiles y móviles.
   - Refinar el selector de prendas, talles, métodos de cobro y emisión de recibo.
5. **Verificación de Integridad y Compilación**:
   - Ejecutar comprobación de sintaxis (`lint_applet`) y compilación final (`compile_applet`).
   - Probar que no existan errores ni dependencias rotas tras la remoción del apartado 1.
