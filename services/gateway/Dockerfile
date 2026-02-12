# Stage 1 — Build the application
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

# Copy Maven wrapper and config first (for better Docker layer caching)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies separately to leverage cache
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src src

# Build the Quarkus application
RUN ./mvnw package -DskipTests


# Stage 2 — Runtime image
FROM eclipse-temurin:21-jre

WORKDIR /work

# Copy built application from build stage
COPY --from=build /build/target/quarkus-app/ /work/

EXPOSE 8080

# Run Quarkus
ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]

