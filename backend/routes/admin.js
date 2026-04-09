const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../modal/Admin.js");
const { authenticate, requireAdmin, requirePermission } = require("../middleware/auth");
const Patient = require("../modal/Patient.js");
const Doctor = require("../modal/Doctor.js");
const Appointment = require("../modal/Appointment.js");

const router = express.Router();

const signToken = (id, type) =>
  jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post(
  "/auth/login",
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  async (req, res) => {
    try {
      const admin = await Admin.findOne({ email: req.body.email });
      if (!admin || !admin.isActive) {
        return res.forbidden("Invalid creadentials or inactive account");
      }

      const validatePassword = await bcrypt.compare(
        req.body.password,
        admin.password
      );

      if (!validatePassword) {
        return res.unauthorized("Invalid Creadentials");
      }

      admin.lastLogin = new Date();
      await admin.save();

      const token = signToken(admin._id, "admin");

      res.ok(
        {
          token,
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
            type: "admin",
          },
        },
        "Admin login successfully"
      );
    } catch (error) {
      res.serverError("Login failed", [error.message]);
    }
  }
);

router.get("/profile", authenticate, requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select("-password");
    res.ok(admin, "Admin profile fetched successfully");
  } catch (error) {
    res.serverError("Profile fetched failed", [error.message]);
  }
});

router.get("/dashboard", authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      totalRevenue,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "completed" }),
      Appointment.countDocuments({ status: "Scheduled" }),
      Appointment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const monthlyRevenue = await Appointment.aggregate([
      {
        $match: {
          status: "Completed",
          createdAt: { $gte: sixMonthAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const [userGrowth, appointmentStats] = await Promise.all([
      Patient.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            Patients: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Appointment.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthAgo },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.ok(
      {
        stats: {
          totalPatients,
          totalDoctors,
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        monthlyRevenue,
        userGrowth,
        appointmentStats,
      },
      "DashBoard data fetched successfully"
    );
  } catch (error) {
    res.serverError("DashBoard data fetch failed ", [error.message]);
  }
});



// get all users
router.get(
  "/users",
  authenticate,
  requireAdmin,
  requirePermission("userManagement"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, type, search } = req.query;

      const skip = (page - 1) * limit;

      let query = {};

      if (type) {
        query = { ...query, type };
      }

      if (search) {
        query = {
          ...query,
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        };
      }

      const [patients, doctors] = await Promise.all([
        Patient.find(query)
          .select("-password")
          .skip(skip)
          .limit(parseInt(limit)),

        Doctor.find(query)
          .select("-password")
          .skip(skip)
          .limit(parseInt(limit)),
      ]);

      const users = [
        ...patients.map((p) => ({
          ...p.toObject(),
          type: "patient",
        })),
        ...doctors.map((d) => ({
          ...d.toObject(),
          type: "doctor",
        })),
      ];

      res.ok(users, "Users retrieved");
    } catch (error) {
      res.serverError("Failed to fetch users ", [error.message]);
    }
  }
);


// update user status
router.put(
  '/users/:userId/status',
  authenticate,
  requireAdmin,
  requirePermission('userManagement'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const patient = await Patient.findById(userId);
      const doctor = await Doctor.findById(userId);

      let updatedUser;

      if (patient) {
        updatedUser = await Patient.findByIdAndUpdate(
          userId,
          { isActive },
          { new: true }
        ).select('-password');

      } else if (doctor) {
        updatedUser = await Doctor.findByIdAndUpdate(
          userId,
          { isActive },
          { new: true }
        ).select('-password');

      } else {
        return res.notFound('User not found');
      }

      res.ok(updatedUser, 'User status updated');

    } catch (error) {
      res.serverError('Failed to update user status', [error.message]);
    }
  }
);

router.get(
  "/payments",
  authenticate,
  requireAdmin,
  requirePermission("paymentManagement"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, payoutStatus } = req.query;
      const skip = (page - 1) * limit;

      let matchedQuery = { paymentStatus: "Paid" };

      if (payoutStatus) {
        matchedQuery.payoutStatus = payoutStatus;
      }

      const appointments = await Appointment.aggregate([
        { $match: matchedQuery },

        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctor",
          },
        },
        { $unwind: "$doctor" },

        {
          $lookup: {
            from: "patients",
            localField: "patientId",
            foreignField: "_id",
            as: "patient",
          },
        },
        { $unwind: "$patient" },

        {
          $project: {
            _id: 1,
            date: 1,
            doctorName: "$doctor.name",
            doctorEmail: "$doctor.email",
            patientName: "$patient.name",
            patientEmail: "$patient.email",
            consultationFees: 1,
            platformFees: 1,
            totalAmount: 1,
            paymentStatus: 1,
            payoutStatus: {
              $ifNull: ["$payoutStatus", "Pending"],
            },
            payoutDate: 1,
            createdAt: 1,
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
      ]);

      res.ok(appointments, "Payment retrieved");
    } catch (error) {
      res.serverError("failed to fetch payments", [error.message]);
    }
  }
);



router.put(
  '/payments/:appointmentId/payout',
  authenticate,
  requireAdmin,
  requirePermission('paymentManagement'),
  async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { payoutStatus } = req.body;

      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        return res.notFound('Appointment not found');
      }

      if (appointment.paymentStatus !== 'Paid') {
        return res.badRequest(
          'Can only process payouts for paid appointments'
        );
      }

      const payoutAmount = appointment.consultationFees;
      const platformFees = appointment.platformFees;

      const updateData = {
        payoutStatus
      };

      if (payoutStatus === 'Paid') {
        updateData.payoutDate = new Date();
      }

      const updateAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        updateData,
        { new: true }
      )
        .populate('doctorId', 'name email')
        .populate('patientId', 'name email');

      res.ok(
        {
          ...updateAppointment.toObject(),
          payoutAmount,
          platformFees,
          message:
            payoutStatus === 'Paid'
              ? `Payout marked as paid. Doctor receives ₹${payoutAmount}, Platform keeps ₹${platformFees}`
              : `Payout ${payoutStatus.toLowerCase()} successfully`
        },
        `Payout ${payoutStatus.toLowerCase()} successfully`
      );
    } catch (error) {
      res.serverError('Failed to process payment', [error.message]);
    }
  }
);

module.exports = router;