// Shapes returned by the backend API. Every component imports from here.

export type ApiData<T> = { data: T };
export type Paginated<T> = { items: T[]; nextCursor: string | null };

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "REFUNDED";
export type PaymentMethod = "COD" | "ONLINE";
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

// The backend's product card: home, catalog, related, cart and batch all use it.
// finalPricePaise already includes the discount; the exact stock is never sent.
export type Product = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  pricePaise: number;
  finalPricePaise: number;
  discountPercent: number;
  stockStatus: StockStatus;
  rating: { average: number; count: number };
};

type CategoryRef = { id: string; name: string; slug: string };

export type ProductDetail = Product & {
  description: string;
  images: string[];
  color: string | null;
  category: CategoryRef & { parent: CategoryRef | null };
  brand: { id: string; name: string; slug: string; logo: string | null } | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  children: { id: string; name: string; slug: string }[];
};

export type Banner = {
  id: string;
  image: string;
  link: string | null;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string | null };
};

// Brand and colour choices for the current category.
export type ProductFacets = {
  brands: { id: string; name: string; slug: string }[];
  colors: string[];
};

// Everything the home page needs, in a single request.
export type HomeData = {
  banners: Banner[];
  categories: Category[];
  trendingProducts: Product[];
  featuredProducts: Product[];
  latestProducts: Product[];
  offers: Product[];
};

type CartItem = {
  quantity: number;
  product: Product & {
    images: string[];
    maxQuantity: number;
    isAvailable: boolean;
  };
};

export type Cart = {
  items: CartItem[];
  totalPaise: number;
};

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type OrderItem = {
  productName: string;
  pricePaise: number;
  quantity: number;
};

export type Order = {
  id: string;
  totalPaise: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentExpiresAt: string | null;
  createdAt: string;
  items: OrderItem[];
};

// Returned by checkout and "pay again"; Razorpay values are null for COD.
export type PaymentDetails = {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  razorpayOrderId: string | null;
  razorpayKeyId: string | null;
};

export type LoginResult = {
  accessToken: string;
  user: { phone: string; role: UserRole };
};

export type UserProfile = {
  phone: string;
  role: UserRole;
  name: string | null;
  email: string | null;
};

// Admin-only shapes — these endpoints return more fields than the public ones.

type AdminCategoryItem = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  isActive: boolean;
};

export type AdminCategory = AdminCategoryItem & {
  children: AdminCategoryItem[];
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isActive: boolean;
};

export type AdminBanner = Banner & { position: number; isActive: boolean };

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  pricePaise: number;
  stock: number;
  reservedQuantity: number;
  isActive: boolean;
  isTrending: boolean;
  isFeatured: boolean;
};

export type AdminProductDetail = Omit<AdminProduct, "reservedQuantity"> & {
  description: string;
  discountPercent: number;
  offerEndsAt: string | null;
  color: string | null;
  gender: string | null;
  ageGroup: string | null;
  images: string[];
  categoryId: string;
  brandId: string | null;
};

export type AdminOrder = {
  id: string;
  totalPaise: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  needsReview: boolean;
  createdAt: string;
  shipName: string;
  shipPhone: string;
};

export type AdminUser = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string;
};
