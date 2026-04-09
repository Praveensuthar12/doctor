const jwt = require('jsonwebtoken');
const Doctor = require('../modal/Doctor');
const Patient = require('../modal/Patient');
const Admin = require('../modal/Admin');

module.exports = {
    authenticate: async (req, res, next) => {
        try {
            const header = req.headers.authorization;

            if (!header || !header.startsWith('Bearer ')) {
                return res.unauthorized('Missing token');
            }

            const token = header.slice(7);
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.auth = decode;

            if (decode.type === 'doctor') {
                req.user = await Doctor.findById(decode.id);
            } else if (decode.type === 'patient') {
                req.user = await Patient.findById(decode.id);
            } else if (decode.type === 'admin') {
                req.user = await Admin.findById(decode.id);
            }

            if (!req.user) return res.unauthorized("Invalid user");
            next();
        } catch (error) {
            return res.unauthorized("Invalid or expired token");
        }
    },

    requireRole: role => (req, res, next) => {
        if (!req.auth || req.auth.type !== role) {
            return res.forbidden("Insufficient role permissions");
        }
        next();
    },

    requireAdmin: (req, res, next) => {
        if (!req.auth || req.auth.type !== 'admin') {
            return res.forbidden("Admin access required");
        }

        if (!req.user || !req.user.isActive) {
            return res.forbidden("Admin account is inactive");
        }

        next();
    },

    requirePermission: (permission) => (req, res, next) => {
        if (!req.user || !req.user.permissions || !req.user.permissions[permission]) {
            return res.forbidden(`Permission required: ${permission}`);
        }
        next();
    }
}



// const jwt = require('jsonwebtoken');
// const Doctor = require('../modal/Doctor');
// const Patient = require('../modal/Patient');
// const Admin = require('../modal/Admin');


// module.exports = {
//     authenticate: async (req, res, next) => {
//         try {
//             const header = req.headers.authorization;
//             const token = header.startsWith('Bearer ') ? header.slice(7) : null;
//             if (!token) return res.unauthorized('Missing token');

//             const decode = jwt.verify(token, process.env.JWT_SECRET);
//             req.auth = decode;

//             if (decode.type === 'doctor') {
//                 req.user = await Doctor.findById(decode.id);
//             } else if (decode.type === 'patient') {
//                 req.user = await Patient.findById(decode.id);
//             } else if (decode.type === 'admin') {
//                 req.user = await Admin.findById(decode.id)
//             }

//             if (!req.user) return res.unauthorized("Invalid user");
//             next();
//         } catch (error) {
//             return res.unauthorized("Invalid or expired token");
//         }
//     },
//     requireRole: role => (req, res, next) => {
//         if (!req.auth || req.auth.type !== role) {
//             return res.forbidden("Insufficient role permissions");
//         }
//         next();
//     },
//     requireAdmin: (req, res, next) => {
//         if (!req.auth || req.auth.type !== 'admin') {
//             return res.forbidden("Admin access required")
//         }

//         if (!req.user || !req.user.isActive) {
//             return res.forbidden("Admin account is inactive")
//         }

//         next();
//     },
//     requirePermission: (permission) => (req, res, next) => {
//         if (!req.user || !req.user.permissions || !req.user.permissions[permission]) {
//             return res.forbidden(`Permission required: ${permission}`)
//         }
//         next();
//     }
// }