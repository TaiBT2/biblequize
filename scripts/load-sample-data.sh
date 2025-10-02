#!/bin/bash

# Script to load sample data into the database
echo "Loading sample data into Bible Quiz database..."

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
until docker exec biblequiz-mysql mysqladmin ping -h localhost --silent; do
    echo "Waiting for MySQL..."
    sleep 2
done

echo "MySQL is ready!"

# Load the sample data
echo "Loading sample data..."
docker exec -i biblequiz-mysql mysql -u root -prootpassword biblequiz < scripts/insert-sample-data.sql

echo "Sample data loaded successfully!"
echo "Books: 66 books (Old Testament: 39, New Testament: 27)"
echo "Questions: 50 questions covering Genesis, Exodus, Matthew, John, and Acts"
echo ""
echo "You can now test the application with real data!"
