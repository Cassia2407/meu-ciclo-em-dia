import { cn } from "@/lib/utils";
import logoAsset from "@/assets/ciclica-logo.png.asset.json";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-block h-9 w-9 overflow-hidden", className)}>
      <img
        src={logoAsset.url}
        alt=""
        className="h-full w-full object-cover mix-blend-multiply"
        style={{ objectPosition: "52% 25%", transform: "scale(1.9)", transformOrigin: "52% 30%" }}
      />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Cíclica"
      className={cn("h-14 w-auto mix-blend-multiply", className)}
    />
  );
}
