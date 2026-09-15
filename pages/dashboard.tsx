import { formatCurrency } from "@/lib/format";
import { useGetShoppingSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, ChefHat, Store, TrendingDown, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetShoppingSummary();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-serif font-bold text-foreground">Welcome to ShopSmart</h1>
        <p className="text-muted-foreground text-lg">Your weekly grocery co-pilot. Let's plan some meals.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Recipes" 
          value={summary?.totalRecipes} 
          isLoading={isLoading} 
          icon={<ChefHat className="w-5 h-5 text-primary" />} 
        />
        <StatsCard 
          title="Stores Tracked" 
          value={summary?.totalStores} 
          isLoading={isLoading} 
          icon={<Store className="w-5 h-5 text-secondary-foreground" />} 
        />
        <StatsCard 
          title="Avg. Budget" 
          value={summary?.averageWeeklyBudget ? formatCurrency(summary.averageWeeklyBudget) : "---"} 
          isLoading={isLoading} 
          icon={<Wallet className="w-5 h-5 text-accent" />} 
        />
        <StatsCard 
          title="Max Savings" 
          value={summary?.maxSavings ? formatCurrency(summary.maxSavings) : "---"} 
          isLoading={isLoading} 
          icon={<TrendingDown className="w-5 h-5 text-primary" />} 
          highlight
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover-elevate transition-all duration-300">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Plan this week's meals</CardTitle>
            <CardDescription>Select recipes, compare store prices, and generate your smart shopping list.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/planner" className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-colors">
              Open Planner <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all duration-300">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Manage your cookbook</CardTitle>
            <CardDescription>Add new recipes or tweak existing ones to keep your meals fresh.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/recipes" className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md font-medium transition-colors border border-secondary-border">
              View Recipes <ChefHat className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, isLoading, icon, highlight = false }: { title: string, value?: number | string, isLoading: boolean, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <Card className={`relative overflow-hidden ${highlight ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-background rounded-full shadow-sm">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20 mt-1" />
        ) : (
          <div className={`text-3xl font-bold font-sans ${highlight ? 'text-primary' : 'text-foreground'}`}>
            {value ?? 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
