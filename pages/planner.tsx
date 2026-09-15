import { useState, useMemo } from "react";
import { 
  useListRecipes, 
  useListStores, 
  useGetShoppingList, 
  useCompareStores 
} from "@workspace/api-client-react";
import { formatCurrency, formatWeight } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, ChevronRight, ShoppingCart, Store, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Planner() {
  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [budgetStr, setBudgetStr] = useState<string>("");

  const recipeIdsStr = Array.from(selectedRecipes).join(",");
  const budget = budgetStr ? parseFloat(budgetStr) : undefined;

  const { data: recipes = [], isLoading: isLoadingRecipes } = useListRecipes();
  const { data: stores = [], isLoading: isLoadingStores } = useListStores();

  const { data: storeComparisons = [], isLoading: isLoadingComparisons } = useCompareStores(
    { recipeIds: recipeIdsStr },
    { query: { enabled: selectedRecipes.size > 0 } }
  );

  const { data: shoppingList, isLoading: isLoadingList } = useGetShoppingList(
    { 
      recipeIds: recipeIdsStr, 
      storeId: selectedStoreId!, 
      budget 
    },
    { query: { enabled: selectedRecipes.size > 0 && selectedStoreId !== null } }
  );

  const toggleRecipe = (id: number) => {
    const next = new Set(selectedRecipes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRecipes(next);
  };

  const handleSetStore = (id: number) => {
    setSelectedStoreId(id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-serif font-bold text-foreground">Meal Planner</h1>
        <p className="text-muted-foreground text-lg">Select recipes to build your list, then find the best store.</p>
      </div>

      <div className="grid lg:grid-cols-[350px_1fr] gap-8 items-start">
        {/* Left Sidebar: Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                Select Recipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {isLoadingRecipes ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : recipes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">No recipes found. Go add some first!</p>
                ) : (
                  <div className="space-y-2">
                    {recipes.map((recipe) => (
                      <div 
                        key={recipe.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedRecipes.has(recipe.id) 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-transparent hover:bg-secondary/50"
                        }`}
                        onClick={() => toggleRecipe(recipe.id)}
                      >
                        <Checkbox 
                          checked={selectedRecipes.has(recipe.id)} 
                          onCheckedChange={() => toggleRecipe(recipe.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{recipe.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{recipe.description || 'No description'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className={selectedRecipes.size === 0 ? "opacity-50 pointer-events-none" : "transition-opacity duration-300"}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                Set Budget
              </CardTitle>
              <CardDescription>Optional budget limit for this list</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="pl-7"
                  value={budgetStr}
                  onChange={(e) => setBudgetStr(e.target.value)}
                  min={0}
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content: Results */}
        <div className="space-y-6">
          {selectedRecipes.size === 0 ? (
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed bg-secondary/20">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-serif text-muted-foreground font-medium">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Select some recipes from the list to see store comparisons and generate your shopping list.
              </p>
            </Card>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              {/* Store Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary" />
                    Compare Stores
                  </CardTitle>
                  <CardDescription>Prices based on selected ingredients</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingComparisons ? (
                    <div className="flex gap-4">
                      {[1, 2].map(i => <Skeleton key={i} className="h-24 flex-1" />)}
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {storeComparisons.map((comp) => (
                        <div 
                          key={comp.storeId}
                          onClick={() => handleSetStore(comp.storeId)}
                          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                            selectedStoreId === comp.storeId 
                              ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                              : "border-border hover:border-primary/40 hover:bg-secondary/30"
                          }`}
                        >
                          {comp.isCheapest && (
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                              BEST VALUE
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: comp.color }} />
                            <h4 className="font-semibold">{comp.storeName}</h4>
                          </div>
                          <div className="text-2xl font-bold font-sans">
                            {formatCurrency(comp.totalCost)}
                          </div>
                          {comp.savingsVsMostExpensive > 0 && (
                            <p className="text-xs text-primary font-medium mt-1">
                              Save {formatCurrency(comp.savingsVsMostExpensive)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shopping List */}
              {selectedStoreId !== null && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
                    <div>
                      <CardTitle className="text-xl">Shopping List</CardTitle>
                      <CardDescription>
                        {shoppingList?.items.length || 0} items at {shoppingList?.storeName}
                      </CardDescription>
                    </div>
                    {shoppingList && (
                      <div className="text-right">
                        <div className="text-2xl font-bold font-sans text-primary">
                          {formatCurrency(shoppingList.totalCost)}
                        </div>
                        <div className="text-sm text-muted-foreground">Estimated Total</div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isLoadingList || !shoppingList ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {shoppingList.budget && (
                          <Alert variant={shoppingList.withinBudget ? "default" : "destructive"} className={shoppingList.withinBudget ? "bg-primary/10 border-primary/20 text-primary" : ""}>
                            {shoppingList.withinBudget ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertTitle>{shoppingList.withinBudget ? "Within Budget" : "Over Budget"}</AlertTitle>
                            <AlertDescription className="flex items-center justify-between mt-1">
                              <span>Budget: {formatCurrency(shoppingList.budget)}</span>
                              <span className="font-mono">{formatCurrency(Math.abs(shoppingList.budget - shoppingList.totalCost))} {shoppingList.withinBudget ? 'remaining' : 'over'}</span>
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          {shoppingList.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/20 transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors cursor-pointer">
                                  <div className="w-4 h-4 rounded-full hover:bg-primary/20" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{item.ingredientName}</p>
                                  <p className="text-xs text-muted-foreground">{formatWeight(item.totalQtyG)}</p>
                                </div>
                              </div>
                              <div className="font-mono text-sm font-medium">
                                {formatCurrency(item.estimatedCost)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
