"use client";

import * as React from "react";
import type { EmblaCarouselType, EmblaOptionsType, EmblaPluginType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type CarouselApi = EmblaCarouselType | undefined;

type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  opts?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  orientation?: "horizontal" | "vertical";
};

type CarouselContextValue = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: CarouselApi;
  orientation: "horizontal" | "vertical";
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within <Carousel>");
  }
  return context;
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    { className, children, opts, plugins, orientation = "horizontal", ...props },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    );

    const value = React.useMemo(() => ({ carouselRef, api, orientation }), [carouselRef, api, orientation]);

    return (
      <CarouselContext.Provider value={value}>
        <div ref={ref} className={cn("relative", className)} {...props}>
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn(
            "flex",
            orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();

    return (
      <div
        ref={ref}
        className={cn(
          "min-w-0 shrink-0 grow-0 basis-full",
          orientation === "horizontal" ? "pl-4" : "pt-4",
          className
        )}
        {...props}
      />
    );
  }
);
CarouselItem.displayName = "CarouselItem";

const buttonBaseClasses =
  "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition hover:bg-black/70 disabled:opacity-30";

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { api } = useCarousel();
    const [disabled, setDisabled] = React.useState(true);

    React.useEffect(() => {
      if (!api) return;
      const update = () => setDisabled(!api.canScrollPrev());
      api.on("select", update);
      api.on("reInit", update);
      update();
      return () => {
        api.off("select", update);
        api.off("reInit", update);
      };
    }, [api]);

    return (
      <button
        ref={ref}
        type="button"
        className={cn(buttonBaseClasses, "left-4", className)}
        disabled={disabled}
        onClick={() => api?.scrollPrev()}
        {...props}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { api } = useCarousel();
    const [disabled, setDisabled] = React.useState(true);

    React.useEffect(() => {
      if (!api) return;
      const update = () => setDisabled(!api.canScrollNext());
      api.on("select", update);
      api.on("reInit", update);
      update();
      return () => {
        api.off("select", update);
        api.off("reInit", update);
      };
    }, [api]);

    return (
      <button
        ref={ref}
        type="button"
        className={cn(buttonBaseClasses, "right-4", className)}
        disabled={disabled}
        onClick={() => api?.scrollNext()}
        {...props}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }
);
CarouselNext.displayName = "CarouselNext";

export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious };
