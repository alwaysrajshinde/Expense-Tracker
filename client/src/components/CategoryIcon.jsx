import React from 'react';
import * as Icons from 'lucide-react';

export default function CategoryIcon({ name, icon, color, size = 18, className = "" }) {
  // If icon is provided directly, try to match Lucide icon
  let IconComponent = Icons.Tag;
  
  if (icon && Icons[icon]) {
    IconComponent = Icons[icon];
  } else {
    // Map common category names to icons
    const lower = (name || '').toLowerCase();
    if (lower.includes('biryani') || lower.includes('food') || lower.includes('lunch') || lower.includes('nashta')) {
      IconComponent = Icons.Utensils;
    } else if (lower.includes('auto') || lower.includes('car')) {
      IconComponent = Icons.Car;
    } else if (lower.includes('metro') || lower.includes('train')) {
      IconComponent = Icons.Train;
    } else if (lower.includes('fruit') || lower.includes('apple')) {
      IconComponent = Icons.Apple;
    } else if (lower.includes('cloth') || lower.includes('shirt')) {
      IconComponent = Icons.Shirt;
    } else if (lower.includes('shop')) {
      IconComponent = Icons.ShoppingBag;
    } else if (lower.includes('tea') || lower.includes('coffee')) {
      IconComponent = Icons.Coffee;
    } else if (lower.includes('milk') || lower.includes('curd')) {
      IconComponent = Icons.Milk;
    } else if (lower.includes('medic') || lower.includes('doctor') || lower.includes('hospital')) {
      IconComponent = Icons.HeartPulse;
    } else if (lower.includes('recharge') || lower.includes('mobile')) {
      IconComponent = Icons.Smartphone;
    } else if (lower.includes('mutual') || lower.includes('stock')) {
      IconComponent = Icons.TrendingUp;
    } else if (lower.includes('travel') || lower.includes('rapido')) {
      IconComponent = Icons.Navigation;
    } else if (lower.includes('icecream') || lower.includes('cadbury') || lower.includes('sweet')) {
      IconComponent = Icons.IceCream;
    } else if (lower.includes('bill') || lower.includes('light')) {
      IconComponent = Icons.Zap;
    } else if (lower.includes('home')) {
      IconComponent = Icons.Home;
    }
  }

  return (
    <IconComponent
      size={size}
      style={{ color: color || '#6C47FF' }}
      className={className}
    />
  );
}
