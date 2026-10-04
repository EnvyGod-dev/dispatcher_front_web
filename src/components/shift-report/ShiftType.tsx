import { Badge } from "@/components/ui/badge";
import { ShiftType } from "@/services/internal/shift/types";
import { MoonStar, SunMedium } from "lucide-react";

type ShiftTypeBadgeProps = {
  type: ShiftType;
};

export default function ShiftTypeBadge({ type }: ShiftTypeBadgeProps) {
  return (
    <Badge variant={type === "day" ? "secondary" : "outline"}>
      {type === "day" ? <SunMedium /> : <MoonStar />}
      {type === "day" ? "Өдөр" : "Шөнө"}
    </Badge>
  );
}
