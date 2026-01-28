# Mock Property Data - Quick Reference

## 🚀 How to Seed the Database

Run the following command from the project root:

```bash
node scripts/seed-properties.mjs
```

This will:

- Clear existing test data
- Create 3 landlord accounts
- Create 8 properties with images
- Display login credentials

---

## 👤 Landlord Accounts

### Landlord 1: Rajesh Kumar

- **Email:** `rajesh.landlord@example.com`
- **Password:** `password123`
- **Properties:** 3 properties
  - Modern Studio Apartment near DU
  - Luxury 3BHK Apartment - JNU
  - Premium Studio - Shiv Nadar University

### Landlord 2: Priya Sharma

- **Email:** `priya.landlord@example.com`
- **Password:** `password123`
- **Properties:** 3 properties
  - Spacious 2BHK for Female Students (IIT Delhi)
  - Cozy Single Room - AIIMS
  - Girls Hostel - DTU

### Landlord 3: Amit Patel

- **Email:** `amit.landlord@example.com`
- **Password:** `password123`
- **Properties:** 2 properties
  - Budget-Friendly PG for Boys (Jamia)
  - Shared Apartment - Amity University

---

## 🏠 Property Details

### 1. Modern Studio Apartment near DU

- **Price:** ₹12,000/month
- **Gender:** UNISEX
- **College:** Delhi University
- **Images:** 3 images
- **Amenities:** WiFi, AC, Furnished, Power Backup, Security
- **Status:** ✅ Verified
- **Distance:** 0.5 km

### 2. Spacious 2BHK for Female Students

- **Price:** ₹18,000/month
- **Gender:** FEMALE
- **College:** IIT Delhi
- **Images:** 4 images
- **Amenities:** WiFi, Mess, Laundry, Study Room, CCTV, Gym
- **Status:** ✅ Verified
- **Distance:** 1.2 km

### 3. Budget-Friendly PG for Boys

- **Price:** ₹7,500/month
- **Gender:** MALE
- **College:** Jamia Millia Islamia
- **Images:** 2 images
- **Amenities:** WiFi, Meals, Laundry, Hot Water
- **Status:** ⏳ Pending
- **Distance:** 0.8 km

### 4. Luxury 3BHK Apartment - JNU

- **Price:** ₹35,000/month
- **Gender:** UNISEX
- **College:** Jawaharlal Nehru University
- **Images:** 5 images
- **Amenities:** WiFi, AC, Parking, Balcony, Modular Kitchen, Washing Machine, Refrigerator
- **Status:** ✅ Verified
- **Distance:** 0.3 km

### 5. Cozy Single Room - AIIMS

- **Price:** ₹15,000/month
- **Gender:** UNISEX
- **College:** AIIMS Delhi
- **Images:** 3 images
- **Amenities:** WiFi, AC, Attached Bathroom, Study Table, Wardrobe
- **Status:** ✅ Verified
- **Distance:** 0.6 km

### 6. Girls Hostel - DTU

- **Price:** ₹10,000/month
- **Gender:** FEMALE
- **College:** Delhi Technological University
- **Images:** 2 images
- **Amenities:** WiFi, Mess, Common Room, CCTV, Security Guard, Laundry
- **Status:** ⏳ Pending
- **Distance:** 1.5 km

### 7. Shared Apartment - Amity University

- **Price:** ₹9,000/month
- **Gender:** MALE
- **College:** Amity University Noida
- **Images:** 3 images
- **Amenities:** WiFi, Furnished, Refrigerator, Gas Connection, Water Purifier
- **Status:** ✅ Verified
- **Distance:** 2.0 km

### 8. Premium Studio - Shiv Nadar University

- **Price:** ₹25,000/month
- **Gender:** UNISEX
- **College:** Shiv Nadar University
- **Images:** 4 images
- **Amenities:** WiFi, AC, Gym, Swimming Pool, Smart Home, Parking, Security
- **Status:** ✅ Verified
- **Distance:** 0.4 km

---

## 📊 Data Summary

- **Total Properties:** 8
- **Total Landlords:** 3
- **Total Images:** 26 images
- **Verified Properties:** 6
- **Pending Properties:** 2
- **Price Range:** ₹7,500 - ₹35,000/month
- **Gender Distribution:**
  - UNISEX: 4 properties
  - FEMALE: 2 properties
  - MALE: 2 properties

---

## 🧪 Testing Workflow

1. **Seed the database:**

   ```bash
   node scripts/seed-properties.mjs
   ```

2. **Login as a landlord:**
   - Go to your app's login page
   - Use any landlord credentials above
   - Example: `rajesh.landlord@example.com` / `password123`

3. **View your properties:**
   - Navigate to `/landlord/dashboard`
   - You should see your properties with images

4. **Test creating a new property:**
   - Click "List New Property"
   - Fill out the form
   - Upload images using drag-and-drop
   - Submit and verify

5. **Test editing a property:**
   - Click "Edit" on any property
   - Modify details or images
   - Save and verify changes

6. **View properties as a user:**
   - Navigate to `/explore`
   - Browse all properties
   - Verify images display correctly

---

## 📸 Image Sources

All images are sourced from Unsplash (free stock photos) with the following categories:

- Modern apartments
- Student rooms
- Furnished accommodations
- Hostel facilities

The images are served via Unsplash's CDN with optimized dimensions (800x600).

---

## 🔄 Re-seeding

To clear and re-seed the database, simply run the seed script again:

```bash
node scripts/seed-properties.mjs
```

This will:

- Delete all existing test properties
- Delete all test landlord accounts
- Create fresh data

> **Note:** This only affects the test landlord accounts and their properties. It won't delete other users or properties.

---

## 💡 Tips

- **Different property types:** The mock data includes studios, PGs, hostels, and apartments
- **Various price points:** From budget (₹7,500) to premium (₹35,000)
- **Multiple colleges:** Properties near different universities in Delhi NCR
- **Image variety:** Different number of images per property (2-5 images)
- **Verification status:** Mix of verified and pending properties
- **Gender preferences:** Mix of male-only, female-only, and co-ed properties

This diverse dataset helps test all features of your application!
