import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div className="pt-2 lg:pt-0"><PageSkeleton cards={4} /></div>;
}
