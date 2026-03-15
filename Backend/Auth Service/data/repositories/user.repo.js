const createVisitor = (visitorName, phoneNumber) => {
  return {
    text: `INSERT INTO visitors(visitor_name, phone_number) VALUES($1, $2) RETURNING *`,
    values: [visitorName, phoneNumber],
  };
};

module.exports = {
  createVisitor,
};
