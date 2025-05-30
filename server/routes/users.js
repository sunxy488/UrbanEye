import { Router } from "express";
import { usersData, adCategoryData } from "../data/index.js";
import * as check from "../utils/helpers.js";
import { ObjectId } from "mongodb";
import { SESSION_COOKIE_NAME } from "../config/env.js";
import {
  requireLogin,
  requireNotLogin,
  redirectLogin,
  attachUser,
} from "../middleware/auth.js";
import { ENABLE_AUTH_CHECK } from "../config/env.js";
import xss from "xss";

const router = Router();

router
  .route("/")

  // createUser
  .post(async (req, res) => {
    let userName = xss(req.body.userName);
    let name = xss(req.body.name);
    let password = xss(req.body.password);
    let introduction = xss(req.body.introduction);
    let sex = xss(req.body.sex);
    let email = xss(req.body.email);
    let phone = xss(req.body.phone);
    if (!userName || !password) {
      return res.status(400).json({
        code: 400,
        message: "There are no fields in the request body",
      });
    }

    try {
      userName = check.validateUserName(userName);
      name = check.validateName(name);
      password = check.validatePassword(password);
      introduction = check.validateIntroduction(introduction);
      sex = check.validateSex(sex);
      email = check.validateEmail(email);
      phone = check.validatePhone(phone);
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }

    try {
      const user = await usersData.createUser(
        userName,
        name,
        password,
        introduction,
        sex,
        email,
        phone
      );
      return res.status(200).json({
        code: 200,
        message: "success",
        data: usersData.filterUser(user),
      });
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }
  });

router
  .route("/login")

  .post(requireNotLogin, async (req, res) => {
    let userName = xss(req.body.userName);
    let password = xss(req.body.password);
    if (!userName || !password) {
      return res.status(400).json({
        code: 400,
        message: "There are no fields in the request body",
      });
    }

    try {
      userName = check.validateUserName(userName);
      password = check.validatePassword(password);
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }

    try {
      const returnId = await usersData.userCheckWithPwdUserName(
        userName,
        password
      );
      if (!returnId) {
        return res
          .status(404)
          .json({ code: 404, message: "Wrong username or password!" });
      } else {
        req.session.userId = returnId;

        return res
          .status(200)
          .json({ code: 200, message: "Login successfully!" });
      }
    } catch (e) {
      return res
        .status(500)
        .json({ code: 500, message: "Sorry, system authentication failed." });
    }
  });

router
  .route("/logout")

  .post(requireLogin, async (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).send("Logout failed");
      res.clearCookie(SESSION_COOKIE_NAME || "connect.sid");
      return res
        .status(200)
        .json({ code: 200, message: "Logout successfully!" });
    });
  });

router
  .route("/:userId")

  // getUser
  .get(async (req, res) => {
    let userId;
    try {
      userId = check.checkObjectId(xss(req.params.userId));
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }
    try {
      const user = await usersData.getUserByUserId(userId);
      return res.status(200).json({
        code: 200,
        message: "success",
        data: usersData.filterUser(user),
      });
    } catch (e) {
      return res.status(404).json({ code: 404, message: e.message });
    }
  })

  // removeUser (need password)
  .delete(requireLogin, async (req, res) => {
    let userId;
    try {
      userId = check.checkObjectId(xss(req.params.userId));
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }

    if (ENABLE_AUTH_CHECK) {
      if (req.session.userId !== userId) {
        return res
          .status(403)
          .json({ code: 403, message: "Forbidden! You are not authorized" });
      }
    }

    let password = xss(req.body.password);
    if (!password) {
      return res.status(400).json({
        code: 400,
        message: "There are no fields in the request body",
      });
    }

    try {
      password = check.validatePassword(password);
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }

    try {
      const checkStatus = await usersData.userCheckWithPwduserId(
        userId,
        password
      );
      if (!checkStatus) {
        return res.status(404).json({ code: 404, message: "Wrong password!" });
      }
    } catch (e) {
      return res
        .status(500)
        .json({ code: 500, message: "Sorry, system authentication failed." });
    }

    try {
      const deleteInfo = await usersData.removeUser(userId);

      req.session.destroy((err) => {
        if (err) return res.status(500).send("Logout failed");
        res.clearCookie(SESSION_COOKIE_NAME || "connect.sid");
        return res
          .status(200)
          .json({ code: 200, message: deleteInfo + "You will be logged out." });
      });
    } catch (e) {
      return res.status(404).json({ code: 404, message: e.message });
    }
  })

  // updateUser userName or password (need originalPassword)
  .post(requireLogin, async (req, res) => {
    let userId;
    try {
      userId = check.checkObjectId(xss(req.params.userId));
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }

    if (ENABLE_AUTH_CHECK) {
      if (req.session.userId !== userId) {
        return res
          .status(403)
          .json({ code: 403, message: "Forbidden! You are not authorized" });
      }
    }

    let userName = xss(req.body.userName);
    let password = xss(req.body.password);
    let originalPassword = xss(req.body.originalPassword);
    if (!password || !originalPassword) {
      return res.status(400).json({
        code: 400,
        message: "There are no fields in the request body",
      });
    }

    userName = null;

    try {
      // userName = check.checkStringAllowNull(userName, "UserName");
      password = check.validatePassword(password);
      originalPassword = check.validatePassword(originalPassword);
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }

    // if (userName === null && password === null) {
    //   return res
    //     .status(400)
    //     .json({ code: 400, message: "There are no fields to update" });
    // }

    // if (userName !== null && password !== null) {
    //   return res.status(400).json({
    //     code: 400,
    //     message: "Cannot update two fields at the same time",
    //   });
    // }

    if (password === null) {
      return res
        .status(400)
        .json({ code: 400, message: "There are no password to update" });
    }

    try {
      const checkStatus = await usersData.userCheckWithPwduserId(
        userId,
        originalPassword
      );
      if (!checkStatus) {
        return res.status(404).json({ code: 404, message: "Wrong password!" });
      }
    } catch (e) {
      return res
        .status(500)
        .json({ code: 500, message: "Sorry, system authentication failed." });
    }

    if (userName !== null) {
      try {
        await usersData.updateUserName(userId, userName);

        req.session.destroy((err) => {
          if (err) return res.status(500).send("Logout failed");
          res.clearCookie(SESSION_COOKIE_NAME || "connect.sid");
          return res.status(200).json({
            code: 200,
            message: "Update successfully! You will be logged out.",
          });
        });
      } catch (e) {
        return res.status(404).json({ code: 404, message: e.message });
      }
    }

    if (password !== null) {
      try {
        await usersData.updatePassword(userId, password);

        req.session.destroy((err) => {
          if (err) return res.status(500).send("Logout failed");
          res.clearCookie(SESSION_COOKIE_NAME || "connect.sid");
          return res.status(200).json({
            code: 200,
            message: "Update successfully! You will be logged out.",
          });
        });
      } catch (e) {
        return res.status(404).json({ code: 404, message: e.message });
      }
    }
  })

  // updateUser general information
  .put(requireLogin, async (req, res) => {
    let userId;
    try {
      userId = check.checkObjectId(xss(req.params.userId));
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }

    if (ENABLE_AUTH_CHECK) {
      if (req.session.userId !== userId) {
        return res
          .status(403)
          .json({ code: 403, message: "Forbidden! You are not authorized" });
      }
    }

    let name = xss(req.body.name);
    let sex = xss(req.body.sex);
    let email = xss(req.body.email);
    let phone = xss(req.body.phone);

    // only name is required
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: "Name is required",
      });
    }

    try {
      // userName = check.validateUserName(userName);
      name = check.validateName(name);
      // password = check.validatePassword(password);
      // introduction = check.validateIntroduction(introduction);
      sex = check.validateSex(sex);
      email = check.validateEmail(email);
      phone = check.validatePhone(phone);
    } catch (e) {
      return res.status(400).json({ code: 400, message: e.message });
    }

    try {
      const user = await usersData.updateUser(userId, name, sex, email, phone);
      return res.status(200).json({
        code: 200,
        message: "success",
        data: usersData.filterUser(user),
      });
    } catch (e) {
      return res.status(404).json({ code: 404, message: e.message });
    }
  });

