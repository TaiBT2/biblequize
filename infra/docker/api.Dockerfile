# Build stage
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /build

# Copy only the API module to leverage Docker layer caching
COPY apps/api/pom.xml ./
COPY apps/api/src ./src

# Build the application (skip tests for faster builds)
RUN mvn -q -DskipTests clean package

# Runtime stage
FROM eclipse-temurin:17-jdk
WORKDIR /app

# Copy the fat JAR from the build stage
COPY --from=build /build/target/biblequiz-api-0.1.0.jar /app/app.jar

# Ensure CA certificates and timezone data are present for HTTPS (Google OAuth token endpoint)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates ca-certificates-java tzdata curl openssl \
    && update-ca-certificates \
    && /var/lib/dpkg/info/ca-certificates-java.postinst configure \
    && rm -rf /var/lib/apt/lists/*

# Copy and run Google CA import script
COPY scripts/import-google-ca.sh /tmp/import-google-ca.sh
RUN chmod +x /tmp/import-google-ca.sh && /tmp/import-google-ca.sh

EXPOSE 8080

# Pass additional JVM options via JAVA_OPTS if needed
ENV JAVA_OPTS="-Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts -Djavax.net.ssl.trustStorePassword=changeit -Dcom.sun.net.ssl.checkRevocation=false -Dtrust_all_cert=true"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

