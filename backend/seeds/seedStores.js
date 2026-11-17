require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const connectDB = require('../config/db');
const Store = require('../models/Store');

const stores = [
  {
    name: 'Aurelia — Jaipur MI Road',
    address: 'MI Road, Panch Batti, Jaipur, Rajasthan 302001',
    city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
    phone: '0141 222 3456', email: 'jaipur@aurelia.com',
    location: { type: 'Point', coordinates: [75.8090, 26.9124] },
    features: ['Bridal Stylist', 'Try at Home', 'Digital Gold'],
  },
  {
    name: 'Aurelia — Mumbai Bandra',
    address: 'Linking Road, Bandra West, Mumbai 400050',
    city: 'Mumbai', state: 'Maharashtra', pincode: '400050',
    phone: '022 2640 1122', email: 'mumbai@aurelia.com',
    location: { type: 'Point', coordinates: [72.8330, 19.0596] },
    features: ['Bridal Stylist', 'Try at Home', 'Valet Parking'],
  },
  {
    name: 'Aurelia — Delhi CP',
    address: 'A-12 Connaught Place, New Delhi 110001',
    city: 'Delhi', state: 'Delhi', pincode: '110001',
    phone: '011 2341 8800', email: 'delhi@aurelia.com',
    location: { type: 'Point', coordinates: [77.2167, 28.6315] },
    features: ['Bridal Stylist', 'Digital Gold', 'Repairs'],
  },
  {
    name: 'Aurelia — Bangalore MG Road',
    address: '85 MG Road, Bengaluru 560001',
    city: 'Bangalore', state: 'Karnataka', pincode: '560001',
    phone: '080 2558 4477', email: 'bangalore@aurelia.com',
    location: { type: 'Point', coordinates: [77.6097, 12.9750] },
    features: ['Try at Home', 'Digital Gold'],
  },
  {
    name: 'Aurelia — Chennai T Nagar',
    address: 'Pondy Bazaar, T Nagar, Chennai 600017',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600017',
    phone: '044 2433 9911', email: 'chennai@aurelia.com',
    location: { type: 'Point', coordinates: [80.2330, 13.0418] },
    features: ['Bridal Stylist', 'Repairs'],
  },
  {
    name: 'Aurelia — Hyderabad Banjara',
    address: 'Road No 12, Banjara Hills, Hyderabad 500034',
    city: 'Hyderabad', state: 'Telangana', pincode: '500034',
    phone: '040 2354 2200', email: 'hyderabad@aurelia.com',
    location: { type: 'Point', coordinates: [78.4347, 17.4156] },
    features: ['Bridal Stylist', 'Try at Home', 'Digital Gold'],
  },
];

const run = async () => {
  await connectDB();

  console.log(`Seeding ${stores.length} stores...`);
  await Store.deleteMany({});
  await Store.insertMany(stores.map((s) => ({ ...s, slug: slugify(s.name, { lower: true, strict: true }) })));
  console.log(`✓ Inserted ${stores.length} stores`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
