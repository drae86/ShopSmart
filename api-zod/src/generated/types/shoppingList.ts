import type { ShoppingListItem } from './shoppingListItem';
export interface ShoppingList { storeId:number; storeName:string; items:ShoppingListItem[]; totalCost:number|null; budget?:number|null; withinBudget:boolean|null; cheaperStoreId?:number|null; cheaperStoreName?:string|null; cheaperStoreCost?:number|null; }
