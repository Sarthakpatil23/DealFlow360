import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#171717] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // DESIGN.md: button-primary (marketing black pill)
        primary:
          "bg-[#171717] text-white hover:bg-[#2c2c2c] shadow-sm rounded-pill font-sans text-base font-medium",
        // DESIGN.md: button-secondary (marketing white pill)
        secondary:
          "bg-white text-[#171717] border border-[#ebebeb] hover:bg-[#fafafa] hover:border-[#d1d1d1] shadow-sm rounded-pill font-sans text-base font-medium",
        // DESIGN.md: button-primary-sm (nav / app black 6px square)
        "primary-sm":
          "bg-[#171717] text-white hover:bg-[#2c2c2c] rounded-sm font-sans text-sm font-medium",
        // DESIGN.md: button-ghost-sm (nav / app white 6px square)
        "ghost-sm":
          "bg-white/90 text-[#171717] border border-[#ebebeb] hover:bg-white hover:border-[#d1d1d1] rounded-sm font-sans text-sm font-medium",
        // DESIGN.md: button-icon-circular (circular icon / mute control)
        "icon-circular":
          "bg-white/80 backdrop-blur-md text-[#171717] border border-[#ebebeb] hover:bg-white rounded-full p-0 flex items-center justify-center shadow-whisper",
        // Standard ghost link
        ghost:
          "text-[#4d4d4d] hover:text-[#171717] hover:bg-black/5 rounded-full font-sans text-sm font-normal",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
