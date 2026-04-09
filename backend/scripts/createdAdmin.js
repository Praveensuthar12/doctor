const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../modal/Admin');
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
})
async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to mongo database');

    const exitingAdmin = await Admin.findOne({ email: 'admin1@doctorconsultation.com' });
    if (exitingAdmin) {
      console.log("Admin user already exists")
      process.exit(1);
    }
    const hashedPassword = await bcrypt.hash('admin@123', 12);

    const admin = new Admin({
      name: "System Administrator",
      email: "admin1@doctorconsultation.com",
      password: hashedPassword,
      role: "super_admin",
      isActive: true,
      permissions: {
        userManagement: true,
        doctorManagement: true,
        paymentManagement: true,
        analytics: true
      }
    })
    await admin.save();
    console.log('Admin user created successfully');
    console.log(admin.email);
    console.log(admin.password);
  } catch (error) {
    console.error("Error creating admin user", error)
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }

}

createAdmin();