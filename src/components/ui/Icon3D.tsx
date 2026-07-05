import Image from "next/image";

export type Icon3DName =
  | "book"
  | "headset"
  | "pencil"
  | "microphone"
  | "document"
  | "marker"
  | "alarm-clock"
  | "bar-chart"
  | "line-chart"
  | "brain"
  | "cursor"
  | "trophy"
  | "graduation-cap"
  | "lightning-bolt"
  | "checkmark"
  | "time"
  | "goal"
  | "rocket"
  | "star"
  | "dashboard"
  | "shield"
  | "leave"
  | "account";

export function Icon3D({ name, size = 40, className = "" }: { name: Icon3DName; size?: number; className?: string }) {
  return (
    <Image
      src={`/icons/3d/${name}.png`}
      alt=""
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
