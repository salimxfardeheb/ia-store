export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Classic Silk Blend Suit",
    price: 850,
    category: "Suits",
    image: "https://picsum.photos/seed/suit1/800/1000",
    description: "Tailored to perfection with a modern silhouette."
  },
  {
    id: 2,
    name: "Cashmere Crewneck Sweater",
    price: 220,
    category: "Knitwear",
    image: "https://picsum.photos/seed/knit1/800/1000",
    description: "Ultra-soft Mongolian cashmere for everyday luxury."
  },
  {
    id: 3,
    name: "Oxford Cotton Shirt",
    price: 120,
    category: "Shirts",
    image: "https://picsum.photos/seed/shirt1/800/1000",
    description: "A timeless staple for any wardrobe."
  },
  {
    id: 4,
    name: "Italian Leather Loafers",
    price: 340,
    category: "Shoes",
    image: "https://picsum.photos/seed/shoes1/800/1000",
    description: "Handcrafted in Italy using premium calfskin."
  },
  {
    id: 5,
    name: "Wool Overcoat",
    price: 580,
    category: "Outerwear",
    image: "https://picsum.photos/seed/coat1/800/1000",
    description: "Heavyweight wool blend for superior warmth."
  },
  {
    id: 6,
    name: "Slim Fit Chinos",
    price: 145,
    category: "Trousers",
    image: "https://picsum.photos/seed/pants1/800/1000",
    description: "Comfortable stretch cotton with a refined finish."
  }
];
