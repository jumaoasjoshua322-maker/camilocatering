import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not set in .env.local");
  process.exit(1);
}

if (MONGODB_URI.includes("<username>") || MONGODB_URI.includes("<password>")) {
  console.error("MONGODB_URI still contains placeholder values. Update .env.local with your real MongoDB connection string before seeding.");
  process.exit(1);
}

// ── Inline schemas ─────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "CUSTOMER" },
  phone: String,
}, { timestamps: true });

const PackageSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  price: Number,
  minGuests: Number,
  maxGuests: Number,
  inclusions: [String],
  imageUrl: String,
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

const BookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
  eventDate: Date,
  guestCount: Number,
  venue: String,
  status: { type: String, default: "PENDING" },
  totalAmount: Number,
  notes: String,
}, { timestamps: true });

const CompanySettingsSchema = new mongoose.Schema({
  name: String,
  tagline: String,
  description: String,
  phone: String,
  email: String,
  address: String,
  socialLinks: { facebook: String, instagram: String },
}, { timestamps: true });

const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
const Package = mongoose.models.Package ?? mongoose.model("Package", PackageSchema);
const Booking = mongoose.models.Booking ?? mongoose.model("Booking", BookingSchema);
const CompanySettings = mongoose.models.CompanySettings ?? mongoose.model("CompanySettings", CompanySettingsSchema);

