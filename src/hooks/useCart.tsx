import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
       return JSON.parse(storagedCart);

   }

    return [];
  });

  async function getStockAmountById(productId: number) {
    const response = await api.get(`stock/${productId}`)
    return Number(response.data.amount) ?? 0
  }

 async function getProductById(productId: number) {
    const response = await api.get(`products/${productId}`)
    return response.data as Product
  }
 

  const addProduct = async (productId: number) => {
    try {
      const amountInStock = await getStockAmountById(productId) 
      const productInCart = cart.find((cartItem) => cartItem.id === productId)
      const updatedCart = [...cart]

      const currentAmount = productInCart?.amount ?? 0
      const newAmount = currentAmount + 1

      if (newAmount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        if (productInCart) {
          productInCart.amount = newAmount

        } else {
          const product = await getProductById(productId)
          const newCardItem = {...product, amount: 1}
          updatedCart.push(newCardItem)
        }

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]
      const indexToRemove = updatedCart.findIndex((product) => product.id === productId)

      if (indexToRemove === -1) {
        throw Error()
      } else {
        updatedCart.splice(indexToRemove, 1)
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const amountInStock = await getStockAmountById(productId) 
      const productInCart = cart.find((cartItem) => cartItem.id === productId)
      const updatedCart = [...cart]

      if (amount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (productInCart && amount > 1) {
          productInCart.amount = amount
      } else {
         throw Error()
      }
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    }
    catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
