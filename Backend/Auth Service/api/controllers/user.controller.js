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

const getUsers = async (req, res, next) => {
  try {
    const users = await UserService.getUsers();

    return res.status(200).send({
      responseCode: 2000,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await UserService.getUser(req);

    return res.status(200).send({
      responseCode: 2000,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getUsers,
  getUserById,
};
