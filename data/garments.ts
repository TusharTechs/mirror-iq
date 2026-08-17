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
    image: "/garments/cream-knit.png",
    styleTags: ["Minimal", "Classic"],
    occasionTags: ["Everyday", "Date Night"],
  },
  {
    id: "white-shirt",
    name: "White Shirt",
    category: "Minimal",
    image: "/garments/white-shirt.png",
    styleTags: ["Minimal", "Classic"],
    occasionTags: ["Everyday", "Work"],
  },
  {
    id: "black-mock-neck",
    name: "Black Mock-Neck",
    category: "Minimal",
    image: "/garments/black-mock-neck.png",
    styleTags: ["Minimal", "Classic"],
    occasionTags: ["Work", "Date Night"],
  },
  {
    id: "black-oversized-shirt",
    name: "Black Oversized Shirt",
    category: "Street",
    image: "/garments/black-oversized-shirt.png",
    styleTags: ["Street"],
    occasionTags: ["Everyday", "Party"],
  },
  {
    id: "olive-jacket",
    name: "Olive Jacket",
    category: "Street",
    image: "/garments/olive-jacket.png",
    styleTags: ["Street", "Minimal"],
    occasionTags: ["Everyday", "Work"],
  },
  {
    id: "grey-hoodie",
    name: "Grey Hoodie",
    category: "Street",
    image: "/garments/grey-hoodie.png",
    styleTags: ["Street"],
    occasionTags: ["Everyday", "Party"],
  },
  {
    id: "denim-jacket",
    name: "Denim Jacket",
    category: "Street",
    image: "/garments/denim-jacket.png",
    styleTags: ["Street", "Classic"],
    occasionTags: ["Everyday", "Party"],
  },
  {
    id: "beige-blazer",
    name: "Beige Blazer",
    category: "Classic",
    image: "/garments/beige-blazer.png",
    styleTags: ["Classic", "Minimal"],
    occasionTags: ["Work", "Date Night"],
  },
  {
    id: "burgundy-sweater",
    name: "Burgundy Sweater",
    category: "Classic",
    image: "/garments/burgundy-sweater.png",
    styleTags: ["Classic"],
    occasionTags: ["Everyday", "Date Night"],
  },
  {
    id: "charcoal-overcoat",
    name: "Charcoal Overcoat",
    category: "Classic",
    image: "/garments/charcoal-overcoat.png",
    styleTags: ["Classic", "Minimal"],
    occasionTags: ["Work", "Date Night"],
  },
];