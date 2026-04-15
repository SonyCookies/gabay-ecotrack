import { Star, Gift, Wallet, Utensils, Zap, ShoppingBag } from "lucide-react";

export interface PointActivity {
  id: string;
  type: 'pickup' | 'redemption' | 'bonus' | 'referral';
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending';
  rating?: number;
  criteria?: string[];
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'Voucher' | 'Utility' | 'Goods' | 'Charity';
  imageUrl: string;
  stock: number;
  icon: any;
}

export const POINT_ACTIVITIES: PointActivity[] = [
  {
    id: 'act-1',
    type: 'pickup',
    amount: 50,
    date: '2024-10-24T10:30:00Z',
    description: 'Biodegradable Waste Collection',
    status: 'completed'
  },
  {
    id: 'act-2',
    type: 'pickup',
    amount: 120,
    date: '2024-10-22T08:15:00Z',
    description: 'Recyclable Goods Collection - High Volume',
    status: 'completed'
  },
  {
    id: 'act-3',
    type: 'redemption',
    amount: -500,
    date: '2024-10-20T14:00:00Z',
    description: 'Grocery Voucher Redemption',
    status: 'completed'
  },
  {
    id: 'act-4',
    type: 'bonus',
    amount: 200,
    date: '2024-10-18T09:00:00Z',
    description: 'Weekly Top Recycler Bonus',
    status: 'completed'
  },
  {
    id: 'act-5',
    type: 'pickup',
    amount: 30,
    date: '2024-10-15T11:20:00Z',
    description: 'Residual Waste Collection',
    status: 'completed'
  }
];

export const REWARD_ITEMS: RewardItem[] = [
  {
    id: 'rew-1',
    name: 'Grocery Voucher (₱500)',
    description: 'Valid at all major supermarket partners for your daily essentials.',
    cost: 500,
    category: 'Voucher',
    imageUrl: '/images/rewards/voucher.png',
    stock: 25,
    icon: ShoppingBag
  },
  {
    id: 'rew-2',
    name: 'Utility Bill Credit (₱300)',
    description: 'Direct credit to your electricity or water bill account.',
    cost: 350,
    category: 'Utility',
    imageUrl: '/images/rewards/utility.png',
    stock: 50,
    icon: Zap
  },
  {
    id: 'rew-3',
    name: 'Reusable Bag Set',
    description: 'Pack of 3 heavy-duty canvas bags for sustainable shopping.',
    cost: 150,
    category: 'Goods',
    imageUrl: '/images/rewards/bags.png',
    stock: 120,
    icon: ShoppingBag
  },
  {
    id: 'rew-4',
    name: 'Eco-Friendly Utensils',
    description: 'Bamboo cutlery set with a portable pouch.',
    cost: 100,
    category: 'Goods',
    imageUrl: '/images/rewards/utensils.png',
    stock: 80,
    icon: Utensils
  },
  {
    id: 'rew-5',
    name: 'Charity Donation',
    description: 'Donate ₱200 to local environmental conservation efforts.',
    cost: 200,
    category: 'Charity',
    imageUrl: '/images/rewards/charity.png',
    stock: 999,
    icon: Gift
  },
  {
    id: 'rew-6',
    name: 'G-Cash Transfer (₱100)',
    description: 'Direct cash transfer to your registered GCash account.',
    cost: 120,
    category: 'Voucher',
    imageUrl: '/images/rewards/gcash.png',
    stock: 1000,
    icon: Wallet
  }
];
