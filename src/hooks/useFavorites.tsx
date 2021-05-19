import { QueryLazyOptions, useLazyQuery, useMutation, OperationVariables } from '@apollo/client';
import { toast } from 'react-toastify';
import React, { createContext, useState, useContext } from 'react';
import { CREATE_FAVORITE } from '../GraphQL/favorite.mutation';
import { Product } from '../interfaces/Product.interface';
import { LOAD_FAVORITES } from '../GraphQL/favorite.queries';
import extractSearchFieldOptions from '../utils/extractSearchFieldOptions';

interface FavoritesContextData {
  addFavorite(product: Product): void;
  removeFavorite(product: Product): Promise<void>;
  getFavorites(): void;
  searchFavorite(options: QueryLazyOptions<OperationVariables>): void;
  favorites: Product[];
  favoritesTotalCount: number;
  searchFieldOptions: string[]
  isLoading: boolean;
 
}

const FavoritesContext = createContext<FavoritesContextData>(
  {} as FavoritesContextData,
);

const FavoritesProvider: React.FC = ({ children }) => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [favoritesTotalCount, setFavoritesTotalCount] = useState<number>(0);
  const [searchFieldOptions, setSearchFieldOptions] = useState<string[]>([])

  const [createFavorite] = useMutation(CREATE_FAVORITE, {
    onCompleted(response) {
      toast.success('Favorite saved.');
      console.log(response.createFavorite.product)
      const favoritesList: string[] = [];
      
     
      console.log(searchFieldOptions)
        setSearchFieldOptions(
           Object.keys(response.createFavorite.product).filter(
             fav => !searchFieldOptions.includes(fav) 
             && fav !== 'imageUrl'
            && [...searchFieldOptions, fav] 
            ))
     
   
    
  
      setFavorites([...favorites, response.createFavorite.product] );
      setFavoritesTotalCount(response.createFavorite.product.length);
     
    },
    onError() {
      toast.error('Favorite already include.');
    },
  });

  const [executeSearch, {loading} ] = useLazyQuery(LOAD_FAVORITES, {
    onCompleted(response)  {
     
      setFavoritesTotalCount(response.favorites.totalCount)
      setFavorites(response.favorites.favorites)
      
      const optionsList  = extractSearchFieldOptions(response.favorites.favorites);
      setSearchFieldOptions(optionsList);
    }
  });
  const removeFavorite = async (product: Product): Promise<void> => {};

  const addFavorite = async (product: Product) => {
    const data = {
       product,
    };

    createFavorite({
      variables: {
        data,
      },
    });
  };

  function searchFavorite(options:  QueryLazyOptions<OperationVariables> ) {
    executeSearch({...options})
  }

  function getFavorites() {
    executeSearch({})
  }
  

  return (
    <FavoritesContext.Provider
      value={{
        addFavorite,
        removeFavorite,
        favorites,
        favoritesTotalCount,
        getFavorites, 
        searchFieldOptions,
        isLoading: loading, 
        searchFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

function useFavorite(): FavoritesContextData {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorite must be used within an FavoriteProvider.');
  }

  return context;
}

export { FavoritesProvider, useFavorite };