const PASSWORD = await bcrypt.hash("password123", 12);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected to MongoDB\n");

  // Wipe existing data
  await Promise.all([
    User.deleteMany({}),
    Package.deleteMany({}),
    Booking.deleteMany({}),
    CompanySettings.deleteMany({}),
  ]);
  console.log("🗑   Cleared existing data");

  // ── Company Settings ──────────────────────────────────────────────────────
  await CompanySettings.create({
    name: "Camilo Catering",
    tagline: "Premium Catering for Every Occasion",
    description: "Award-winning catering services for weddings, corporate events, and celebrations. Serving Metro Manila since 2009.",
    phone: "+63 917 123 4567",
    email: "hello@camilocatering.com",
    address: "123 Catering Street, Makati City, Metro Manila",
    socialLinks: {
      facebook: "https://facebook.com/camilocatering",
      instagram: "https://instagram.com/camilocatering",
    },
  });
  console.log("🏢  Company settings created");

  // ── Users ─────────────────────────────────────────────────────────────────
  const admin = await User.create({
    name: "Camilo Admin",
    email: "admin@camilocatering.com",
    password: PASSWORD,
    role: "ADMIN",
    phone: "+63 917 000 0001",
  });

  const staff = await User.create({
    name: "Maria Staff",
    email: "staff@camilocatering.com",
    password: PASSWORD,
    role: "STAFF",
    phone: "+63 917 000 0002",
  });

  const customer1 = await User.create({
    name: "Juan dela Cruz",
    email: "juan@example.com",
    password: PASSWORD,
    role: "CUSTOMER",
    phone: "+63 917 111 2222",
  });

  const customer2 = await User.create({
    name: "Maria Santos",
    email: "maria@example.com",
    password: PASSWORD,
    role: "CUSTOMER",
    phone: "+63 917 333 4444",
  });

  console.log(`👥  ${await User.countDocuments()} users created`);

  // ── Packages ──────────────────────────────────────────────────────────────
  const packages = await Package.insertMany([
    // WEDDING
    {
      name: "Classic Wedding Package",
      description: "A timeless wedding catering experience with traditional Filipino dishes, elegant table settings, and dedicated service staff for your special day.",
      category: "WEDDING",
      price: 85000,
      minGuests: 100,
      maxGuests: 300,
      inclusions: [
        "5-course plated dinner",
        "Unlimited drinks station",
        "3-tier wedding cake",
        "Event coordinator",
        "Setup & breakdown crew",
        "Waitstaff (8 hours)",
        "Floral centerpieces",
        "Linen & tableware",
      ],
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Premium Wedding Package",
      description: "Our most luxurious wedding package featuring international cuisine, open bar, and full-service coordination for an unforgettable celebration.",
      category: "WEDDING",
      price: 150000,
      minGuests: 150,
      maxGuests: 500,
      inclusions: [
        "7-course plated dinner",
        "Open bar (6 hours)",
        "Custom 5-tier wedding cake",
        "2 dedicated event coordinators",
        "Live cooking stations",
        "Floral & décor package",
        "Waitstaff (10 hours)",
        "Photo booth setup",
        "Valet parking coordination",
        "Setup & breakdown crew",
      ],
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Intimate Wedding Package",
      description: "Perfect for small, intimate weddings with personalized service, gourmet cuisine, and attention to every detail.",
      category: "WEDDING",
      price: 45000,
      minGuests: 30,
      maxGuests: 80,
      inclusions: [
        "4-course plated dinner",
        "Wine & drinks package",
        "Custom wedding cake",
        "Event coordinator",
        "Floral table settings",
        "Waitstaff (6 hours)",
        "Setup & breakdown crew",
      ],
      isActive: true,
      isFeatured: false,
    },
    // CORPORATE
    {
      name: "Corporate Lunch Package",
      description: "Professional catering for corporate meetings, seminars, and company events. Impress your clients and team.",
      category: "CORPORATE",
      price: 35000,
      minGuests: 30,
      maxGuests: 150,
      inclusions: [
        "Buffet lunch (3 main dishes)",
        "Salad & soup station",
        "Dessert table",
        "Coffee & tea service",
        "Waitstaff (4 hours)",
        "Setup & breakdown",
      ],
      isActive: true,
      isFeatured: false,
    },
    {
      name: "Corporate Gala Package",
      description: "Full-service catering for annual galas, product launches, and large corporate celebrations.",
      category: "CORPORATE",
      price: 95000,
      minGuests: 100,
      maxGuests: 400,
      inclusions: [
        "5-course dinner service",
        "Cocktail hour with canapés",
        "Open bar (4 hours)",
        "Event coordinator",
        "Waitstaff (8 hours)",
        "Stage & AV coordination",
        "Setup & breakdown crew",
      ],
      isActive: true,
      isFeatured: true,
    },
    // BIRTHDAY
    {
      name: "Birthday Celebration Package",
      description: "Make your birthday unforgettable with our festive catering package. Perfect for milestone birthdays and debuts.",
      category: "BIRTHDAY",
      price: 25000,
      minGuests: 20,
      maxGuests: 80,
      inclusions: [
        "Buffet dinner (4 dishes)",
        "Birthday cake (2 tiers)",
        "Drinks package",
        "Balloon & table décor",
        "Waitstaff (4 hours)",
        "Setup & breakdown",
      ],
      isActive: true,
      isFeatured: false,
    },
    // SOCIAL
    {
      name: "Social Gathering Package",
      description: "Casual yet elegant catering for reunions, anniversaries, and intimate social events.",
      category: "SOCIAL",
      price: 18000,
      minGuests: 15,
      maxGuests: 60,
      inclusions: [
        "Cocktail-style service",
        "Finger foods & canapés (8 varieties)",
        "Drinks package",
        "Waitstaff (3 hours)",
        "Setup & breakdown",
      ],
      isActive: true,
      isFeatured: false,
    },
  ]);
  console.log(`📦  ${packages.length} packages created`);

  // ── Sample Bookings ───────────────────────────────────────────────────────
  const future = (months) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d;
  };

  await Booking.insertMany([
    {
      customerId: customer1._id,
      packageId: packages[0]._id,
      eventDate: future(2),
      guestCount: 150,
      venue: "The Grand Ballroom, Makati Shangri-La",
      status: "CONFIRMED",
      totalAmount: 85000,
      notes: "Please prepare halal options for 20 guests. Bride prefers white floral arrangements.",
    },
    {
      customerId: customer1._id,
      packageId: packages[3]._id,
      eventDate: future(1),
      guestCount: 80,
      venue: "Camilo Corp HQ, Ortigas Center",
      status: "PAID",
      totalAmount: 35000,
      notes: "Annual company lunch. Vegetarian options needed for 10 attendees.",
    },
    {
      customerId: customer2._id,
      packageId: packages[1]._id,
      eventDate: future(3),
      guestCount: 200,
      venue: "Fairmont Hotel Manila, BGC",
      status: "PENDING",
      totalAmount: 150000,
      notes: "Garden ceremony followed by indoor reception.",
    },
    {
      customerId: customer2._id,
      packageId: packages[5]._id,
      eventDate: future(1),
      guestCount: 50,
      venue: "Private Residence, Alabang",
      status: "CONFIRMED",
      totalAmount: 25000,
    },
    {
      customerId: customer1._id,
      packageId: packages[4]._id,
      eventDate: future(4),
      guestCount: 250,
      venue: "SMX Convention Center, Pasay",
      status: "PENDING",
      totalAmount: 95000,
      notes: "Annual company gala. Theme: Black & Gold.",
    },
  ]);
  console.log(`📅  ${await Booking.countDocuments()} bookings created`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌱  Seed complete! Login credentials (password: password123)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ADMIN    →  admin@camilocatering.com  / password123");
  console.log("  STAFF    →  staff@camilocatering.com  / password123");
  console.log("  CUSTOMER →  juan@example.com          / password123");
  console.log("  CUSTOMER →  maria@example.com         / password123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
