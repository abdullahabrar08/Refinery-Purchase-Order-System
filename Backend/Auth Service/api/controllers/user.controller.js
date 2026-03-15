const { UserService } = require("../../services/user.service");

const login = async (req, res, next) => {
  try {
    const user = await UserService.login(req);

    return res.status(200).send({
      responseCode: 2000,
      message: "Logged in Successfull",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};
