package db

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client

func ConnectToMongoDB(url string) error {
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, 10 * time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(url).SetMaxPoolSize(20)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return fmt.Errorf("error connecting to mongo: %v", err)
	}
	Client = client
	fmt.Println("mongodb connected succcessfully");
	return nil
}