import Image from "next/image";

export default function Logo({
  size = "md",
  showName = true,
  href = "/",
  priority = false,
  className = "",
}) {
  const sizes = {
    sm: {
      width: 28,
      height: 28,
      text: "text-base",
    },
    md: {
      width: 36,
      height: 36,
      text: "text-lg",
    },
    lg: {
      width: 64,
      height:64,
      text: "text-3xl",
    },
  };

  const current = sizes[size] || sizes.md;

  return (
    <a
      href={href}
      aria-label="OrbitAI home"
      className={`inline-flex items-center  ${className}`}
    >
      <Image
        src="/logo2.svg"
        alt="OrbitAI"
        width={current.width}
        height={current.height}
        priority={priority}
        className="object-contain"
      />

      {showName && (
        <span
          className={`${current.text} font-semibold tracking-tight text-neutral-950`}
        >
          OrbitAI
        </span>
      )}
    </a>
  );
}