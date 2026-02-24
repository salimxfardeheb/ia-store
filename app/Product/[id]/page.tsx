import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../../data/products';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingBag, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const product = products.find(p => p.id === Number(id));

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <h1 className="font-serif text-4xl">Product not found</h1>
        <button onClick={() => navigate('/shop')} className="text-[11px] uppercase tracking-widest font-bold border-b border-black">Back to Shop</button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.2em] font-bold mb-12 opacity-40 hover:opacity-100 transition-opacity"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Gallery */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="aspect-3/4 overflow-hidden bg-[#f5f5f5] rounded-2xl">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-[#f5f5f5] rounded-xl overflow-hidden opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
                <img src={`https://picsum.photos/seed/${product.id + i}/400/400`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-8">
            <span className="text-black/40 text-[11px] uppercase tracking-[0.3em] font-medium mb-2 block">{product.category}</span>
            <h1 className="font-serif text-5xl italic mb-4">{product.name}</h1>
            <span className="text-2xl font-medium">${product.price}</span>
          </div>

          <p className="text-black/60 leading-relaxed mb-12 font-light">
            {product.description} This piece represents the pinnacle of our design philosophy, combining traditional tailoring techniques with modern functionality. Crafted from premium materials sourced from the finest mills.
          </p>

          <div className="space-y-8 mb-12">
            {/* Size Selection */}
            <div>
              <div className="flex justify-between mb-4">
                <span className="text-[11px] uppercase tracking-widest font-bold">Select Size</span>
                <button className="text-[10px] uppercase tracking-widest opacity-40 border-b border-black/20">Size Guide</button>
              </div>
              <div className="flex gap-3">
                {['S', 'M', 'L', 'XL'].map(size => (
                  <button key={size} className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center text-xs font-medium hover:border-black transition-colors">
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button 
                onClick={() => addToCart(product)}
                className="flex-grow bg-black text-white py-5 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all luxury-shadow flex items-center justify-center space-x-3"
              >
                <ShoppingBag size={18} />
                <span>Add to Bag</span>
              </button>
              <button className="w-16 h-16 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors">
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-black/5">
            <div className="flex flex-col items-center text-center space-y-2">
              <Truck size={20} strokeWidth={1} />
              <span className="text-[9px] uppercase tracking-widest font-bold">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <RefreshCw size={20} strokeWidth={1} />
              <span className="text-[9px] uppercase tracking-widest font-bold">Easy Returns</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <ShieldCheck size={20} strokeWidth={1} />
              <span className="text-[9px] uppercase tracking-widest font-bold">Secure Payment</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
