router.get("/capabilities", (req, res) => {
  res.json({
    vita: true,
    auth: {
      login: process.env.AUTH_LOGIN_PATH || "/api/auth/login",
      register: process.env.AUTH_REGISTER_PATH || "/api/auth/register",
      me: process.env.AUTH_ME_PATH || "/api/auth/me"
    }
  });
});
