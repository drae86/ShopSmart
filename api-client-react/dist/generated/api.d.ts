import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { CompareStoresParams, GetShoppingListParams, HealthStatus, Ingredient, Recipe, RecipeInput, ShoppingList, ShoppingSummary, Store, StoreComparison } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListStoresUrl: () => string;
/**
 * @summary List all stores
 */
export declare const listStores: (options?: RequestInit) => Promise<Store[]>;
export declare const getListStoresQueryKey: () => readonly ["/api/stores"];
export declare const getListStoresQueryOptions: <TData = Awaited<ReturnType<typeof listStores>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listStores>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listStores>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListStoresQueryResult = NonNullable<Awaited<ReturnType<typeof listStores>>>;
export type ListStoresQueryError = ErrorType<unknown>;
/**
 * @summary List all stores
 */
export declare function useListStores<TData = Awaited<ReturnType<typeof listStores>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listStores>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListIngredientsUrl: () => string;
/**
 * @summary List all ingredients with prices
 */
export declare const listIngredients: (options?: RequestInit) => Promise<Ingredient[]>;
export declare const getListIngredientsQueryKey: () => readonly ["/api/ingredients"];
export declare const getListIngredientsQueryOptions: <TData = Awaited<ReturnType<typeof listIngredients>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listIngredients>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listIngredients>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListIngredientsQueryResult = NonNullable<Awaited<ReturnType<typeof listIngredients>>>;
export type ListIngredientsQueryError = ErrorType<unknown>;
/**
 * @summary List all ingredients with prices
 */
export declare function useListIngredients<TData = Awaited<ReturnType<typeof listIngredients>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listIngredients>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListRecipesUrl: () => string;
/**
 * @summary List all recipes
 */
export declare const listRecipes: (options?: RequestInit) => Promise<Recipe[]>;
export declare const getListRecipesQueryKey: () => readonly ["/api/recipes"];
export declare const getListRecipesQueryOptions: <TData = Awaited<ReturnType<typeof listRecipes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRecipes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listRecipes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListRecipesQueryResult = NonNullable<Awaited<ReturnType<typeof listRecipes>>>;
export type ListRecipesQueryError = ErrorType<unknown>;
/**
 * @summary List all recipes
 */
export declare function useListRecipes<TData = Awaited<ReturnType<typeof listRecipes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRecipes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateRecipeUrl: () => string;
/**
 * @summary Create a new recipe
 */
