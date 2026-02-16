package controllers

import (
	"context"
	"net/url"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/matoous/go-nanoid/v2"
	db "github.com/shubhamwagh2544/url-shortner-go/db"
	"github.com/shubhamwagh2544/url-shortner-go/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GenerateShortenUrl(c *fiber.Ctx) error {
	var body struct {
		URL string `json:"url"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"msg": "invalid request body"})
	}

	if strings.TrimSpace(body.URL) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"msg": "url field is mandatory"})
	}

	if _, err := url.ParseRequestURI(body.URL); err != nil {
		if _, err2 := url.ParseRequestURI("https://" + body.URL); err2 != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"msg": "invalid url format"})
		}
	}

	shortId, err := gonanoid.New(8)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"msg": "failed to generate id"})
	}

	col := db.Client.Database("url-shortner-go").Collection("urls")
	doc := models.Url{
		ShortId:      shortId,
		RedirectUrl:  body.URL,
		VisitHistory: []models.Visit{},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := col.InsertOne(ctx, doc); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"msg": "failed to create short url"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"id": shortId})
}

func GenerateAnalytics(c *fiber.Ctx) error {
	shortId := c.Params("shortId")

	if strings.TrimSpace(shortId) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"msg": "shortId field is mandatory"})
	}

	col := db.Client.Database("url-shortner-go").Collection("urls")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var entry models.Url

	if err := col.FindOne(ctx, bson.M{"shortId": shortId}).Decode(&entry); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"msg": "url record not found"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"totalClicks": len(entry.VisitHistory), "analytics": entry.VisitHistory})
}

func RedirectUrl(c *fiber.Ctx) error {
	shortId := c.Params("shortId")

	if strings.TrimSpace(shortId) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"msg": "shortId field is mandatory"})
	}

	col := db.Client.Database("url-shortner-go").Collection("urls")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{"$push": bson.M{"visitHistory": models.Visit{Timestamp: time.Now().Unix()}}}

	var updated models.Url
	err := col.FindOneAndUpdate(ctx,
		bson.M{"shortId": shortId},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&updated)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"msg": "url record do not exists"})
	}

	redirectUrl := updated.RedirectUrl

	if !strings.HasPrefix(strings.ToLower(redirectUrl), "http") {
		redirectUrl = "https://" + redirectUrl
	}

	return c.Redirect(redirectUrl)
}
