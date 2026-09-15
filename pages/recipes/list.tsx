import { useListRecipes, useDeleteRecipe, getListRecipesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Edit, Trash2, ChefHat, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function RecipeList() {
  const { data: recipes = [], isLoading } = useListRecipes();
  const deleteRecipe = useDeleteRecipe();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    deleteRecipe.mutate({ id }, {
      onSuccess: () => {
        toast({
          title: "Recipe deleted",
          description: "The recipe has been removed from your cookbook.",
        });
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete recipe. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold text-foreground">Cookbook</h1>
          <p className="text-muted-foreground text-lg">Manage your favorite weekly recipes.</p>
        </div>
        <Button asChild size="lg" className="rounded-full shadow-md hover-elevate">
          <Link href="/recipes/new" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Recipe
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-secondary/30">
          <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <CardTitle className="text-2xl font-serif mb-2">No recipes yet</CardTitle>
          <CardDescription className="max-w-sm mb-6">
            Start building your cookbook to easily plan meals and generate shopping lists.
          </CardDescription>
          <Button asChild>
            <Link href="/recipes/new">Add Your First Recipe</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((recipe, i) => (
            <Card key={recipe.id} className="group relative overflow-hidden hover-elevate transition-all duration-300 border-border hover:border-primary/30 flex flex-col" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
              
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="font-serif text-xl leading-tight line-clamp-2">{recipe.name}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2 mt-2">{recipe.description || 'A delicious home-cooked meal.'}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 pb-4">
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1 bg-secondary/50 text-secondary-foreground">
                    <Users className="w-3 h-3" /> {recipe.servings}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs text-muted-foreground border-border/50">
                    {recipe.ingredients.length} ingredients
                  </Badge>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 flex gap-2 border-t border-border/40 p-4 mt-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/recipes/${recipe.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Link>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {recipe.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove this recipe from your cookbook. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(recipe.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Recipe
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
