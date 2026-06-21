import Button from "@/components/ui/Button";

export default function FilmPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <section className="mx-auto max-w-2xl text-center space-y-8">
        <p className="text-xs sm:text-sm tracking-[0.28em] uppercase text-muted-light font-light">
          Before the Title
        </p>
        <h1 className="font-display text-5xl sm:text-6xl leading-tight tracking-tight">
          Project Film
        </h1>
        <p className="text-lg text-muted font-light leading-relaxed max-w-xl mx-auto">
          A future chapter shaped by selected reflections, voices, and artworks
          from the living archive.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button href="/gallery" variant="secondary">
            View Archive
          </Button>
          <Button href="/experience">Add Your Reflection</Button>
        </div>
      </section>
    </main>
  );
}
