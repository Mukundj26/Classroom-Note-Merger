import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combine, MoveRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Combine className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold">ClassSync Lite</h1>
        </div>
        <Button asChild variant="ghost">
          <Link href="/dashboard">
            Go to App <MoveRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative inline-block">
            <Sparkles className="absolute -top-4 -left-4 w-8 h-8 text-accent" />
            <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-tight">
              One class, one perfect set of notes.
            </h2>
            <Sparkles className="absolute -bottom-4 -right-4 w-8 h-8 text-accent" />
          </div>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Stop worrying about missed details. ClassSync merges everyone's
            notes into a single, clean, and complete document powered by AI.
          </p>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Start Merging for Free
                <MoveRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} ClassSync Lite. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
