import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center relative overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <AuthButton />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="z-10 flex flex-col items-center gap-8 max-w-3xl">
        <div className="inline-flex items-center rounded-full border border-border bg-card/50 backdrop-blur-sm px-3 py-1 text-sm font-medium shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <span className="flex h-2 w-2 rounded-full bg-primary/80 mr-2 animate-pulse"></span>
          FluyIA infrastructure initialized
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl text-foreground">
          Control your AI Agents with <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">FluyIA</span>
        </h1>
        
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          The ultimate platform to build, execute, and monitor 
          voice and image workflows effortlessly.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
          <Link 
            href="/dashboard" 
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg hover:scale-[1.02] hover:shadow-primary/25 transition-all duration-200"
          >
            Enter Dashboard
          </Link>
          <Link 
            href="#n8n" 
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            Configure n8n
          </Link>
        </div>
      </div>
    </main>
  );
}
