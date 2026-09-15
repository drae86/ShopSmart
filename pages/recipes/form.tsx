import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateRecipe,
  useUpdateRecipe,
  useGetRecipe,
  useListIngredients,
  getListRecipesQueryKey,
  getGetRecipeQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ArrowLeft, Loader2, Save } from "lucide-react";
import { Link } from "wouter";

const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  servings: z.coerce.number().min(1, "Must serve at least 1"),
  ingredients: z.array(z.object({
    ingredientId: z.coerce.number().min(1, "Select an ingredient"),
    qtyG: z.coerce.number().min(1, "Quantity must be > 0")
  })).min(1, "Add at least one ingredient")
});

type RecipeFormValues = z.infer<typeof recipeSchema>;

export default function RecipeForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = Boolean(params.id && params.id !== "new");
  const recipeId = isEditing ? parseInt(params.id!, 10) : 0;

  const { data: ingredients = [], isLoading: isLoadingIngredients } = useListIngredients();
  
  const { data: existingRecipe, isLoading: isLoadingRecipe } = useGetRecipe(recipeId, {
    query: { enabled: isEditing }
  });

  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: "",
      description: "",
      servings: 2,
      ingredients: [{ ingredientId: 0, qtyG: 100 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients"
  });

  useEffect(() => {
    if (isEditing && existingRecipe) {
      form.reset({
        name: existingRecipe.name,
        description: existingRecipe.description || "",
        servings: existingRecipe.servings,
        ingredients: existingRecipe.ingredients.map(i => ({
          ingredientId: i.ingredientId,
          qtyG: i.qtyG
        }))
      });
    }
  }, [isEditing, existingRecipe, form]);

  const onSubmit = (data: RecipeFormValues) => {
    if (isEditing) {
      updateRecipe.mutate(
        { id: recipeId, data },
        {
          onSuccess: () => {
            toast({ title: "Recipe updated successfully!" });
            queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetRecipeQueryKey(recipeId) });
            setLocation("/recipes");
          },
          onError: () => toast({ title: "Failed to update recipe", variant: "destructive" })
        }
      );
    } else {
      createRecipe.mutate(
        { data },
        {
          onSuccess: () => {
            toast({ title: "Recipe created successfully!" });
            queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
            setLocation("/recipes");
          },
          onError: () => toast({ title: "Failed to create recipe", variant: "destructive" })
        }
      );
    }
  };

  if ((isEditing && isLoadingRecipe) || isLoadingIngredients) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  const isPending = createRecipe.isPending || updateRecipe.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/recipes"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            {isEditing ? "Edit Recipe" : "New Recipe"}
          </h1>
          <p className="text-muted-foreground">{isEditing ? "Tweak your recipe" : "Add a fresh meal to your cookbook"}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Summer Tomato Pasta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A quick, fresh pasta dish..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem className="max-w-[200px]">
                    <FormLabel>Servings</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Ingredients</CardTitle>
                <CardDescription>Add ingredients and amounts (in grams)</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ ingredientId: 0, qtyG: 100 })} className="gap-2">
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start bg-secondary/20 p-3 rounded-lg border border-border/50">
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.ingredientId`}
                    render={({ field: selectField }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="sr-only">Ingredient</FormLabel>
                        <Select
                          onValueChange={(val) => selectField.onChange(parseInt(val, 10))}
                          value={selectField.value ? selectField.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select ingredient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ingredients.map(ing => (
                              <SelectItem key={ing.id} value={ing.id.toString()}>
                                {ing.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.qtyG`}
                    render={({ field: qtyField }) => (
                      <FormItem className="w-32">
                        <FormLabel className="sr-only">Quantity (g)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="number" min="1" {...qtyField} className="pr-8 bg-background" />
                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono">g</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {form.formState.errors.ingredients?.root && (
                <p className="text-[0.8rem] font-medium text-destructive mt-2">
                  {form.formState.errors.ingredients.root.message}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/recipes">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[120px]">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isEditing ? "Save Changes" : "Create Recipe"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
