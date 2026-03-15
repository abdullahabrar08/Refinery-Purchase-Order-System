const getLoginResponseDTO = (
  data,
  tillNumber,
  cloudSolutions,
  permissions = [],
  stores = [],
  storePermissions = [],
) => ({
  responseCode: 2000,
  message: "Login Successfull",
  data: {
    token: data.token,
    userId: data.user_id,
    userRoleId: data.user_role_id,
    username: data.first_name + " " + data.last_name,
    email: data.email,
    phone: data.phone,
    isVerified: data.is_verified,
    lastLogin: data.last_login,
    userProfileImage: data.user_profile_image,
    countryId: data.country_id,
    countryName: data.country_name,
    currencyCode: data.currency_code,
    currencySymbol: data.currency_symbol,
    userStatusId: data.user_status_id,
    userStatusName: data.user_status_name,
    tillNumber: tillNumber,
    parentUserRoleName: data.parent_user_role_name ?? null,
    parentUserRoleId: data.parent_user_role_id ?? null,
    cloudSolutions: cloudSolutions,
    permissions: permissions,
    stores: stores,
    storePermissions: storePermissions,
  },
});

/**
 * Format login response for Auth API (token + user).
 * @param {string} token - JWT
 * @param {object} user - Row with id, username, email, role_name
 */
const toLoginResponseDTO = (token, user) => ({
  token,
  user: {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role_name,
  },
});

module.exports = {
  getLoginResponseDTO,
  toLoginResponseDTO,
};