export declare const createRecipe: (recipeInput: RecipeInput, options?: RequestInit) => Promise<Recipe>;
export declare const getCreateRecipeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRecipe>>, TError, {
        data: BodyType<RecipeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createRecipe>>, TError, {
    data: BodyType<RecipeInput>;
}, TContext>;
export type CreateRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof createRecipe>>>;
export type CreateRecipeMutationBody = BodyType<RecipeInput>;
export type CreateRecipeMutationError = ErrorType<unknown>;
/**
* @summary Create a new recipe
*/
export declare const useCreateRecipe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRecipe>>, TError, {
        data: BodyType<RecipeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createRecipe>>, TError, {
    data: BodyType<RecipeInput>;
}, TContext>;
export declare const getGetRecipeUrl: (id: number) => string;
/**
 * @summary Get a recipe by ID
 */
export declare const getRecipe: (id: number, options?: RequestInit) => Promise<Recipe>;
export declare const getGetRecipeQueryKey: (id: number) => readonly [`/api/recipes/${number}`];
export declare const getGetRecipeQueryOptions: <TData = Awaited<ReturnType<typeof getRecipe>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecipe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecipe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecipeQueryResult = NonNullable<Awaited<ReturnType<typeof getRecipe>>>;
export type GetRecipeQueryError = ErrorType<void>;
/**
 * @summary Get a recipe by ID
 */
export declare function useGetRecipe<TData = Awaited<ReturnType<typeof getRecipe>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecipe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateRecipeUrl: (id: number) => string;
/**
 * @summary Update a recipe
 */
export declare const updateRecipe: (id: number, recipeInput: RecipeInput, options?: RequestInit) => Promise<Recipe>;
export declare const getUpdateRecipeMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRecipe>>, TError, {
        id: number;
        data: BodyType<RecipeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateRecipe>>, TError, {
    id: number;
    data: BodyType<RecipeInput>;
}, TContext>;
export type UpdateRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof updateRecipe>>>;
export type UpdateRecipeMutationBody = BodyType<RecipeInput>;
export type UpdateRecipeMutationError = ErrorType<void>;
/**
* @summary Update a recipe
*/
export declare const useUpdateRecipe: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRecipe>>, TError, {
        id: number;
        data: BodyType<RecipeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateRecipe>>, TError, {
    id: number;
    data: BodyType<RecipeInput>;
}, TContext>;
export declare const getDeleteRecipeUrl: (id: number) => string;
/**
 * @summary Delete a recipe
 */
export declare const deleteRecipe: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteRecipeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecipe>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteRecipe>>, TError, {
    id: number;
}, TContext>;
export type DeleteRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteRecipe>>>;
export type DeleteRecipeMutationError = ErrorType<unknown>;
/**
* @summary Delete a recipe
*/
export declare const useDeleteRecipe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecipe>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteRecipe>>, TError, {
    id: number;
}, TContext>;
export declare const getGetShoppingListUrl: (params: GetShoppingListParams) => string;
/**
 * @summary Generate shopping list for selected recipes at a store
 */
export declare const getShoppingList: (params: GetShoppingListParams, options?: RequestInit) => Promise<ShoppingList>;
export declare const getGetShoppingListQueryKey: (params?: GetShoppingListParams) => readonly ["/api/shopping/list", ...GetShoppingListParams[]];
export declare const getGetShoppingListQueryOptions: <TData = Awaited<ReturnType<typeof getShoppingList>>, TError = ErrorType<unknown>>(params: GetShoppingListParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getShoppingList>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getShoppingList>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetShoppingListQueryResult = NonNullable<Awaited<ReturnType<typeof getShoppingList>>>;
export type GetShoppingListQueryError = ErrorType<unknown>;
/**
 * @summary Generate shopping list for selected recipes at a store
 */
export declare function useGetShoppingList<TData = Awaited<ReturnType<typeof getShoppingList>>, TError = ErrorType<unknown>>(params: GetShoppingListParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getShoppingList>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCompareStoresUrl: (params: CompareStoresParams) => string;
/**
 * @summary Compare cost of selected recipes across all stores
 */
export declare const compareStores: (params: CompareStoresParams, options?: RequestInit) => Promise<StoreComparison[]>;
export declare const getCompareStoresQueryKey: (params?: CompareStoresParams) => readonly ["/api/shopping/compare", ...CompareStoresParams[]];
export declare const getCompareStoresQueryOptions: <TData = Awaited<ReturnType<typeof compareStores>>, TError = ErrorType<unknown>>(params: CompareStoresParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof compareStores>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof compareStores>>, TError, TData> & {
    queryKey: QueryKey;
};
export type CompareStoresQueryResult = NonNullable<Awaited<ReturnType<typeof compareStores>>>;
export type CompareStoresQueryError = ErrorType<unknown>;
/**
 * @summary Compare cost of selected recipes across all stores
 */
export declare function useCompareStores<TData = Awaited<ReturnType<typeof compareStores>>, TError = ErrorType<unknown>>(params: CompareStoresParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof compareStores>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetShoppingSummaryUrl: () => string;
/**
 * @summary Get summary stats for all recipes across all stores
 */
export declare const getShoppingSummary: (options?: RequestInit) => Promise<ShoppingSummary>;
export declare const getGetShoppingSummaryQueryKey: () => readonly ["/api/shopping/summary"];
export declare const getGetShoppingSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getShoppingSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getShoppingSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getShoppingSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetShoppingSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getShoppingSummary>>>;
export type GetShoppingSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get summary stats for all recipes across all stores
 */
export declare function useGetShoppingSummary<TData = Awaited<ReturnType<typeof getShoppingSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getShoppingSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map