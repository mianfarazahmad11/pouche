const mongoose = require('mongoose');

async function checkProducts() {
    try {
        await  await mongoose.connect(process.env.MONGODB_URI);
        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        
        const count = await Product.countDocuments();
        console.log(`Total products: ${count}`);
        
        const products = await Product.find().sort({ createdAt: -1 }).limit(10);
        products.forEach(p => {
            console.log(`- ${p.name} (Created: ${p.createdAt})`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkProducts();
