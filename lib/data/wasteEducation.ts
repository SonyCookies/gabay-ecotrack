import { Leaf, Recycle, Trash2, Box, AlertTriangle } from "lucide-react";

export interface WasteCategory {
    id: string;
    title: string;
    sub: string;
    description: string;
    examples: string[];
    instructions: string;
    icon: any;
    color: string;
    imageUrl?: string;
}

export const WASTE_CATEGORIES: WasteCategory[] = [
    {
        id: "biodegradable",
        title: "Biodegradable",
        sub: "Organic Waste",
        description: "Materials that can be decomposed by bacteria or other living organisms.",
        examples: ["Food leftovers", "Fruit/Vegetable peelings", "Garden waste", "Coffee grounds"],
        instructions: "Place in a separate bin. Ideally used for composting at home or collected for community composting facilities.",
        icon: Leaf,
        color: "emerald",
        imageUrl: "/images/guidance/biodegradable.png"
    },
    {
        id: "recyclable",
        title: "Recyclable",
        sub: "Reusable Goods",
        description: "Items that can be processed and used again in new products.",
        examples: ["Plastic bottles (PET)", "Paper & Cardboard", "Tin cans", "Glass bottles"],
        instructions: "Rinse containers to remove food residue. Keep materials dry and flat to save space. Can be sold to junk shops or collected for recycling.",
        icon: Recycle,
        color: "blue",
        imageUrl: "/images/guidance/recyclable.png"
    },
    {
        id: "residual",
        title: "Residual",
        sub: "Non-Recyclable",
        description: "Waste that cannot be composted or recycled and must go to a landfill.",
        examples: ["Dirty diapers", "Sanitary napkins", "Candy wrappers", "Sachet packaging", "Ceramic shards"],
        instructions: "Ensure these are securely bagged to prevent odors and littering. These are typically collected for sanitary landfills.",
        icon: Trash2,
        color: "gray",
        imageUrl: "/images/guidance/residual.png"
    },
    {
        id: "bulk",
        title: "Bulk Waste",
        sub: "Large items",
        description: "Items too large to be handled by regular waste collection trucks.",
        examples: ["Furniture (Sofas, Chairs)", "Old mattresses", "Large appliances", "Big crates"],
        instructions: "Do not leave on the curb without a scheduled special pickup request. Contact your garbage collection service for a dedicated schedule.",
        icon: Box,
        color: "amber",
        imageUrl: "/images/guidance/bulk.png"
    },
    {
        id: "hazardous",
        title: "Hazardous",
        sub: "Special Waste",
        description: "Waste that poses a threat to public health or the environment.",
        examples: ["Used batteries", "Light bulbs / CFLs", "Paint & Chemicals", "Medical masks & gloves"],
        instructions: "Never mix with regular trash. Seal medical waste in a separate bag marked appropriately. Bring to designated barangay drop-off points.",
        icon: AlertTriangle,
        color: "red",
        imageUrl: "/images/guidance/hazardous.png"
    }
];

export const ENVIRONMENTAL_TIPS = [
    {
        fact: "Average Daily Waste",
        detail: "The average Filipino produces about 0.5 kg of waste every day. Small actions add up!",
        icon: Recycle
    },
    {
        fact: "Plastic Longevity",
        detail: "A single plastic bottle can take up to 450 years to decompose in a landfill.",
        icon: Trash2
    },
    {
        fact: "Composting Gold",
        detail: "Organic waste makes up 50% of household trash. Composting turns waste into plant nutrients!",
        icon: Leaf
    },
    {
        fact: "The 3Rs",
        detail: "Reduce what you use, Reuse what you can, and Recycle the rest. It's the best way to save our planet.",
        icon: Box
    }
];
