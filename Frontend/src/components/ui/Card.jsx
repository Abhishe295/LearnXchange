import { cls } from "../../styles/theme";

export default function Card({ children, hover = false, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`${hover ? cls.cardHover : cls.card} p-5 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}