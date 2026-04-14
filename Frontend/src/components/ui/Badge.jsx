import { cls } from "../../styles/theme";

export default function Badge({ children, variant = "blue", className = "" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls.badge[variant]} ${className}`}>
      {children}
    </span>
  );
}