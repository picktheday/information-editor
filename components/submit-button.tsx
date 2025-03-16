"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-background hover:bg-accent text-foreground border border-input rounded-full flex items-center justify-center h-12"
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin mr-2 h-5 w-5" />
          Loading...
        </>
      ) : (
        <>
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  )
}

