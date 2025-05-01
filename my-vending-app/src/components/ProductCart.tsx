import { Product } from '@/types/product';

interface Props {
  product: Product;
  onAdd: (id: number) => void;
}

export default function ProductCard({ product, onAdd }: Props) {
  return (
    <div className="border rounded p-4 flex flex-col">
      <h2 className="font-semibold">{product.name}</h2>
      <p>₹{(product.priceCents/100).toFixed(2)}</p>
      <p>Stock: {product.stock}</p>
      <button
        className="mt-auto bg-green-500 text-white py-1 rounded"
        onClick={() => onAdd(product.id)}
      >
        Add to Cart
      </button>
    </div>
  );
}
