import { useRouteError, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ShieldX } from "lucide-react";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <Empty className="border border-dashed min-h-screen">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldX />
        </EmptyMedia>
        <EmptyTitle>Error</EmptyTitle>
        <EmptyDescription>
          <p className="text-gray-500 mb-8 italic">
            {error.statusText || error.message || error.data}
          </p>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link to="/">
          <Button>Go To Home</Button>
        </Link>
      </EmptyContent>
    </Empty>
  );
}
