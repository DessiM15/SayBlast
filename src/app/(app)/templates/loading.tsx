import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      {/* Built-in Templates section */}
      <section>
        <Skeleton className="mb-4 h-6 w-44" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden">
              <Skeleton className="h-[180px] w-full rounded-none" />
              <CardHeader className="flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48" />
              </CardHeader>
              <div className="px-6 pb-4">
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Custom Templates section */}
      <section>
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden">
              <Skeleton className="h-[180px] w-full rounded-none" />
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <div className="px-6 pb-4">
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
