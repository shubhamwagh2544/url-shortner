package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"github.com/shubhamwagh2544/url-shortner-go/routes"
)

func setUpRoutes(app *fiber.App) {
	app.Get("/url", routes.ResolveUrl)
	app.Get("/shorten", routes.ShortenUrl)
}

func main() {
	err := godotenv.Load()
	
	if err != nil {
		fmt.Println("error occurred while loading env file: ", err)
	}

	app := fiber.New()
	app.Use(logger.New())

	setUpRoutes(app)

	log.Fatal(app.Listen(os.Getenv("PORT")))
}