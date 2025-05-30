import eventsRoutes from "./events.js";
import usersRoutes from "./users.js";
import commentsRoutes from "./comments.js";
import likesRoutes from "./likes.js";
import reportsRoutes from "./reports.js";
import chartRoutes from "./chart.js";
import agentRoutes from "./agent.js";
import {
  requireLogin,
  requireNotLogin,
  redirectLogin,
  ifLoggedRedirectHome,
  ifNotLoggedRedirectHome,
  attachUser,
} from "../middleware/auth.js";

// const constructorMethod = app => {
// 	app.use("/events", eventsRoutes);
// 	app.use("/users", usersRoutes);
// 	app.use("/comments", commentsRoutes);
// 	app.use("/likes", likesRoutes);

// 	app.use("*", (req, res) => {
// 		return res.status(404).json({ error: "Route Not found" });
// 	});
// };

const constructorMethod = (app) => {
  // API路由
  app.use("/api/events", eventsRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/comments", commentsRoutes);
  app.use("/api/likes", likesRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/chart", chartRoutes);
  app.use("/api/agent", agentRoutes);

  // 页面路由
  app.get("/", attachUser, (req, res) => {
    res.render("home", {
      title: "Home",
      isHome: true,
      user: req.user,
    });
  });

  app.get("/event", attachUser, (req, res) => {
    res.render("event", {
      title: "Events",
      isEvent: true,
      user: req.user,
    });
  });

  app.get("/chart", attachUser, (req, res) => {
    res.render("chart", {
      title: "Chart",
      isChart: true,
      user: req.user,
    });
  });

  app.get("/about", attachUser, (req, res) => {
    res.render("about", {
      title: "About",
      isAbout: true,
      user: req.user,
    });
  });

  app.get("/login", ifLoggedRedirectHome, (req, res) => {
    res.render("login", {
      title: "Login",
    });
  });

  app.get("/signup", ifLoggedRedirectHome, (req, res) => {
    res.render("signup", {
      title: "Sign Up",
    });
  });

  app.get("/logout", redirectLogin, attachUser, (req, res) => {
    res.render("logout", {
      title: "Log Out",
      user: req.user,
    });
  });

  app.get("/profile", redirectLogin, attachUser, (req, res) => {
    res.render("profile", {
      title: "Profile",
      user: req.user,
    });
  });

  app.get("/profile/myevents", redirectLogin, attachUser, (req, res) => {
    res.render("profile_myevents", {
      title: "My Events",
      user: req.user,
    });
  });
  app.get("/profile/mylikes", redirectLogin, attachUser, (req, res) => {
    res.render("profile_mylikes", {
      title: "My Likes",
      user: req.user,
    });
  });
  app.get("/profile/mycomments", redirectLogin, attachUser, (req, res) => {
    res.render("profile_mycomments", {
      title: "My Comments",
      user: req.user,
    });
  });

  app.use("*", (req, res) => {
    return res.status(404).render("error", {
      title: "Not Found",
      error: "Page Not Found",
      centeredContent: true,
    });
  });
};

export default constructorMethod;
