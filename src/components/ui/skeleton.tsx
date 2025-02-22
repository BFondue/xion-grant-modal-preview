import React from "react";

import { cn } from "../../utils/classname-util";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("ui-animate-pulse ui-rounded-md ui-bg-white/20", className)}
      {...props}
    />
  );
}

export { Skeleton };
