import Image from "next/image";

const LOGO_SRC = "/images/Logonew.png";
const LOGO_ALT = "LinxShip Logistics & Storage";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt={LOGO_ALT}
      width={1080}
      height={378}
      className={className}
      priority={priority}
    />
  );
}
