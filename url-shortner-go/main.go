package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"github.com/shubhamwagh2544/url-shortner-go/controllers"
	"github.com/shubhamwagh2544/url-shortner-go/db"
)

func connectDatabase() {
	err := db.ConnectToMongoDB(os.Getenv("MONGO_URL"))
	if err != nil {
		fmt.Println("error connecting to mongo: ", err)
		return
	}
}

func setUpRoutes(app *fiber.App) {
	app.Post("/url", controllers.GenerateShortenUrl)
	app.Get("/url/analytics/:shortId", controllers.GenerateAnalytics)
	app.Get("/:shortId", controllers.RedirectUrl)
}

func setUpFiberApp() {
	app := fiber.New()
	app.Use(logger.New())

	setUpRoutes(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = ":8001"
	}

	log.Fatal(app.Listen(port))
}

func loadEnv() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("error occurred while loading env file: ", err)
		return
	}
	fmt.Println("env variables loaded")
}

func main() {
	loadEnv()
	connectDatabase()
	setUpFiberApp()
}
