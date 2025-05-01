import { Product } from '@/types/product';

interface Item {
  product: Product;
  quantity: number;
}

interface Props {
  items: Item[];
}

export default function Cart({ items }: Props) {
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-2">Cart</h2>
      <ul className="list-disc pl-5">
        {items.map(({ product, quantity }) => (
          <li key={product.id}>{product.name} × {quantity}</li>
        ))}
      </ul>
    </div>
  );
}
