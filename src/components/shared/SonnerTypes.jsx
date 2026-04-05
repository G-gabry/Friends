"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SonnerTypes({ message, type }) {
  return (
    <div className="flex flex-wrap gap-2">
      {type ? (
        <Button
          variant="outline"
          onClick={() => toast.success("Event has been created")}
        >
          Success
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() =>
            toast.warning("Event start time cannot be earlier than 8am")
          }
        >
          Warning
        </Button>
      )}
    </div>
  );
}
