import toast from 'react-hot-toast';

type AlertType = "success" | "error" | "warning" | "info";

const alertStylesMap = new Map<AlertType, { icon: string, style: React.CSSProperties }>([
  ["success", { icon: "🟢", style: { background: '#333', color: '#fff', fontWeight: 'bold' } }],
  ["error", { icon: "🔴", style: { background: '#333', color: '#fff', fontWeight: 'bold' } }],
  ["warning", { icon: "🟡", style: { background: '#333', color: '#000', fontWeight: 'bold' } }],
  ["info", { icon: "ℹ️", style: { background: '#333', color: '#fff', fontWeight: 'bold' } }]
]);

export function useToastAlert() {
  return (message: string, type: AlertType) => {
    const { icon, style } = alertStylesMap.get(type) || alertStylesMap.get("info")!;

    toast(message, { 
      duration: 3000,
      icon,
      style, 
    });
  };
}