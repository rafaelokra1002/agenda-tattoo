// Wordmark reutilizável da marca "The Freedom Tattoo".
// Usa a fonte de estúdio de tatuagem (.font-brand) com destaque em vermelho.
export function Brand({ size = "md", className = "" }) {
  const sizes = {
    sm: "text-base",
    md: "text-2xl",
    lg: "text-5xl md:text-7xl",
  };
  return (
    <span className={`font-brand leading-tight ${sizes[size]} ${className}`}>
      The Freedom <span className="text-brand">Tattoo</span>
    </span>
  );
}