router.route("/introduction/:userId").put(requireLogin, async (req, res) => {
  let userId;
  try {
    userId = check.checkObjectId(xss(req.params.userId));
  } catch (e) {
    return res.status(400).json({ code: 400, message: e.message });
  }

  if (ENABLE_AUTH_CHECK) {
    if (req.session.userId !== userId) {
      return res
        .status(403)
        .json({ code: 403, message: "Forbidden! You are not authorized" });
    }
  }

  let introduction = xss(req.body.introduction);

  // allow introduction to be empty
  if (introduction === undefined) {
    return res.status(400).json({
      code: 400,
      message: "There are no introduction in the request body",
    });
  }

  try {
    introduction = check.validateIntroduction(introduction);
  } catch (e) {
    return res.status(400).json({ code: 400, message: e.message });
  }

  try {
    const user = await usersData.updateIntroduction(userId, introduction);
    return res.status(200).json({
      code: 200,
      message: "success",
      data: usersData.filterUser(user),
    });
  } catch (e) {
    return res.status(404).json({ code: 404, message: e.message });
  }
});

router.route("/avatar/:userId").put(requireLogin, async (req, res) => {
  let userId;
  try {
    userId = check.checkObjectId(xss(req.params.userId));
  } catch (e) {
    return res.status(400).json({ code: 400, message: e.message });
  }

  if (ENABLE_AUTH_CHECK) {
    if (req.session.userId !== userId) {
      return res
        .status(403)
        .json({ code: 403, message: "Forbidden! You are not authorized" });
    }
  }

  let avatar = xss(req.body.avatar);
  if (!avatar) {
    return res.status(400).json({
      code: 400,
      message: "There are no fields in the request body",
    });
  }

  if (avatar === undefined) {
    return res.status(400).json({
      code: 400,
      message: "There are no avatar in the request body",
    });
  }

  try {
    avatar = check.checkStringAllowNull(avatar, "avatar");
  } catch (e) {
    return res.status(400).json({ code: 400, message: e.message });
  }

  try {
    const user = await usersData.updateAvatar(userId, avatar);
    return res.status(200).json({
      code: 200,
      message: "success",
      data: usersData.filterUser(user),
    });
  } catch (e) {
    return res.status(404).json({ code: 404, message: e.message });
  }
});

// GET user top category
router.route("/:userId/top-category").get(async (req, res) => {
  let checked_userId;
  try {
    checked_userId = check.checkObjectId(xss(req.params.userId));
  } catch (e) {
    return res.status(400).json({ code: 400, message: e.message });
  }

  if (ENABLE_AUTH_CHECK) {
    if (req.session.userId !== checked_userId) {
      return res
        .status(403)
        .json({ code: 403, message: "Forbidden! You are not authorized" });
    }
  }

  try {
    const topCategory = await adCategoryData.getTopCategories(checked_userId);

    return res.status(200).json({
      code: 200,
      message: "success",
      data: topCategory
    });
  } catch (e) {
    return res.status(500).json({ code: 500, message: e.message });
  }
});

export default router;
