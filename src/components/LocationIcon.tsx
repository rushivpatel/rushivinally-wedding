import { icons, MapPin, type LucideProps } from "lucide-react";

type LocationIconProps = LucideProps & {
  name?: string;
};

/**
 * Renders a Lucide icon by name string (e.g. from Location.icon).
 * Falls back to a plain MapPin if no name is given or it doesn't
 * match a real Lucide icon.
 */
export default function LocationIcon({ name, ...props }: LocationIconProps) {
  const Icon = (name && icons[name as keyof typeof icons]) || MapPin;
  return <Icon {...props} />;
}
