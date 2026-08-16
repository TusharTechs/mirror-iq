export type GarmentCategory = "Minimal" | "Street" | "Classic";

export type Garment = {
  id: string;
  name: string;
  category: GarmentCategory;
  image: string;
  styleTags: string[];
  occasionTags: string[];
};

export const garments: Garment[] = [
  {
    id: "cream-knit",
    name: "Cream Knit",
    category: "Minimal",
    image: "/garments/placeholder.svg",
    styleTags: ["Minimal", "Classic"],
    occasionTags: ["Everyday", "Date Night"],
  },
  {
    id: "white-shirt",
    name: "White Shirt",
    category: "Minimal",
    image: "/garments/placeholder.svg",
    styleTags: ["Minimal", "Classic"],
    occasionTags: ["Everyday", "Work"],
  },
  {
    id: "black-oversized-shirt",
    name: "Black Oversized Shirt",
    category: "Street",
    image: "/garments/placeholder.svg",
    styleTags: ["Street"],
    occasionTags: ["Everyday", "Party"],
  },
  {
    id: "olive-jacket",
    name: "Olive Jacket",
    category: "Street",
    image: "/garments/placeholder.svg",
    styleTags: ["Street", "Minimal"],
    occasionTags: ["Everyday", "Work"],
  },
  {
    id: "beige-blazer",
    name: "Beige Blazer",
    category: "Classic",
    image: "/garments/placeholder.svg",
    styleTags: ["Classic", "Minimal"],
    occasionTags: ["Work", "Date Night"],
  },
  {
    id: "burgundy-sweater",
    name: "Burgundy Sweater",
    category: "Classic",
    image: "/garments/placeholder.svg",
    styleTags: ["Classic"],
    occasionTags: ["Everyday", "Date Night"],
  },
];