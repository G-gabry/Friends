import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="grid w-full max-w-7xl grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <Card key={i} className="border-border bg-card text-card-foreground">
            <CardHeader>
              <Skeleton className="h-4 w-2/3 bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
