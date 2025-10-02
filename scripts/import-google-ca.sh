#!/bin/bash

# Download Google's root CA certificate
echo "Downloading Google's root CA certificate..."

# Create temp directory
mkdir -p /tmp/certs

# Download Google's root CA from their public endpoint
curl -s "https://pki.goog/roots.pem" -o /tmp/certs/google-roots.pem

# Convert PEM to DER format
openssl x509 -in /tmp/certs/google-roots.pem -outform DER -out /tmp/certs/google-roots.der

# Import into Java truststore
echo "Importing Google root CA into Java truststore..."
keytool -import -alias google-root-ca -file /tmp/certs/google-roots.der -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt

# Also try to download and import individual Google certificates
echo "Downloading additional Google certificates..."

# Download Google Internet Authority G2
curl -s "https://pki.goog/gtsr1/GTSR1.crt" -o /tmp/certs/gtsr1.crt
keytool -import -alias google-gtsr1 -file /tmp/certs/gtsr1.crt -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt

# Download Google Internet Authority G3  
curl -s "https://pki.goog/gtsr2/GTSR2.crt" -o /tmp/certs/gtsr2.crt
keytool -import -alias google-gtsr2 -file /tmp/certs/gtsr2.crt -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt

# Download Google Internet Authority G4
curl -s "https://pki.goog/gtsr3/GTSR3.crt" -o /tmp/certs/gtsr3.crt
keytool -import -alias google-gtsr3 -file /tmp/certs/gtsr3.crt -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt

# Download Google Internet Authority G5
curl -s "https://pki.goog/gtsr4/GTSR4.crt" -o /tmp/certs/gtsr4.crt
keytool -import -alias google-gtsr4 -file /tmp/certs/gtsr4.crt -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt

echo "Google CA certificates imported successfully!"

# Clean up
rm -rf /tmp/certs
