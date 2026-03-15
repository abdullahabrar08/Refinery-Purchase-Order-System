const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const setupSwaggerDocs = (app) => {
  app.use(
    "/users/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      swaggerOptions: {
        url: "/users/api-docs/swagger.json", // Makes sure Swagger UI fetches from this endpoint
      },
    })
  );
};


module.exports = {
  setupSwaggerDocs,
};
