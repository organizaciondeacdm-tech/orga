// src/components/DaysRemaining.jsx
export default function DaysRemaining({ fechaFin }) {
  if (!fechaFin) return null;

  // Calcular días restantes
  const hoy = new Date();
  const fin = new Date(fechaFin);
  const dias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));

  // Determinar estilo según días
  let cls = "days-ok";
  let icon = "🟢";
  
  if (dias <= 0) {
    cls = "days-danger";
    icon = "🔴";
  } else if (dias <= 5) {
    cls = "days-danger";
    icon = "⚠️";
  } else if (dias <= 10) {
    cls = "days-warn";
    icon = "🟡";
  }

  return (
    <span className={`days-remaining ${cls}`}>
      {icon} {dias <= 0 ? "VENCIDA" : `${dias} días`}
    </span>
  );
}