export default function Avatar({ name, size = "md", color = "blue" }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };
  const colors = {
    blue:   "from-blue-500 to-indigo-500",
    green:  "from-green-500 to-teal-500",
    purple: "from-purple-500 to-pink-500",
  };

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white font-bold shrink-0`}>
      {name?.charAt(0).toUpperCase() ?? "?"}
    </div>
  );
}