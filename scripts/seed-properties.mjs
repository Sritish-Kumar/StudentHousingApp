import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/mydatabase";

// Models
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["USER", "LANDLORD", "ADMIN"],
      default: "USER",
    },
    mobileNumber: String,
  },
  { timestamps: true },
);

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "UNISEX"],
      required: true,
    },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    college: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verified: { type: Boolean, default: false },
    distance: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PropertySchema.index({ location: "2dsphere" });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Property =
  mongoose.models.Property || mongoose.model("Property", PropertySchema);

// Mock Data
const mockLandlords = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.landlord@example.com",
    password: "password123",
    role: "LANDLORD",
    mobileNumber: "9876543210",
  },
  {
    name: "Priya Sharma",
    email: "priya.landlord@example.com",
    password: "password123",
    role: "LANDLORD",
    mobileNumber: "9876543211",
  },
  {
    name: "Amit Patel",
    email: "amit.landlord@example.com",
    password: "password123",
    role: "LANDLORD",
    mobileNumber: "9876543212",
  },
];

// Using Unsplash placeholder images for properties
const mockProperties = [
  {
    title: "Modern Studio Apartment near DU",
    description:
      "Fully furnished studio apartment with modern amenities, perfect for students. Located just 5 minutes walk from Delhi University North Campus. Includes 24/7 security, power backup, and high-speed WiFi.",
    address: "23, Kamla Nagar, Near North Campus, Delhi University, Delhi - 110007",
    price: 12000,
    gender: "UNISEX",
    amenities: ["WiFi", "AC", "Furnished", "Power Backup", "Security"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    ],
    location: { type: "Point", coordinates: [77.209, 28.6945] }, // Delhi University
    college: "Delhi University",
    verified: true,
    distance: 0.5,
    landlordEmail: "rajesh.landlord@example.com",
  },
  {
    title: "Spacious 2BHK for Female Students",
    description:
      "Safe and secure accommodation for female students near IIT Delhi. Includes separate kitchen, attached bathrooms, and common study area. Mess facility available.",
    address: "45, Hauz Khas Village, Near IIT Delhi Main Gate, New Delhi - 110016",
    price: 18000,
    gender: "FEMALE",
    amenities: ["WiFi", "Mess", "Laundry", "Study Room", "CCTV", "Gym"],
    images: [
      "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556912998-c57cc6b63cd7?w=800&h=600&fit=crop",
    ],
    location: { type: "Point", coordinates: [77.1925, 28.5449] }, // IIT Delhi
    college: "IIT Delhi",
    verified: true,
    distance: 1.2,
    landlordEmail: "priya.landlord@example.com",
  },
  {
    title: "Budget-Friendly PG for Boys",
    description:
      "Affordable paying guest accommodation near Jamia Millia Islamia. Triple sharing rooms with basic amenities. Ideal for budget-conscious students.",
    address: "12, Okhla Road, Jamia Nagar, Near Jamia Millia Islamia, New Delhi - 110025",
    price: 7500,
    gender: "MALE",
    amenities: ["WiFi", "Meals", "Laundry", "Hot Water"],
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop",
    ],
    location: { type: "Point", coordinates: [77.2813, 28.5615] }, // Jamia
    college: "Jamia Millia Islamia",
    verified: false,
    distance: 0.8,
    landlordEmail: "amit.landlord@example.com",
  },
  {
    title: "Luxury 3BHK Apartment - JNU",
    description:
      "Premium fully furnished 3BHK apartment near Jawaharlal Nehru University. Perfect for group of 4-5 students. Includes modular kitchen, balcony, and parking space.",
    address: "78, Munirka Village, Near JNU West Gate, New Delhi - 110067",
    price: 35000,
    gender: "UNISEX",
    amenities: [
      "WiFi",
      "AC",
      "Parking",
      "Balcony",
      "Modular Kitchen",
      "Washing Machine",
      "Refrigerator",
    ],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556912998-c57cc6b63cd7?w=800&h=600&fit=crop",
    ],
    location: { type: "Point", coordinates: [77.1671, 28.5403] }, // JNU
    college: "Jawaharlal Nehru University",
    verified: true,
    distance: 0.3,
    landlordEmail: "rajesh.landlord@example.com",
  },
  {
    title: "Cozy Single Room - AIIMS",
    description:
      "Single occupancy room for medical students near AIIMS Delhi. Quiet environment, perfect for studies. Includes attached bathroom and study table.",
    address: "34, Ansari Nagar East, Near AIIMS Main Gate, New Delhi - 110029",
    price: 15000,
    gender: "UNISEX",
    amenities: ["WiFi", "AC", "Attached Bathroom", "Study Table", "Wardrobe"],
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop",
    ],
    location: { type: "Point", coordinates: [77.209, 28.5672] }, // AIIMS
    college: "AIIMS Delhi",
    verified: true,
    distance: 0.6,
    landlordEmail: "priya.landlord@example.com",
  },
  {
    title: "Girls Hostel - DTU",
    description:
      "Safe and comfortable girls hostel near Delhi Technological University. Includes mess, common room, and 24/7 security with CCTV surveillance.",
    address: "56, Rohini Sector 18, Near DTU Campus, Delhi - 110042",
    price: 10000,
    gender: "FEMALE",
    amenities: [
      "WiFi",
      "Mess",
      "Common Room",
      "CCTV",
      "Security Guard",
      "Laundry",
    ],
    images: [
      "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&h=600&fit=crop",
    ],
    location: { type: "Point", coordinates: [77.1134, 28.7501] }, // DTU
    college: "Delhi Technological University",
    verified: false,
    distance: 1.5,
    landlordEmail: "priya.landlord@example.com",
  },
  {
    title: "Shared Apartment - Amity University",
    description:
      "Well-maintained shared apartment for 3 students near Amity University Noida. Spacious rooms with modern furnishings and all essential amenities.",
    address: "89, Sector 125, Near Amity University, Noida, Uttar Pradesh - 201303",
    price: 9000,
    gender: "MALE",
    amenities: [
      "WiFi",
      "Furnished",
      "Refrigerator",
      "Gas Connection",
      "Water Purifier",
    ],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    ],
    location: { type: "Point", coordinates: [77.3753, 28.5494] }, // Amity Noida
    college: "Amity University Noida",
    verified: true,
    distance: 2.0,
    landlordEmail: "amit.landlord@example.com",
  },
  {
    title: "Premium Studio - Shiv Nadar University",
    description:
      "Brand new premium studio apartment near Shiv Nadar University. Fully automated with smart home features, gym access, and swimming pool.",
    address: "101, Knowledge Park III, Greater Noida, Near Shiv Nadar University, UP - 201308",
    price: 25000,
    gender: "UNISEX",
    amenities: [
      "WiFi",
      "AC",
      "Gym",
      "Swimming Pool",
      "Smart Home",
      "Parking",
      "Security",
    ],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800&h=600&fit=crop",
    ],
    location: { type: "Point", coordinates: [77.5946, 28.367] }, // Shiv Nadar
    college: "Shiv Nadar University",
    verified: true,
    distance: 0.4,
    landlordEmail: "rajesh.landlord@example.com",
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Property.deleteMany({});
    await User.deleteMany({
      email: { $in: mockLandlords.map((l) => l.email) },
    });
    console.log("✅ Existing data cleared\n");

    // Create landlords
    console.log("👤 Creating landlords...");
    const createdLandlords = [];
    for (const landlord of mockLandlords) {
      const hashedPassword = await bcrypt.hash(landlord.password, 10);
      const user = await User.create({
        ...landlord,
        password: hashedPassword,
      });
      createdLandlords.push(user);
      console.log(`   ✓ Created: ${user.name} (${user.email})`);
    }
    console.log(`✅ Created ${createdLandlords.length} landlords\n`);

    // Create properties
    console.log("🏠 Creating properties...");
    const createdProperties = [];
    for (const property of mockProperties) {
      const landlord = createdLandlords.find(
        (l) => l.email === property.landlordEmail,
      );
      if (!landlord) {
        console.log(
          `   ⚠️  Skipping property: ${property.title} (landlord not found)`,
        );
        continue;
      }

      const { landlordEmail, ...propertyData } = property;
      const newProperty = await Property.create({
        ...propertyData,
        owner: landlord._id,
      });
      createdProperties.push(newProperty);
      console.log(`   ✓ Created: ${newProperty.title}`);
      console.log(`      - Price: ₹${newProperty.price}/month`);
      console.log(`      - College: ${newProperty.college}`);
      console.log(`      - Images: ${newProperty.images.length}`);
      console.log(`      - Verified: ${newProperty.verified ? "Yes" : "No"}\n`);
    }
    console.log(`✅ Created ${createdProperties.length} properties\n`);

    // Summary
    console.log("📊 Seeding Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Landlords: ${createdLandlords.length}`);
    console.log(`   Properties: ${createdProperties.length}`);
    console.log(
      `   Total Images: ${createdProperties.reduce((sum, p) => sum + p.images.length, 0)}`,
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("🔐 Landlord Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    mockLandlords.forEach((l) => {
      console.log(`   Email: ${l.email}`);
      console.log(`   Password: ${l.password}\n`);
    });

    console.log("✨ Database seeding completed successfully!");
    console.log("🚀 You can now login and test the application.\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  }
}

// Run the seed function
seedDatabase();
