require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/listing');

const dbUrl = process.env.ATLASDB_URL;

async function fixGeometry() {
    try {
        await mongoose.connect(dbUrl);
        console.log('Connected to database');
        
        // Find listings without geometry
        const listingsWithoutGeometry = await Listing.find({
            $or: [
                { geometry: { $exists: false } },
                { 'geometry.type': { $exists: false } },
                { 'geometry.coordinates': { $exists: false } }
            ]
        });
        
        console.log(`Found ${listingsWithoutGeometry.length} listings without geometry`);
        
        // Update each listing
        for (let listing of listingsWithoutGeometry) {
            listing.geometry = {
                type: 'Point',
                coordinates: [0, 0] // Default coordinates
            };
            await listing.save({ validateBeforeSave: false });
            console.log(`Fixed listing: ${listing.title}`);
        }
        
        console.log('All listings fixed!');
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixGeometry();
