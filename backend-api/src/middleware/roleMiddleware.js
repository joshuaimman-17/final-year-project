const checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
};

const checkExpert = (req, res, next) => {
  if (req.user && req.user.role === 'expert' && req.user.expert_status === 'approved') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Expert access required.' });
  }
};

const checkCustomer = (req, res, next) => {
  // Customers are standard users. Wait, if someone is an admin, they might also be able to access customer routes, 
  // but the prompt says: "Customer routes must block admin actions".
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Customer access required.' });
  }
};

module.exports = {
  checkAdmin,
  checkExpert,
  checkCustomer
};
